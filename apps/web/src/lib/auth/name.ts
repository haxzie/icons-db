/**
 * Providers are inconsistent about names: GitHub users often have no profile
 * name (only a login), Google always has one, and magic-link signups start with
 * nothing but an email. Walk the candidates in order of how much a human would
 * recognise them and fall back to a tidied email local-part.
 */
export function resolveName(candidates: {
  name?: string | null;
  login?: string | null;
  email?: string | null;
}): string {
  const direct = clean(candidates.name);
  if (direct) return direct;

  const login = clean(candidates.login);
  if (login) return login;

  const local = candidates.email?.split("@")[0];
  const fromEmail = clean(prettifyLocalPart(local));
  if (fromEmail) return fromEmail;

  return "IconsDB user";
}

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** "ada.lovelace99" / "ada_lovelace" / "ada+icons" -> "Ada Lovelace". */
function prettifyLocalPart(local: string | undefined): string {
  if (!local) return "";
  return local
    .split("+")[0]
    .replace(/\d+$/, "")
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
