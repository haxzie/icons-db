-- Cost fix: three queries on the icon page were scanning a whole set to return a
-- handful of rows (measured: 16,347 rows read to return 4 variants), which made
-- D1 rows_read ~97% of the Cloudflare bill.

-- getVariants: WHERE prefix = ? AND family = ? ORDER BY name.
-- icons(prefix, family) alone could seek but not order, so SQLite preferred
-- icons_prefix_name -- which orders for free, then filters family across the
-- entire prefix. Carrying name in the index makes the seek and the order the
-- same choice.
CREATE INDEX IF NOT EXISTS icons_prefix_family_name ON icons(prefix, family, name);

-- getRelatedInSet's category half, once it is split out of the OR. family comes
-- before name so GROUP BY family is satisfied in index order: measured 2,398 rows
-- read against 4,284 for (prefix, category, name), for identical results.
CREATE INDEX IF NOT EXISTS icons_prefix_category_family_name ON icons(prefix, category, family, name);

-- Redundant now: a strict leading subset of icons_prefix_family_name.
DROP INDEX IF EXISTS icons_prefix_family;
