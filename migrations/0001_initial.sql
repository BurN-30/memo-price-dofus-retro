-- Pénates · sync schema initial
-- Compte = identifiant secret 32 chars (URL-safe base64), pas de mot de passe ni email.
-- L'identifiant suffit comme preuve de propriété.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER
);

CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  blob_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);
