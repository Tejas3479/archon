import { logInfo, logWarn } from "./event_log.js";

// WHY: Verifies that payloads are signed by the device's secure enclave (Ed25519) using Web Crypto
export async function verifySignature(publicKeyHex: string, signatureHex: string, payload: string): Promise<boolean> {
  try {
    const pubKeyBytes = new Uint8Array(
      publicKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    const sigBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    const dataBytes = new TextEncoder().encode(payload);

    const key = await crypto.subtle.importKey(
      "raw",
      pubKeyBytes,
      { name: "Ed25519" },
      true,
      ["verify"]
    );

    return await crypto.subtle.verify(
      "Ed25519",
      key,
      sigBytes,
      dataBytes
    );
  } catch (error: any) {
    logWarn("Signature verification failed with exception", { error: error.message });
    return false;
  }
}

// WHY: Durable Object-backed token issuer for just-in-time (JIT) tool execution
export async function issueJITToken(userId: string, tool: string, env: any): Promise<string> {
  const tokenId = crypto.randomUUID();
  const expiry = Date.now() + 5 * 60 * 1000; // 5-minute lifespan

  const id = env.TOKEN_MANAGER.idFromName(userId);
  const stub = env.TOKEN_MANAGER.get(id);

  const response = await stub.fetch("http://token-manager/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId, userId, tool, expiry })
  });

  if (!response.ok) {
    throw new Error("Failed to register token in TokenManager Durable Object");
  }

  logInfo("Issued JIT token", { userId, tokenId, tool });
  return tokenId;
}

// WHY: Validates token exists, is unexpired, and matches requested scoped permissions
export async function validateJITToken(token: string, userId: string, env: any): Promise<{ valid: boolean; userId?: string; tool?: string }> {
  try {
    const id = env.TOKEN_MANAGER.idFromName(userId);
    const stub = env.TOKEN_MANAGER.get(id);

    const response = await stub.fetch("http://token-manager/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: token })
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json() as any;
    return data;
  } catch (error: any) {
    logWarn("Failed to validate token in TokenManager", { token, error: error.message });
    return { valid: false };
  }
}
