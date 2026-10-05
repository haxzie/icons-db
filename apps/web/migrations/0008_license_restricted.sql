-- A licence that is not a licence. `attribution` is a two-state field meaning
-- "open, but credit the author" — neither state describes the app icons, where
-- there is no grant at all, so saying "attribution required" and saying "free
-- for commercial use" are both wrong. `restricted` is the honest third state.
--
-- `license_badge` exists because `license_title` can now be a sentence, and the
-- badge that renders it is a 10px pill.
ALTER TABLE collections ADD COLUMN restricted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE collections ADD COLUMN license_badge TEXT;
