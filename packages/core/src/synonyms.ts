// Common icon-name synonyms so "plus" finds "add", "delete" finds "trash", etc.
// Groups are bidirectional; every term maps to the others in its group.
const GROUPS: string[][] = [
  ["plus", "add", "new", "create"],
  ["minus", "subtract", "remove"],
  ["trash", "delete", "bin", "garbage", "remove"],
  ["cog", "gear", "settings", "preferences", "config", "options"],
  ["search", "magnifier", "magnifying", "find", "zoom"],
  ["pencil", "edit", "write", "compose"],
  ["home", "house"],
  ["image", "photo", "picture", "gallery"],
  ["cart", "basket", "trolley"],
  ["heart", "like", "favorite", "favourite", "love"],
  ["star", "favorite", "favourite"],
  ["close", "cross", "cancel", "dismiss", "clear"],
  ["check", "tick", "done", "complete", "success", "confirm"],
  ["logout", "signout", "exit"],
  ["login", "signin"],
  ["mail", "email", "envelope", "message", "letter"],
  ["bell", "notification", "alert", "reminder"],
  ["user", "person", "account", "profile", "avatar"],
  ["users", "people", "group", "team", "contacts"],
  ["calendar", "date", "schedule", "event"],
  ["clock", "time", "timer", "watch"],
  ["download", "save"],
  ["upload", "publish"],
  ["link", "chain", "url", "hyperlink"],
  ["lock", "secure", "private", "padlock"],
  ["unlock", "unsecure"],
  ["eye", "view", "visible", "show", "preview"],
  ["phone", "call", "telephone", "mobile"],
  ["chat", "message", "comment", "bubble", "conversation"],
  ["menu", "hamburger", "bars"],
  ["grid", "apps", "dashboard"],
  ["filter", "funnel"],
  ["refresh", "reload", "sync", "update", "rotate"],
  ["play", "start"],
  ["pause", "stop"],
  ["arrow", "chevron", "caret", "direction"],
  ["dollar", "money", "cash", "currency", "payment"],
  ["cloud", "upload", "storage"],
  ["folder", "directory"],
  ["file", "document", "doc", "page"],
  ["copy", "duplicate", "clone"],
  ["share", "send"],
  ["info", "information", "about"],
  ["warning", "alert", "caution", "danger"],
  ["help", "question", "support", "faq"],
  ["cart", "shop", "store", "shopping"],
  ["power", "shutdown", "onoff"],
  ["moon", "dark", "night"],
  ["sun", "light", "brightness", "day"],
  ["location", "pin", "map", "marker", "place", "gps"],
  ["bookmark", "save", "flag"],
  ["gift", "present", "reward"],
];

const MAP = new Map<string, string[]>();
for (const g of GROUPS) {
  for (const term of g) {
    const others = g.filter((t) => t !== term);
    MAP.set(term, [...(MAP.get(term) ?? []), ...others]);
  }
}

/** Equivalent terms for a query token (empty if none). */
export function synonymsOf(token: string): string[] {
  return MAP.get(token) ?? [];
}
