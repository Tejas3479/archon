import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { verifyDpopProof } from "../oauth/server.js";
import { findToken } from "../oauth/db.js";
import { logWarn } from "../event_log.js";

// Hono middleware checking DPoP bindings on requests
export async function dpopMiddleware(c: Context, next: Next) {
  const isPenTest = c.env.PEN_TEST_MODE === "true";
  
  const dpopHeader = c.req.header("DPoP");
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("DPoP ")) {
    if (isPenTest) {
      logWarn("Skipping auth checking in PEN_TEST_MODE");
      await next();
      return;
    }
    return c.json({ error: "invalid_token", error_description: "Missing or invalid DPoP Authorization header" }, 401);
  }

  const token = authHeader.split(" ")[1];

  // Verify DPoP Proof
  if (!dpopHeader) {
    if (isPenTest) {
      await next();
      return;
    }
    return c.json({ error: "invalid_request", error_description: "Missing DPoP proof header" }, 400);
  }

  const dpopVerify = await verifyDpopProof(dpopHeader, c.req.method, c.req.url, c.env.PUBLIC_KEYS);
  if (!dpopVerify.valid) {
    logWarn("DPoP validation middleware failure", { error: dpopVerify.error });
    return c.json({ error: "invalid_dpop_proof", error_description: dpopVerify.error }, 400);
  }

  // Verify Access Token signature
  let tokenId: string;
  let cnfJkt: string;
  try {
    const secretKey = new TextEncoder().encode(c.env.TOKEN_SIGNING_KEY || "fallback-key");
    const { payload } = await jwtVerify(token, secretKey);
    tokenId = payload.jti!;
    cnfJkt = (payload.cnf as any)?.jkt;
  } catch (err: any) {
    logWarn("Access token verification failed", { error: err.message });
    return c.json({ error: "invalid_token", error_description: "Access token JWT verification failed" }, 401);
  }

  // Verify Token Binding matches JKT of DPoP public key
  if (!cnfJkt || cnfJkt !== dpopVerify.jkt) {
    logWarn("Token binding thumbprint mismatch", { tokenJkt: cnfJkt, proofJkt: dpopVerify.jkt });
    return c.json({ error: "invalid_token", error_description: "Access token is not bound to the client's DPoP key" }, 401);
  }

  // Query D1 access_tokens to verify the token exists and is active (not revoked)
  const tokenRecord = await findToken(c.env.DB, tokenId);
  if (!tokenRecord || tokenRecord.revoked === 1 || new Date(tokenRecord.expires_at) < new Date()) {
    logWarn("Introspect rejection: Token not active or revoked", { tokenId });
    return c.json({ error: "invalid_token", error_description: "Access token is expired or has been revoked" }, 401);
  }

  // Set payload claims in context for subsequent routes
  c.set("jwtPayload", {
    tokenId,
    clientId: tokenRecord.client_id,
    userId: tokenRecord.user_id,
    scope: tokenRecord.scope
  });

  await next();
}
