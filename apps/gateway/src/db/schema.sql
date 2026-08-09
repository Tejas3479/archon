CREATE TABLE IF NOT EXISTS clients (
  client_id TEXT PRIMARY KEY,
  client_secret_hash TEXT NOT NULL,
  redirect_uri TEXT,
  grant_types TEXT DEFAULT 'client_credentials',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS access_tokens (
  token_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  dpop_jkt TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cost_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS swarm_messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  payload TEXT NOT NULL,
  ttl INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS key_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signing_key TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_access_tokens_client ON access_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_expires ON access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_cost_ledger_user ON cost_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_swarm_messages_recipient ON swarm_messages(recipient);
