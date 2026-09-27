/**
 * Validation for community icon-set submissions.
 *
 * Pure so it can be unit tested and shared: the dialog runs it to show errors
 * inline, and the server action runs it again because a client-side check is
 * only a convenience, never a guarantee.
 */

export type SetSubmission = {
  /** GitHub repository, normalised to https://github.com/<owner>/<repo>. */
  repo: string;
  /** Project homepage, or "" when the author didn't give one. */
  website: string;
  /** Author's X/Twitter handle without the @, or "" when not given. */
  twitter: string;
};

export type SubmissionErrors = Partial<Record<keyof SetSubmission, string>>;

/** What the submit action hands back: a success, field errors, or one message. */
export type SubmitSetResult = { ok: true } | { ok: false; error?: string; errors?: SubmissionErrors };

/** Trailing `.git`, `/`, and any deep path are all noise around owner/repo. */
const GITHUB_PATH = /^\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;
/** GitHub's own rule: 1-39 chars of alphanumerics or single hyphens. */
const OWNER = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;
const HANDLE = /^\w{1,15}$/;

function parseUrl(value: string): URL | null {
  // Authors type "github.com/foo/bar" as often as the full URL.
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

/**
 * Normalise a GitHub repo URL to its canonical form, or null if it isn't one.
 * Only github.com — a submission is meant to be a repo we can go and read.
 */
export function normalizeRepo(value: string): string | null {
  const url = parseUrl(value.trim());
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "github.com") return null;
  const m = GITHUB_PATH.exec(url.pathname);
  if (!m) return null;
  const [, owner, repo] = m;
  if (!OWNER.test(owner) || repo === "." || repo === "..") return null;
  return `https://github.com/${owner}/${repo}`;
}

/** Normalise a homepage to an absolute http(s) URL, or null if unusable. */
export function normalizeWebsite(value: string): string | null {
  const url = parseUrl(value.trim());
  if (!url) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  // A bare host with no dot ("localhost", "intranet") isn't reachable for us.
  if (!url.hostname.includes(".")) return null;
  return url.toString().replace(/\/$/, "");
}

/**
 * Accept "@foo", "foo", or a link to the profile; return the bare handle.
 * x.com and twitter.com are the same account namespace.
 */
export function normalizeTwitter(value: string): string | null {
  let handle = value.trim().replace(/^@/, "");
  if (/[/.]/.test(handle)) {
    const url = parseUrl(handle);
    const host = url?.hostname.toLowerCase().replace(/^www\./, "");
    if (!url || (host !== "x.com" && host !== "twitter.com")) return null;
    handle = url.pathname.replace(/^\//, "").replace(/\/$/, "");
  }
  return HANDLE.test(handle) ? handle : null;
}

/**
 * Validate a raw submission. The repo is the only required field — plenty of
 * good sets have no separate site and no X account, and demanding them would
 * just teach people to paste the repo URL three times.
 */
export function validateSubmission(raw: {
  repo: string;
  website: string;
  twitter: string;
}): { ok: true; value: SetSubmission } | { ok: false; errors: SubmissionErrors } {
  const errors: SubmissionErrors = {};

  const repo = normalizeRepo(raw.repo);
  if (!raw.repo.trim()) errors.repo = "A GitHub repository URL is required.";
  else if (!repo) errors.repo = "That doesn't look like a GitHub repository URL.";

  const website = raw.website.trim() ? normalizeWebsite(raw.website) : "";
  if (website === null) errors.website = "That doesn't look like a valid URL.";

  const twitter = raw.twitter.trim() ? normalizeTwitter(raw.twitter) : "";
  if (twitter === null) errors.twitter = "Use a handle like @iconsdb, or the profile URL.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { repo: repo!, website: website!, twitter: twitter! } };
}
