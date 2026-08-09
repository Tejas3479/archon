import { D1Database } from "@cloudflare/workers-types";

export interface Client {
  client_id: string;
  client_secret_hash: string;
  redirect_uri?: string;
  grant_types: string;
  created_at: string;
}

export interface AccessToken {
  token_id: string;
  client_id: string;
  user_id: string;
  scope: string;
  dpop_jkt: string;
  issued_at: string;
  expires_at: string;
  revoked: number;
}

export async function registerClient(
  db: D1Database,
  clientId: string,
  secretHash: string,
  redirectUri: string = ""
): Promise<boolean> {
  const query = `
    INSERT INTO clients (client_id, client_secret_hash, redirect_uri)
    VALUES (?, ?, ?)
    ON CONFLICT(client_id) DO UPDATE SET
      client_secret_hash = excluded.client_secret_hash,
      redirect_uri = excluded.redirect_uri
  `;
  const result = await db.prepare(query).bind(clientId, secretHash, redirectUri).run();
  return result.success;
}

export async function getClient(db: D1Database, clientId: string): Promise<Client | null> {
  const query = `SELECT * FROM clients WHERE client_id = ? LIMIT 1`;
  const client = await db.prepare(query).bind(clientId).first<Client>();
  return client || null;
}

export async function storeToken(
  db: D1Database,
  tokenId: string,
  clientId: string,
  userId: string,
  scope: string,
  dpopJkt: string,
  expiresInSec: number
): Promise<boolean> {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
  const query = `
    INSERT INTO access_tokens (token_id, client_id, user_id, scope, dpop_jkt, issued_at, expires_at, revoked)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `;
  const result = await db
    .prepare(query)
    .bind(tokenId, clientId, userId, scope, dpopJkt, issuedAt, expiresAt)
    .run();
  return result.success;
}

export async function findToken(db: D1Database, tokenId: string): Promise<AccessToken | null> {
  const query = `SELECT * FROM access_tokens WHERE token_id = ? LIMIT 1`;
  const token = await db.prepare(query).bind(tokenId).first<AccessToken>();
  return token || null;
}

export async function revokeToken(db: D1Database, tokenId: string): Promise<boolean> {
  const query = `UPDATE access_tokens SET revoked = 1 WHERE token_id = ?`;
  const result = await db.prepare(query).bind(tokenId).run();
  return result.success;
}

export async function pruneExpiredTokens(db: D1Database): Promise<boolean> {
  const now = new Date().toISOString();
  const query = `DELETE FROM access_tokens WHERE expires_at < ?`;
  const result = await db.prepare(query).bind(now).run();
  return result.success;
}

export async function storeSigningKey(db: D1Database, signingKey: string): Promise<boolean> {
  const query = `INSERT INTO key_history (signing_key) VALUES (?)`;
  const result = await db.prepare(query).bind(signingKey).run();
  return result.success;
}

export async function getLatestSigningKey(db: D1Database): Promise<string | null> {
  const query = `SELECT signing_key FROM key_history ORDER BY id DESC LIMIT 1`;
  const row = await db.prepare(query).first<{ signing_key: string }>();
  return row ? row.signing_key : null;
}

export async function getKeyHistory(db: D1Database): Promise<{ id: number; signing_key: string; created_at: string }[]> {
  const query = `SELECT * FROM key_history ORDER BY id DESC`;
  const { results } = await db.prepare(query).all();
  return (results as any) || [];
}
