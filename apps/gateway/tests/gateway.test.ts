import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/index.js";

// WHY: Mocks the serverless environment bindings (KV and Durable Objects) for rapid unit testing
const createMockEnv = () => {
  const kvStore = new Map<string, string>();
  const tokenStore = new Map<string, any>();
  const costStore = new Map<string, number>();

  const PUBLIC_KEYS = {
    put: async (key: string, val: string, options?: any) => { kvStore.set(key, val); },
    get: async (key: string) => kvStore.get(key) || null
  };

  const TOKEN_MANAGER = {
    idFromName: () => ({}),
    get: () => ({
      fetch: async (url: string, init?: RequestInit) => {
        const path = new URL(url).pathname;
        const body = init?.body ? JSON.parse(init.body as string) : {};

        if (path === "/add") {
          tokenStore.set(body.tokenId, { userId: body.userId, tool: body.tool, expiry: body.expiry });
          return new Response(JSON.stringify({ success: true }));
        }
        if (path === "/validate") {
          const t = tokenStore.get(body.tokenId);
          if (t && Date.now() < t.expiry) {
            return new Response(JSON.stringify({ valid: true, userId: t.userId, tool: t.tool }));
          }
          return new Response(JSON.stringify({ valid: false }));
        }
        return new Response("Not Found", { status: 404 });
      }
    })
  };

  const COST_LEDGER = {
    idFromName: () => ({}),
    get: () => ({
      fetch: async (url: string, init?: RequestInit) => {
        const path = new URL(url).pathname;
        const body = init?.body ? JSON.parse(init.body as string) : {};

        if (path === "/record") {
          const current = costStore.get(body.userId) || 0;
          const next = current + body.cost;
          costStore.set(body.userId, next);
          return new Response(JSON.stringify({ success: true, total: next }));
        }
        if (path === "/total") {
          const total = costStore.get(body.userId) || 0;
          return new Response(JSON.stringify({ total }));
        }
        return new Response("Not Found", { status: 404 });
      }
    })
  };

  const swarmRelayStore = new Map<string, string[]>();
  const SWARM_RELAY = {
    idFromName: () => ({}),
    get: () => ({
      fetch: async (url: string, init?: RequestInit) => {
        const u = new URL(url);
        const path = u.pathname;
        if (path === "/send") {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const existing = swarmRelayStore.get(body.recipientId) || [];
          existing.push(body.message);
          swarmRelayStore.set(body.recipientId, existing);
          return new Response(JSON.stringify({ success: true }));
        }
        if (path === "/receive") {
          const recipientId = u.searchParams.get("recipientId") || "";
          const messages = swarmRelayStore.get(recipientId) || [];
          swarmRelayStore.delete(recipientId);
          return new Response(JSON.stringify({ messages }));
        }
        return new Response("Not Found", { status: 404 });
      }
    })
  };

  const dbData = {
    clients: new Map<string, any>(),
    access_tokens: new Map<string, any>(),
    cost_ledger: [] as any[],
    swarm_messages: new Map<string, any>(),
    key_history: [] as any[],
    organizations: new Map<string, any>(),
    team_members: [] as any[]
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
              } else if (cleaned.startsWith("INSERT INTO cost_ledger")) {
                const [user_id, amount_cents] = args;
                dbData.cost_ledger.push({
                  user_id,
                  amount_cents,
                  created_at: new Date().toISOString()
                });
                const current = costStore.get(user_id) || 0;
                costStore.set(user_id, current + amount_cents);
              } else if (cleaned.startsWith("INSERT INTO swarm_messages")) {
                const [id, sender, recipient, payload, ttl] = args;
                dbData.swarm_messages.set(id, {
                  id,
                  sender,
                  recipient,
                  payload,
                  ttl,
                  created_at: new Date().toISOString()
                });
              } else if (cleaned.startsWith("DELETE FROM swarm_messages")) {
                args.forEach(id => dbData.swarm_messages.delete(id));
              } else if (cleaned.startsWith("INSERT INTO key_history")) {
                const [signing_key] = args;
                dbData.key_history.push({
                  id: dbData.key_history.length + 1,
                  signing_key,
                  created_at: new Date().toISOString()
                });
              } else if (cleaned.startsWith("INSERT INTO organizations")) {
                const [id, name, plan] = args;
                dbData.organizations.set(id, { id, name, plan });
              } else if (cleaned.startsWith("INSERT INTO team_members")) {
                const [organization_id, user_id, role] = args;
                dbData.team_members.push({ organization_id, user_id, role });
              } else if (cleaned.startsWith("DELETE FROM team_members")) {
                const [organization_id, user_id] = args;
                dbData.team_members = dbData.team_members.filter(m => !(m.organization_id === organization_id && m.user_id === user_id));
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
              } else if (cleaned.startsWith("SELECT SUM(amount_cents)")) {
                const [user_id] = args;
                const dbTotal = dbData.cost_ledger
                  .filter(row => row.user_id === user_id)
                  .reduce((sum, row) => sum + row.amount_cents, 0);
                const mockTotal = costStore.get(user_id) || 0;
                return { total: dbTotal + mockTotal };
              } else if (cleaned.startsWith("SELECT signing_key FROM key_history")) {
                if (dbData.key_history.length === 0) return null;
                return dbData.key_history[dbData.key_history.length - 1];
              }
              return null;
            },
            all: async () => {
              if (cleaned.startsWith("SELECT id, payload FROM swarm_messages")) {
                const [recipient_id] = args;
                const results = Array.from(dbData.swarm_messages.values())
                  .filter(row => row.recipient === recipient_id)
                  .map(row => ({ id: row.id, payload: row.payload }));
                return { results };
              } else if (cleaned.startsWith("SELECT * FROM key_history")) {
                return { results: [...dbData.key_history].reverse() };
              } else if (cleaned.startsWith("SELECT user_id as userId, role FROM team_members")) {
                const [organization_id] = args;
                const results = dbData.team_members
                  .filter(m => m.organization_id === organization_id)
                  .map(m => ({ userId: m.user_id, role: m.role }));
                return { results };
              }
              return { results: [] };
            }
          };
        }
      };
    }
  };

  return {
    PUBLIC_KEYS,
    TOKEN_MANAGER,
    COST_LEDGER,
    SWARM_RELAY,
    DB,
    TOKEN_SIGNING_KEY: "test-signing-key-value-1234567890123",
    PEN_TEST_MODE: "true",
    kvStore,
    tokenStore,
    costStore,
    swarmRelayStore,
    dbData
  };
};

describe("Gateway API Router", () => {
  let env: any;

  beforeEach(() => {
    env = createMockEnv();
  });

  it("exposes the MCP tools manifest via /.well-known/mcp", async () => {
    const res = await app.request("/.well-known/mcp", {}, env);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.tools).toBeDefined();
    expect(data.tools.length).toBeGreaterThan(0);
    expect(data.tools[0].name).toBe("email.search");
  });

  it("handles user identity registration via /auth/register", async () => {
    const dummyKey = "a".repeat(64);
    const res = await app.request(
      "/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user_123", publicKey: dummyKey })
      },
      env
    );
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(env.kvStore.get("user_123")).toBe(dummyKey);
  });

  it("verifies Ed25519 token signatures and issues JIT tokens", async () => {
    // Generate a valid Web Crypto Ed25519 keypair for testing
    const keyPair = await crypto.subtle.generateKey(
      { name: "Ed25519" },
      true,
      ["sign", "verify"]
    );
    
    // Export raw public key
    const rawPubKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const pubKeyHex = Array.from(new Uint8Array(rawPubKey))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Store in mock KV
    await env.PUBLIC_KEYS.put("user_123", pubKeyHex);

    const tool = "email.read";
    const timestamp = Date.now();
    const payload = `user_123:${tool}:${timestamp}`;

    // Sign payload
    const signatureBytes = await crypto.subtle.sign(
      "Ed25519",
      keyPair.privateKey,
      new TextEncoder().encode(payload)
    );
    const signatureHex = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    const res = await app.request(
      "/auth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          tool,
          signature: signatureHex,
          timestamp
        })
      },
      env
    );
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.token).toBeDefined();
    expect(env.tokenStore.size).toBe(1);
  });

  it("proxies tool execution when JIT token is valid", async () => {
    // Set up a valid JIT token directly in store
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "email.read", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "email.read",
          arguments: { id: "msg_12345" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.id).toBe("msg_12345");
    expect(data.result.subject).toContain("Flight AA234 is Delayed");
    
    // Asserts cost bookkeeping charged user account
    expect(env.costStore.get("user_123")).toBe(10); // Charged 10 cents
  });

  it("blocks tool execution when budget limit is exceeded", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "email.read", expiry: Date.now() + 60000 });
    
    // Set cost store above daily budget of $5 (500 cents)
    env.costStore.set("user_123", 510);

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "email.read",
          arguments: { id: "msg_12345" }
        })
      },
      env
    );

    expect(res.status).toBe(402); // Cost Limit Exceeded status
    const data = await res.json() as any;
    expect(data.error).toContain("budget exceeded");
  });

  it("proxies calendar tool execution when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "calendar.list_events", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "calendar.list_events",
          arguments: { timeMin: "2026-06-07T00:00:00Z", timeMax: "2026-06-07T23:59:59Z" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.events).toBeDefined();
    expect(data.result.events[0].summary).toContain("Flight AA234");
  });

  it("proxies plaid tool execution when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "plaid.get_balance", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "plaid.get_balance",
          arguments: { accountId: "acc_99" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.account_id).toBe("acc_99");
    expect(data.result.balances.available).toBe(2450.50);
  });

  it("proxies calendar.read execution when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "calendar.read", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "calendar.read",
          arguments: { eventId: "evt_1001" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.id).toBe("evt_1001");
    expect(data.result.summary).toContain("Flight AA234");
  });

  it("proxies calendar.delete execution when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "calendar.delete", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "calendar.delete",
          arguments: { eventId: "evt_1001" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.success).toBe(true);
    expect(data.result.deletedEventId).toBe("evt_1001");
  });

  it("proxies health tool execution when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "health.get_heart_rate_logs", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "health.get_heart_rate_logs",
          arguments: { accountId: "acc_health_99" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.heart_rates).toBeDefined();
    expect(data.result.heart_rates[0]).toBe(72.0);
  });

  it("proxies home assistant tool execution when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "home_assistant.get_temperature_logs", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "home_assistant.get_temperature_logs",
          arguments: { deviceId: "thermostat_01" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.temperature_adjustments).toBeDefined();
    expect(data.result.temperature_adjustments[0].temp).toBe(72.0);
  });

  it("proxies social tool execution when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "social.get_recent_messages", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "social.get_recent_messages",
          arguments: { limit: 5 }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.messages).toBeDefined();
    expect(data.result.messages[0].sender).toBe("Mom");
  });

  it("handles peer-to-peer message routing via swarm relay", async () => {
    const sendRes = await app.request(
      "/swarm/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: "peer_456", message: "encrypted_payload_data" })
      },
      env
    );
    expect(sendRes.status).toBe(200);
    const sendData = await sendRes.json() as any;
    expect(sendData.success).toBe(true);

    const receiveRes = await app.request(
      "/swarm/receive?recipientId=peer_456",
      {},
      env
    );
    expect(receiveRes.status).toBe(200);
    const receiveData = await receiveRes.json() as any;
    expect(receiveData.messages).toEqual(["encrypted_payload_data"]);
  });

  it("proxies travel tools when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "travel.search_flights", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "travel.search_flights",
          arguments: { destination: "London" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.flights).toBeDefined();
    expect(data.result.flights[0].destination).toBe("London");
  });

  it("proxies skill registry tools when JIT token is valid", async () => {
    const tokenId = "jit_token_12345";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "skill_registry.install_skill", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "skill_registry.install_skill",
          arguments: { skillId: "skill_slack" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.success).toBe(true);
    expect(data.result.skillId).toBe("skill_slack");
  });

  it("exposes marketplace skills catalog via GET /api/skills", async () => {
    const res = await app.request("/api/skills", {}, env);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].id).toBe("skill_slack");
  });

  it("registers installations via POST /api/skills/install", async () => {
    const res = await app.request(
      "/api/skills/install",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "skill_slack" })
      },
      env
    );
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.skillId).toBe("skill_slack");
  });

  it("handles skill safety review via POST /sandbox/review", async () => {
    // Standard safe skill
    const resSafe = await app.request(
      "/sandbox/review",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "skill_slack" })
      },
      env
    );
    expect(resSafe.status).toBe(200);
    const dataSafe = await resSafe.json() as any;
    expect(dataSafe.safe).toBe(true);

    // Malicious exploit skill
    const resMalicious = await app.request(
      "/sandbox/review",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "skill_exploit_leak" })
      },
      env
    );
    expect(resMalicious.status).toBe(200);
    const dataMalicious = await resMalicious.json() as any;
    expect(dataMalicious.safe).toBe(false);
    expect(dataMalicious.errors.length).toBeGreaterThan(0);
  });

  it("proxies defi tools when JIT token is valid", async () => {
    const tokenId = "jit_token_defi";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "defi.get_token_price", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "defi.get_token_price",
          arguments: { token: "ETH" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.token).toBe("ETH");
    expect(data.result.price).toBe(3200.0);
  });

  it("proxies fhe search tools when JIT token is valid", async () => {
    const tokenId = "jit_token_fhe";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "fhe.search", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "fhe.search",
          arguments: { encrypted_query: [1, 2, 3], top_k: 2 }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.success).toBe(true);
    expect(data.result.encrypted_results).toEqual([2, 3, 4]);
  });

  it("proxies deepfake forensic checks when JIT token is valid", async () => {
    const tokenId = "jit_token_df";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "deepfake.check", expiry: Date.now() + 60000 });

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "deepfake.check",
          arguments: { media_url: "http://exam.ple/synthetic_video.mp4" }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.is_synthetic).toBe(true);
    expect(data.result.confidence).toBe(0.98);
  });

  it("verifies and runs data_wipe tool when signed correctly", async () => {
    const tokenId = "jit_token_wipe";
    env.tokenStore.set(tokenId, { userId: "user_123", tool: "data_wipe.execute", expiry: Date.now() + 60000 });

    const crypto = await import("node:crypto");
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    const jwk = publicKey.export({ format: "jwk" });
    const pubKeyHex = Buffer.from(jwk.x!, "base64url").toString("hex");

    const payload = "delete_all_user_data:user_123";
    const sig = crypto.sign(null, Buffer.from(payload), privateKey);
    const sigHex = sig.toString("hex");

    const res = await app.request(
      "/tools/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          token: tokenId,
          tool: "data_wipe.execute",
          arguments: {
            userId: "user_123",
            signature: sigHex,
            publicKeyHex: pubKeyHex
          }
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.result.success).toBe(true);
    expect(data.result.verification.signature_checked).toBe(true);
    expect(data.result.verification.kv_records_deleted).toBe(true);
  });

  it("runs developer.write_code mock tool execution", async () => {
    const res = await app.request(
      "/tools/developer.write_code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_description: "generate chatbot regex",
          language: "typescript"
        })
      },
      env
    );
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.code).toContain("export const airlineRegex");
    expect(data.language).toBe("typescript");
    expect(data.risk_score).toBe(0.1);
  });

  it("gates /org endpoints with SSO token middleware", async () => {
    // 1. Missing Authorization header
    const resMissing = await app.request(
      "/org/org_123/members",
      { method: "GET" },
      env
    );
    expect(resMissing.status).toBe(401);

    // 2. Invalid SSO token
    const resInvalid = await app.request(
      "/org/org_123/members",
      {
        method: "GET",
        headers: { "Authorization": "Bearer invalid_sso_token" }
      },
      env
    );
    expect(resInvalid.status).toBe(401);
    const dataInvalid = await resInvalid.json() as any;
    expect(dataInvalid.error).toContain("signature validation failed");
  });

  it("performs org CRUD and stats collection under SSO", async () => {
    const ssoHeader = { "Authorization": "Bearer archon_demo_secret_2026", "Content-Type": "application/json" };

    // 1. Create Organization
    const createRes = await app.request(
      "/org/create",
      {
        method: "POST",
        headers: ssoHeader,
        body: JSON.stringify({ name: "ACME Corp", plan: "team" })
      },
      env
    );
    expect(createRes.status).toBe(200);
    const orgData = await createRes.json() as any;
    expect(orgData.id).toBeDefined();
    expect(orgData.name).toBe("ACME Corp");

    const newOrgId = orgData.id;

    // 2. Invite Member
    const inviteRes = await app.request(
      `/org/${newOrgId}/invite`,
      {
        method: "POST",
        headers: ssoHeader,
        body: JSON.stringify({ email: "new_user@acme.com", role: "member" })
      },
      env
    );
    expect(inviteRes.status).toBe(200);
    const inviteData = await inviteRes.json() as any;
    expect(inviteData.success).toBe(true);

    // 3. List Members
    const membersRes = await app.request(
      `/org/${newOrgId}/members`,
      {
        method: "GET",
        headers: ssoHeader
      },
      env
    );
    expect(membersRes.status).toBe(200);
    const membersData = await membersRes.json() as any;
    expect(membersData.members.length).toBe(1);
    expect(membersData.members[0].userId).toBe("new_user@acme.com");

    // 4. Retrieve stats
    const statsRes = await app.request(
      `/org/${newOrgId}/stats`,
      {
        method: "GET",
        headers: ssoHeader
      },
      env
    );
    expect(statsRes.status).toBe(200);
    const statsData = await statsRes.json() as any;
    expect(statsData.totalActions).toBe(320);
    expect(statsData.activeAgents).toBe(4);

    // 5. Remove member
    const deleteRes = await app.request(
      `/org/${newOrgId}/member/new_user@acme.com`,
      {
        method: "DELETE",
        headers: ssoHeader
      },
      env
    );
    expect(deleteRes.status).toBe(200);

    const membersEmptyRes = await app.request(
      `/org/${newOrgId}/members`,
      {
        method: "GET",
        headers: ssoHeader
      },
      env
    );
    const emptyData = await membersEmptyRes.json() as any;
    expect(emptyData.members.length).toBe(0);
  });

  it("exports audit logs as CSV", async () => {
    const res = await app.request(
      "/org/org_123/audit?format=csv",
      {
        method: "GET",
        headers: { "Authorization": "Bearer archon_demo_secret_2026" }
      },
      env
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv");
    const csvContent = await res.text();
    expect(csvContent).toContain("ID,User ID,Action,Details,Created At");
    expect(csvContent).toContain("approve_swap");
    expect(csvContent).toContain("invite_member");
  });
});

