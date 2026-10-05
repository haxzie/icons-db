-- Raster (PNG) collections. Their icons carry no SVG body — the artwork lives in
-- R2 under raster/{prefix}/{variant}/{size}/{name}.png — so `body` is seeded as
-- '' and this flag is what the readers branch on. `body` stays NOT NULL rather
-- than being made nullable: rebuilding a 220k-row table remotely to relax a
-- constraint is a far worse trade than one explicit boolean.
ALTER TABLE icons ADD COLUMN raster INTEGER NOT NULL DEFAULT 0;
ALTER TABLE collections ADD COLUMN raster INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS icons_prefix_raster ON icons(prefix, raster);
