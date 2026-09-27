"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";

export const authClient = createAuthClient({
  // Forwards the signed `oauth_query` from the consent page automatically.
  plugins: [magicLinkClient(), oauthProviderClient()],
});

export const { signIn, signOut, useSession } = authClient;
