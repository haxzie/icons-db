-- Animated icons (SMIL inside the body, e.g. line-md, svg-spinners). Per icon,
-- because sets are mixed: eos-icons ships 10 animated icons among 253.
--
-- The body is the source of truth; this column is a materialised copy so SQL can
-- filter on it without a LIKE over 222k bodies. No index yet — nothing queries it
-- yet, and an index on a 1-byte column across every row is not free.
ALTER TABLE icons ADD COLUMN animated INTEGER NOT NULL DEFAULT 0;

-- A count, not a flag, so the library can say "46 of 46 animated".
ALTER TABLE collections ADD COLUMN animated INTEGER NOT NULL DEFAULT 0;
