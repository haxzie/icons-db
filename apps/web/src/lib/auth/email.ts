import type { Env } from "@/lib/env";

/** Must be a domain onboarded with `wrangler email sending enable iconsdb.app`. */
const FROM = { email: "login@iconsdb.app", name: "IconsDB" };

export async function sendMagicLinkEmail(env: Env, to: string, url: string, expiresInMinutes: number) {
  const isDev = process.env.NODE_ENV !== "production";
  try {
    if (!env.EMAIL) throw new Error("EMAIL binding is not configured");
    await env.EMAIL.send({
      to,
      from: FROM,
      subject: "Your IconsDB sign-in link",
      text: text(url, expiresInMinutes),
      html: html(url, expiresInMinutes),
    });
  } catch (err) {
    // Locally there is usually no onboarded sending domain, and a dropped link
    // means no way to sign in at all — so print it. In production a failed send
    // has to surface as an error rather than a silent "check your inbox".
    if (!isDev) throw err;
    console.warn(`[auth] email send failed (${String(err)}); magic link for ${to}: ${url}`);
  }
}

function text(url: string, minutes: number) {
  return [
    "Sign in to IconsDB",
    "",
    `Open this link to sign in. It expires in ${minutes} minutes and can only be used once:`,
    url,
    "",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");
}

function html(url: string, minutes: number) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2328">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
      <tr><td>
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600">Sign in to IconsDB</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#59636e">
          Click the button below to sign in. The link expires in ${minutes} minutes and can only be used once.
        </p>
        <a href="${escapeAttr(url)}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;font-size:15px;font-weight:500;padding:12px 24px;border-radius:999px">Sign in</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#8b949e">
          Or paste this into your browser:<br />
          <span style="word-break:break-all">${escapeText(url)}</span>
        </p>
        <p style="margin:24px 0 0;font-size:13px;color:#8b949e">
          If you didn't request this, you can safely ignore this email.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) => escapeText(s).replace(/"/g, "&quot;");
