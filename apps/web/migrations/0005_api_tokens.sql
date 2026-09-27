-- Personal access tokens: a user-minted alternative to the OAuth flow, for MCP
-- clients and scripts that can only send a static Authorization header.
-- Only the SHA-256 of the token is stored; the plaintext is shown once.
CREATE TABLE IF NOT EXISTS api_token (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Leading characters of the token, so the UI can tell two tokens apart.
  hint TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);

CREATE INDEX IF NOT EXISTS api_token_user_idx ON api_token (user_id);
