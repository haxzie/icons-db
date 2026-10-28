import { describe, expect, it } from "vitest";
import { stemRange } from "./db";

/** The related-icons query used to say `family LIKE '<stem>-%'`. A bound LIKE
 *  pattern cannot drive an index seek, so SQLite scanned the whole icon set —
 *  16,347 rows to return 24. stemRange is the indexable equivalent, and the
 *  boundary characters are the whole trick. */
describe("stemRange", () => {
  it("brackets exactly the families LIKE '<stem>-%' would match", () => {
    const [lo, hi] = stemRange("home");
    const matches = (f: string) => f >= lo && f < hi;

    expect(matches("home-work")).toBe(true);
    expect(matches("home-")).toBe(true);
    expect(matches("home-app-logo")).toBe(true);

    // The stem itself is excluded, as `<stem>-%` requires the hyphen.
    expect(matches("home")).toBe(false);
    // Longer words sharing the stem are not siblings.
    expect(matches("homework")).toBe(false);
    expect(matches("homepage")).toBe(false);
    // '.' is 0x2E, one past '-', and must fall outside the range.
    expect(matches("home.work")).toBe(false);
    expect(matches("hom")).toBe(false);
    expect(matches("house-door")).toBe(false);
  });

  it("takes the stem from the first segment, as the old query did", () => {
    expect(stemRange("arrow-up-right")).toEqual(["arrow-", "arrow."]);
    expect(stemRange("home")).toEqual(["home-", "home."]);
  });

  it("uses a half-open range so the bounds never overlap a neighbour", () => {
    const [, hi] = stemRange("home");
    const [lo] = stemRange("home.x");
    expect(hi).toBe("home.");
    expect(lo).toBe("home.x-");
  });
});
