import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins/jwt";
import { magicLink } from "better-auth/plugins/magic-link";
import { nextCookies } from "better-auth/next-js";
import { mcp } from "@better-auth/mcp";
import type { Env } from "@/lib/env";
import { SITE } from "@/lib/site";
import { mirrorAvatar, isSelfHosted } from "./avatar";
import { sendMagicLinkEmail } from "./email";
import { resolveName } from "./name";
import { notifyMcpConnected, notifySignUp } from "./slack";

/**
 * Origin the auth server issues URLs for. Overridable so local development can
 * run on http://localhost (which also keeps cookies non-Secure and usable).
 */
export function authOrigin(env: Env): string {
  return (env.BETTER_AUTH_URL || SITE).replace(/\/+$/, "");
}

/** The MCP protected-resource identifier. Access tokens are bound to it. */
export function mcpResource(env: Env): string {
  return `${authOrigin(env)}/mcp`;
}

/** Scope an MCP client must hold to call the tools. */
export const MCP_SCOPE = "mcp:icons";

const MAGIC_LINK_TTL_SECONDS = 10 * 60;

export function createAuth(env: Env) {
  return betterAuth({
    appName: "IconsDB",
    baseURL: authOrigin(env),
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: [authOrigin(env)],

    advanced: {
      // Workers don't populate a remote address, so without this Better Auth
      // can't tell callers apart: rate limiting collapses into one shared
      // bucket per path (one noisy client locks out everybody) and sessions
      // record an all-zero IP. Cloudflare sets cf-connecting-ip at the edge.
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },

    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID ?? "",
        clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
        // GitHub users frequently leave their profile name blank; their login
        // is the recognisable handle to fall back to.
        mapProfileToUser: (profile) => ({
          name: resolveName({ name: profile.name, login: profile.login, email: profile.email }),
        }),
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        mapProfileToUser: (profile) => ({
          name: resolveName({ name: profile.name, email: profile.email }),
        }),
      },
    },

    plugins: [
      jwt(),
      magicLink({
        expiresIn: MAGIC_LINK_TTL_SECONDS,
        // Sign-in and sign-up are the same action: an unknown email creates the
        // account, which is why disableSignUp stays off.
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(env, email, url, MAGIC_LINK_TTL_SECONDS / 60);
        },
      }),
      mcp({
        loginPage: "/sign-in",
        consentPage: "/consent",
        resource: mcpResource(env),
        scopes: ["openid", "profile", "email", "offline_access", MCP_SCOPE],
        // MCP clients in the wild (Claude Code, Claude Desktop, Cursor) still
        // register dynamically; CIMD needs a DNS-pinning transport that Workers
        // can't provide, so DCR is how clients get a client_id here.
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultScopes: ["openid", "profile", "email", "offline_access", MCP_SCOPE],
      }),
      // Must stay last: it writes Set-Cookie onto the Next.js response.
      nextCookies(),
    ],

    hooks: {
      // Granting consent is the moment a user "connects" an MCP client, and the
      // OAuth provider owns that endpoint, so there is no database hook to use.
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/oauth2/consent") return;
        if (ctx.body?.accept !== true) return;
        const user = ctx.context.session?.user;
        const clientId = readClientId(ctx.body?.oauth_query);
        if (!user || !clientId) return;
        const client = await env.DB.prepare('SELECT name FROM "oauthClient" WHERE "clientId" = ?1')
          .bind(clientId)
          .first<{ name: string | null }>();
        await notifyMcpConnected(env, user, client?.name?.trim() || "an unnamed app");
      }),
    },

    databaseHooks: {
      user: {
        create: {
          // Magic-link signups arrive with no name at all.
          before: async (user) => ({
            data: { ...user, name: resolveName({ name: user.name, email: user.email }) },
          }),
          after: async (user, ctx) => {
            await adoptAvatar(env, user.id, user.image);
            await notifySignUp(env, user, providerFrom(ctx));
          },
        },
        update: {
          // Linking a social account later fills in a provider-hosted image.
          after: async (user) => {
            await adoptAvatar(env, user.id, user.image);
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Which sign-in route created this user, for the signup notification. Social
 * sign-ins land on `/callback/:id`; depending on how the router reports it the
 * provider is either in the params or in the concrete path, so check both.
 */
function providerFrom(ctx: { path?: string; params?: unknown } | null | undefined): string {
  const path = ctx?.path ?? "";
  if (path.startsWith("/callback")) {
    const params = ctx?.params as Record<string, string> | undefined;
    const id = params?.id;
    if (id) return id;
    const fromPath = path.match(/^\/callback\/([a-z0-9-]+)/i);
    if (fromPath) return fromPath[1];
  }
  if (path.includes("magic-link")) return "magic-link";
  return "unknown";
}

/** The consent POST carries the signed authorization query as a form string. */
function readClientId(oauthQuery: unknown): string | null {
  if (typeof oauthQuery !== "string") return null;
  return new URLSearchParams(oauthQuery.replace(/^\?/, "")).get("client_id");
}

/**
 * Pull a provider-hosted profile picture into R2 and point the user row at our
 * copy. Written with raw D1 rather than the adapter so it can't re-trigger the
 * update hook it is called from.
 */
async function adoptAvatar(env: Env, userId: string, image: string | null | undefined) {
  if (!image || isSelfHosted(image)) return;
  const hosted = await mirrorAvatar(env, userId, image);
  if (!hosted) return;
  await env.DB.prepare('UPDATE "user" SET image = ?1 WHERE id = ?2').bind(hosted, userId).run();
}
