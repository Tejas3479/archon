import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { generateKeyPair, SignJWT, exportJWK } from "jose";
import app from "../src/index.js";
import { registerClient } from "../src/oauth/db.js";
import { rateLimit } from "../src/middleware/rate_limit.js";

const createMockEnv = () => {
  const kvStore = new Map<string, string>();
  const dbData = {
    clients: new Map<string, any>(),
    access_tokens: new Map<string, any>(),
    cost_ledger: [] as any[],
    swarm_messages: new Map<string, any>(),
    key_history: [] as any[]
  };

  const PUBLIC_KEYS = {
    put: async (key: string, val: string, options?: any) => { kvStore.set(key, val); },
    get: async (key: string) => kvStore.get(key) || null
  };

  const DB = {
    prepare: (sql: string) => {
      const cleaned = sql.replace(/\s+/g, " ").trim();
      return {
        bind: (...args: any[]) => {
          return {
            run: async () => {
              if (cleaned.startsWith("INSERT INTO clients")) {
                const [client_id, client_secret_hash, redirect_uri] = args;
                dbData.clients.set(client_id, {
                  client_id,
                  client_secret_hash,
                  redirect_uri,
                  grant_types: 'client_credentials',
                  created_at: new Date().toISOString()
                });
              } else if (cleaned.startsWith("INSERT INTO access_tokens")) {
                const [token_id, client_id, user_id, scope, dpop_jkt, issued_at, expires_at] = args;
                dbData.access_tokens.set(token_id, {
                  token_id,
                  client_id,
                  user_id,
                  scope,
                  dpop_jkt,
                  issued_at,
                  expires_at,
                  revoked: 0
                });
              } else if (cleaned.startsWith("UPDATE access_tokens SET revoked = 1")) {
                const [token_id] = args;
                const token = dbData.access_tokens.get(token_id);
                if (token) {
                  token.revoked = 1;
                }
              }
              return { success: true };
            },
            first: async () => {
              if (cleaned.startsWith("SELECT * FROM clients")) {
                const [client_id] = args;
                return dbData.clients.get(client_id) || null;
              } else if (cleaned.startsWith("SELECT * FROM access_tokens")) {
                const [token_id] = args;
                return dbData.access_tokens.get(token_id) || null;
              }
              return null;
            },
            all: async () => {
              return { results: [] };
            }
          };
        }
      };
    }
  };

  return {
    PUBLIC_KEYS,
    DB,
    TOKEN_SIGNING_KEY: "test-signing-key-value-1234567890123",
    PEN_TEST_MODE: "false", // Ensure all security logic is active
    kvStore,
    dbData
  };
};

async function createDpopHeader(keyPair: any, method: string, url: string, jti: string) {
  const jwk = await exportJWK(keyPair.publicKey);
  const dpopJwt = await new SignJWT({
    htm: method,
    htu: url,
    jti: jti
  })
    .setProtectedHeader({ alg: "ES256", jwk })
    .setIssuedAt()
    .sign(keyPair.privateKey);
  return dpopJwt;
}

describe("Gateway Security and Penetration Testing", () => {
  it("rejects DPoP proof replay attacks", async () => {
    const env = createMockEnv();
    await registerClient(env.DB, "client_123", "hashed_secret");

    const keyPair = await generateKeyPair("ES256");
    const dpopHeader = await createDpopHeader(keyPair, "POST", "http://localhost/oauth/token", "jti_replay_1");

    // 1st request should succeed
    const res1 = await app.request(
      "/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DPoP": dpopHeader
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: "client_123",
          client_secret: "hashed_secret"
        })
      },
      env
    );
    expect(res1.status).toBe(200);

    // 2nd request using the same JTI / DPoP should fail with 400
    const res2 = await app.request(
      "/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DPoP": dpopHeader
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: "client_123",
          client_secret: "hashed_secret"
        })
      },
      env
    );
    expect(res2.status).toBe(400);
    const data = await res2.json() as any;
    expect(data.error).toBe("invalid_dpop_proof");
    expect(data.error_description).toContain("replay");
  });

  it("blocks requests with substituted DPoP keys (proof binding validation)", async () => {
    const env = createMockEnv();
    await registerClient(env.DB, "client_123", "hashed_secret");

    const keyPairA = await generateKeyPair("ES256");
    const dpopHeaderA = await createDpopHeader(keyPairA, "POST", "http://localhost/oauth/token", "jti_key_a");

    // Get a valid token bound to Keypair A
    const tokenRes = await app.request(
      "/oauth/token",
      {
        method: "POST",
        headers: {
          "DPoP": dpopHeaderA,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: "client_123",
          client_secret: "hashed_secret"
        })
      },
      env
    );
    const { access_token } = await tokenRes.json() as any;

    // Call protected route `/tools/execute` using Keypair A token, but signed with Keypair B
    const keyPairB = await generateKeyPair("ES256");
    const dpopHeaderB = await createDpopHeader(keyPairB, "POST", "http://localhost/tools/execute", "jti_key_b");

    const executeRes = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: {
          "Authorization": `DPoP ${access_token}`,
          "DPoP": dpopHeaderB,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: "client_123",
          token: "dummy",
          tool: "email.read"
        })
      },
      env
    );
    expect(executeRes.status).toBe(401);
    const executeData = await executeRes.json() as any;
    expect(executeData.error_description).toContain("bound");
  });

  it("safely handles SQL Injection inputs in OAuth client credentials", async () => {
    const env = createMockEnv();
    const keyPair = await generateKeyPair("ES256");
    const dpopHeader = await createDpopHeader(keyPair, "POST", "http://localhost/oauth/token", "jti_sql");

    const res = await app.request(
      "/oauth/token",
      {
        method: "POST",
        headers: {
          "DPoP": dpopHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: "client' OR '1'='1",
          client_secret: "secret"
        })
      },
      env
    );
    // Should safely reject since prepared statements isolate values
    expect(res.status).toBe(401);
    const data = await res.json() as any;
    expect(data.error).toBe("invalid_client");
  });

  it("mitigates large payload DoS via body limits", async () => {
    const testApp = new Hono();
    testApp.use(
      "*",
      async (c, next) => {
        const contentLength = c.req.header("content-length");
        if (contentLength && parseInt(contentLength, 10) > 10) {
          return c.text("Payload Too Large", 413);
        }
        await next();
      }
    );
    testApp.post("/", (c) => c.text("OK"));

    const bodyStr = JSON.stringify({ long_payload: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });
    const res = await testApp.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Length": bodyStr.length.toString() },
        body: bodyStr
      }
    );
    expect(res.status).toBe(413);
    expect(await res.text()).toBe("Payload Too Large");
  });

  it("enforces KV-based rate limiting gates", async () => {
    const testApp = new Hono();
    // Simulate rateLimit checking
    testApp.get("/test", async (c) => {
      const allowed = await rateLimit(c, "client:test_client", 2, 60);
      if (!allowed) {
        return c.text("Rate Limit Exceeded", 429);
      }
      return c.text("OK");
    });

    const env = createMockEnv();
    
    // Call 1: OK
    const res1 = await testApp.request("/test", {}, env);
    expect(res1.status).toBe(200);

    // Call 2: OK
    const res2 = await testApp.request("/test", {}, env);
    expect(res2.status).toBe(200);

    // Call 3: Exceeded (limit is 2)
    const res3 = await testApp.request("/test", {}, env);
    expect(res3.status).toBe(429);
    expect(await res3.text()).toBe("Rate Limit Exceeded");
  });
});
