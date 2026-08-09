import { describe, it, expect, beforeEach } from "vitest";
import * as crypto from "node:crypto";
import app, { mockCostDb } from "../src/index.js";

// Helper to generate cryptographically valid test credentials
function generateTestVC(claims: any) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const jwk = publicKey.export({ format: "jwk" });
  const pubKeyHex = Buffer.from(jwk.x!, "base64url").toString("hex");

  const vc: any = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: "vc_test_123",
    type: ["VerifiableCredential", "ArchonClaimCredential"],
    issuer: `did:key:${pubKeyHex}`,
    issuance_date: new Date().toISOString(),
    credential_subject: {
      id: `did:key:${pubKeyHex}`,
      claims
    }
  };

  const payloadStr = JSON.stringify(vc);
  const sig = crypto.sign(null, Buffer.from(payloadStr), privateKey);

  vc.proof = {
    proof_type: "Ed25519Signature2020",
    created: new Date().toISOString(),
    verification_method: `did:key:${pubKeyHex}#key-1`,
    proof_value: sig.toString("hex")
  };

  return vc;
}

describe("Developer-Facing MCP Server with VC Verification", () => {
  beforeEach(() => {
    mockCostDb.clear();
  });

  it("exposes tools based on VC claims scope", async () => {
    const vc = generateTestVC({ scope: "email" });
    const authHeader = `Bearer ${JSON.stringify(vc)}`;

    const res = await app.request("/tools", {
      headers: { "Authorization": authHeader }
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.tools).toBeDefined();
    expect(data.tools.length).toBe(1);
    expect(data.tools[0].name).toBe("email.read");
  });

  it("blocks tool discovery if VC signature is invalid", async () => {
    const vc = generateTestVC({ scope: "email" });
    vc.proof.proof_value = "a".repeat(128); // Invalid signature hex
    const authHeader = `Bearer ${JSON.stringify(vc)}`;

    const res = await app.request("/tools", {
      headers: { "Authorization": authHeader }
    });
    expect(res.status).toBe(401);
    const data = await res.json() as any;
    expect(data.error).toContain("verification failed");
  });

  it("blocks execution if JIT token format is invalid", async () => {
    const vc = generateTestVC({ scope: "email" });
    const authHeader = `Bearer ${JSON.stringify(vc)}`;

    const res = await app.request("/tools/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        userId: "agent_abc",
        token: "invalid_token",
        tool: "email.read",
        arguments: { id: "msg_12345" }
      })
    });

    expect(res.status).toBe(403);
    const data = await res.json() as any;
    expect(data.error).toContain("Invalid or unauthorized JIT token");
  });

  it("allows execution and returns mock data when JIT token and VC claims are valid", async () => {
    const vc = generateTestVC({ scope: "email" });
    const authHeader = `Bearer ${JSON.stringify(vc)}`;

    const res = await app.request("/tools/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        userId: "agent_abc",
        token: "jit_token_123",
        tool: "email.read",
        arguments: { id: "msg_12345" }
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.subject).toContain("Flight AA234 is Delayed");
  });

  it("blocks execution if VC does not contain scope for requested tool", async () => {
    const vc = generateTestVC({ scope: "calendar" }); // scope calendar, but requesting email.read
    const authHeader = `Bearer ${JSON.stringify(vc)}`;

    const res = await app.request("/tools/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        userId: "agent_abc",
        token: "jit_token_123",
        tool: "email.read",
        arguments: { id: "msg_12345" }
      })
    });

    expect(res.status).toBe(403);
    const data = await res.json() as any;
    expect(data.error).toContain("Unauthorized scope");
  });

  it("blocks execution when simulated FinOps daily budget is exceeded", async () => {
    const vc = generateTestVC({ scope: "email" });
    const authHeader = `Bearer ${JSON.stringify(vc)}`;
    mockCostDb.set("agent_abc", 510); // exceed daily limit of 500 cents

    const res = await app.request("/tools/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        userId: "agent_abc",
        token: "jit_token_123",
        tool: "email.read",
        arguments: { id: "msg_12345" }
      })
    });

    expect(res.status).toBe(402);
    const data = await res.json() as any;
    expect(data.error).toContain("budget exceeded");
  });

  it("exposes defi tools based on specific claims", async () => {
    const vc = generateTestVC({ scope: "defi:read" });
    const authHeader = `Bearer ${JSON.stringify(vc)}`;

    const res = await app.request("/tools", {
      headers: { "Authorization": authHeader }
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.tools.length).toBe(1);
    expect(data.tools[0].name).toBe("defi.get_balance");
  });

  it("blocks defi.suggest_swap execution if claim is only defi:read", async () => {
    const vc = generateTestVC({ scope: "defi:read" });
    const authHeader = `Bearer ${JSON.stringify(vc)}`;

    const res = await app.request("/tools/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        userId: "agent_abc",
        token: "jit_token_123",
        tool: "defi.suggest_swap",
        arguments: { from: "ETH", to: "USDC", amount: 1.0 }
      })
    });

    expect(res.status).toBe(403);
    const data = await res.json() as any;
    expect(data.error).toContain("Unauthorized scope");
  });

  it("allows execution of defi.suggest_swap and deepfake.check with valid claims", async () => {
    // 1. Verify swap suggestion works with defi:write
    const vcDefi = generateTestVC({ scope: "defi:write" });
    const authHeaderDefi = `Bearer ${JSON.stringify(vcDefi)}`;

    const resSwap = await app.request("/tools/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeaderDefi
      },
      body: JSON.stringify({
        userId: "agent_abc",
        token: "jit_token_123",
        tool: "defi.suggest_swap",
        arguments: { from: "ETH", to: "USDC", amount: 2.0, price_change_percent: 3.0 }
      })
    });

    expect(resSwap.status).toBe(200);
    const swapData = await resSwap.json() as any;
    expect(swapData.result.suggestion).toContain("Swap 1.5 ETH to USDC");

    // 2. Verify deepfake.check works with deepfake claim
    const vcDf = generateTestVC({ scope: "deepfake" });
    const authHeaderDf = `Bearer ${JSON.stringify(vcDf)}`;

    const resDf = await app.request("/tools/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeaderDf
      },
      body: JSON.stringify({
        userId: "agent_abc",
        token: "jit_token_123",
        tool: "deepfake.check",
        arguments: { media_hash: "hash_synthetic_image" }
      })
    });

    expect(resDf.status).toBe(200);
    const dfData = await resDf.json() as any;
    expect(dfData.result.is_synthetic).toBe(true);
    expect(dfData.result.confidence).toBe(0.98);
  });
});
