CREATE TABLE IF NOT EXISTS collections (
  prefix TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  total INTEGER NOT NULL,
  author_name TEXT,
  author_url TEXT,
  license_title TEXT,
  license_spdx TEXT,
  license_url TEXT,
  attribution INTEGER NOT NULL DEFAULT 0,
  homepage TEXT,
  category TEXT,
  palette INTEGER NOT NULL DEFAULT 0,
  height INTEGER,
  samples TEXT,
  version TEXT,
  suffixes TEXT
);

CREATE TABLE IF NOT EXISTS icons (
  id TEXT PRIMARY KEY,
  prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  ox INTEGER NOT NULL DEFAULT 0,
  oy INTEGER NOT NULL DEFAULT 0,
  rotate INTEGER NOT NULL DEFAULT 0,
  hflip INTEGER NOT NULL DEFAULT 0,
  vflip INTEGER NOT NULL DEFAULT 0,
  family TEXT NOT NULL,
  style TEXT NOT NULL,
  category TEXT,
  aliases TEXT
);

CREATE INDEX IF NOT EXISTS icons_prefix_name ON icons(prefix, name);
CREATE INDEX IF NOT EXISTS icons_prefix_family ON icons(prefix, family);
