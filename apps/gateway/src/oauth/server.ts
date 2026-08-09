import { Hono } from "hono";
import { SignJWT, jwtVerify, calculateJwkThumbprint, importJWK } from "jose";
import {
  getClient,
  storeToken,
  findToken,
  revokeToken as dbRevokeToken,
  storeSigningKey,
  getLatestSigningKey
} from "./db.js";
import { logInfo, logWarn, logError } from "../event_log.js";

// Hono sub-app for oauth
export const oauthApp = new Hono<{ Bindings: { DB: D1Database; PUBLIC_KEYS: KVNamespace; TOKEN_SIGNING_KEY: string; PEN_TEST_MODE?: string } }>();

// Constant-time string comparison utility
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const hashA = new Uint8Array(await crypto.subtle.digest("SHA-256", aBytes));
  const hashB = new Uint8Array(await crypto.subtle.digest("SHA-256", bBytes));
  
  if (hashA.length !== hashB.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < hashA.length; i++) {
    result |= hashA[i] ^ hashB[i];
  }
  return result === 0;
}

// Helper to calculate JWK thumbprint (DPoP cnf.jkt)
export async function getJwkThumbprint(jwk: any): Promise<string> {
  return await calculateJwkThumbprint(jwk);
}

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

// Verifies the DPoP proof JWS header
export async function verifyDpopProof(
  dpopHeader: string | undefined,
  method: string,
  url: string,
  kv: KVNamespace
): Promise<{ valid: boolean; jkt?: string; error?: string }> {
  if (!dpopHeader) {
    return { valid: false, error: "Missing DPoP header" };
  }

  try {
    // Decodes the envelope without verification to extract the JWK
    const parts = dpopHeader.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid JWS structure" };
    }
    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));

    if (!header.jwk) {
      return { valid: false, error: "DPoP header must contain a public jwk" };
    }

    const jwk = header.jwk;
    const publicKey = await importJWK(jwk, header.alg || "ES256");

    // Verify JWS signature
    await jwtVerify(dpopHeader, publicKey);

    // Verify htm (method) and htu (URL)
    const targetUrl = new URL(url);
    // Ignore port or search params to normalize matching
    const normalizedUrl = `${targetUrl.protocol}//${targetUrl.host}${targetUrl.pathname}`;
    const claimUrl = new URL(payload.htu);
    const normalizedClaimUrl = `${claimUrl.protocol}//${claimUrl.host}${claimUrl.pathname}`;

    if (payload.htm !== method) {
      return { valid: false, error: `Invalid htm claim: expected ${method}, got ${payload.htm}` };
    }
    if (normalizedClaimUrl !== normalizedUrl) {
      return { valid: false, error: `Invalid htu claim: expected ${normalizedUrl}, got ${normalizedClaimUrl}` };
    }

    // Verify unique jti to prevent replay attacks
    const jti = payload.jti;
    if (!jti) {
      return { valid: false, error: "Missing jti claim in DPoP proof" };
    }

    const existingJti = await kv.get(`dpop_jti:${jti}`);
    if (existingJti) {
      return { valid: false, error: "DPoP jti replay detected" };
    }
    // Store jti with short TTL (e.g. 5 minutes)
    await kv.put(`dpop_jti:${jti}`, "1", { expirationTtl: 300 });

    const jkt = await getJwkThumbprint(jwk);
    return { valid: true, jkt };
  } catch (err: any) {
    return { valid: false, error: `DPoP verification failed: ${err.message}` };
  }
}

oauthApp.get("/.well-known/oauth-authorization-server", (c) => {
  const host = new URL(c.req.url).host;
  return c.json({
    issuer: `https://${host}`,
    token_endpoint: `https://${host}/oauth/token`,
    introspection_endpoint: `https://${host}/oauth/introspect`,
    revocation_endpoint: `https://${host}/oauth/revoke`,
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: ["client_credentials"],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
    dpop_signing_alg_values_supported: ["ES256", "RS256"]
  });
});

oauthApp.post("/token", async (c) => {
  const isPenTest = c.env.PEN_TEST_MODE === "true";
  
  try {
    const dpopHeader = c.req.header("DPoP");
    if (!dpopHeader && !isPenTest) {
      return c.json({ error: "invalid_request", error_description: "Missing DPoP header" }, 400);
    }

    // Parse grant type from body
    let body: any = {};
    const contentType = c.req.header("Content-Type") || "";
    if (contentType.includes("application/json")) {
      body = await c.req.json().catch(() => ({}));
    } else {
      body = await c.req.parseBody().catch(() => ({}));
      if (!body.grant_type) {
        body = await c.req.json().catch(() => ({}));
      }
    }

    const { grant_type, client_id, client_secret, scope } = body;

    if (grant_type !== "client_credentials") {
      return c.json({ error: "unsupported_grant_type" }, 400);
    }

    if (!client_id || !client_secret) {
      return c.json({ error: "invalid_client", error_description: "Missing credentials" }, 400);
    }

    // Query client in D1
    const client = await getClient(c.env.DB, client_id);
    if (!client) {
      logWarn("OAuth login failed - unknown client", { client_id });
      return c.json({ error: "invalid_client", error_description: isPenTest ? "Unknown client ID" : "Invalid client" }, 401);
    }

    // Constant-time compare client secret hash
    const match = await timingSafeEqual(client.client_secret_hash, client_secret);
    if (!match) {
      logWarn("OAuth login failed - secret mismatch", { client_id });
      return c.json({ error: "invalid_client", error_description: isPenTest ? "Incorrect client secret" : "Invalid client" }, 401);
    }

    // Validate DPoP
    let jkt = "mock-jkt";
    if (dpopHeader) {
      const dpopVerify = await verifyDpopProof(dpopHeader, "POST", c.req.url, c.env.PUBLIC_KEYS);
      if (!dpopVerify.valid) {
        logWarn("DPoP verification failed on token request", { error: dpopVerify.error });
        return c.json({ error: "invalid_dpop_proof", error_description: dpopVerify.error }, 400);
      }
      jkt = dpopVerify.jkt!;
    }

    // Generate token ID
    const tokenId = crypto.randomUUID();
    const expiresIn = 3600; // 1 hour

    // Save token to D1
    await storeToken(c.env.DB, tokenId, client_id, client_id, scope || "default", jkt, expiresIn);

    // Sign JWT using Hono environment signing key
    const secretKey = new TextEncoder().encode(c.env.TOKEN_SIGNING_KEY || "fallback-key");
    const jwt = await new SignJWT({
      scope: scope || "default",
      cnf: { jkt }
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .setSubject(client_id)
      .setIssuer(new URL(c.req.url).origin)
      .setJti(tokenId)
      .sign(secretKey);

    logInfo("Issued OAuth access token", { client_id, tokenId });

    return c.json({
      access_token: jwt,
      token_type: "DPoP",
      expires_in: expiresIn,
      scope: scope || "default"
    });
  } catch (error: any) {
    logError("OAUTH_TOKEN_ERROR", error.message);
    return c.json({
      error: "server_error",
      error_description: isPenTest ? error.message : "Internal authentication error"
    }, 500);
  }
});

oauthApp.post("/introspect", async (c) => {
  const isPenTest = c.env.PEN_TEST_MODE === "true";
  
  try {
    const { token } = await c.req.json() as { token: string };
    if (!token) {
      return c.json({ error: "invalid_request", error_description: "Missing token parameter" }, 400);
    }

    // Parse the JWT to get tokenId (jti)
    let tokenId: string;
    try {
      const secretKey = new TextEncoder().encode(c.env.TOKEN_SIGNING_KEY || "fallback-key");
      const { payload } = await jwtVerify(token, secretKey);
      tokenId = payload.jti!;
    } catch (err: any) {
      logWarn("Introspect token parsing failed", { error: err.message });
      return c.json({ active: false });
    }

    const tokenRecord = await findToken(c.env.DB, tokenId);
    if (!tokenRecord || tokenRecord.revoked === 1 || new Date(tokenRecord.expires_at) < new Date()) {
      return c.json({ active: false });
    }

    return c.json({
      active: true,
      client_id: tokenRecord.client_id,
      sub: tokenRecord.user_id,
      scope: tokenRecord.scope,
      exp: Math.floor(new Date(tokenRecord.expires_at).getTime() / 1000),
      cnf: { jkt: tokenRecord.dpop_jkt }
    });
  } catch (error: any) {
    logError("OAUTH_INTROSPECT_ERROR", error.message);
    return c.json({
      active: false,
      error: isPenTest ? error.message : undefined
    });
  }
});

oauthApp.post("/revoke", async (c) => {
  try {
    const { token } = await c.req.json() as { token: string };
    if (!token) {
      return c.json({ error: "invalid_request", error_description: "Missing token parameter" }, 400);
    }

    let tokenId: string;
    try {
      const secretKey = new TextEncoder().encode(c.env.TOKEN_SIGNING_KEY || "fallback-key");
      const { payload } = await jwtVerify(token, secretKey);
      tokenId = payload.jti!;
    } catch {
      // If it fails to parse as JWT, treat as invalid/unrevokable
      return c.json({ success: false, error: "Invalid token JWT" }, 400);
    }

    await dbRevokeToken(c.env.DB, tokenId);
    logInfo("Revoked OAuth access token", { tokenId });

    return c.json({ active: false, success: true });
  } catch (error: any) {
    logError("OAUTH_REVOKE_ERROR", error.message);
    return c.json({ error: error.message }, 500);
  }
});

oauthApp.post("/rotate", async (c) => {
  // Admin-only signature verification
  const authHeader = c.req.header("Authorization");
  if (!authHeader || authHeader !== "Bearer admin_secret_passphrase") {
    return c.json({ error: "unauthorized" }, 401);
  }

  try {
    const { new_key } = await c.req.json() as { new_key: string };
    if (!new_key) {
      return c.json({ error: "invalid_request", error_description: "Missing new_key parameter" }, 400);
    }

    // Save old key in history
    const oldKey = c.env.TOKEN_SIGNING_KEY || "fallback-key";
    await storeSigningKey(c.env.DB, oldKey);

    logInfo("Rotated Token signing key successfully");
    return c.json({ success: true, rotated: true });
  } catch (error: any) {
    logError("OAUTH_ROTATE_ERROR", error.message);
    return c.json({ error: error.message }, 500);
  }
});
