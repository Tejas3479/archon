// WHY: Durable Object class storing user tool token access states in persistent transactional storage.
// Refactored to use a write-through pattern: persist tokens to D1, utilizing DO memory as cache layer.
export class TokenManager {
  state: DurableObjectState;
  env: any;
  cache: Map<string, { userId: string; tool: string; expiry: number; revoked?: number }> = new Map();

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    
    // Set up alarm trigger
    this.state.blockConcurrencyWhile(async () => {
      await this.state.storage.setAlarm(Date.now() + 60000);
    });
  }

  async alarm() {
    const now = Date.now();
    // Prune in-memory expired cache
    for (const [key, val] of this.cache.entries()) {
      if (now > val.expiry) {
        this.cache.delete(key);
      }
    }
    
    // Prune expired entries from D1
    try {
      const dbNow = new Date().toISOString();
      await this.env.DB.prepare("DELETE FROM access_tokens WHERE expires_at < ?").bind(dbNow).run();
    } catch (err) {
      // Ignore D1 connectivity errors inside background worker alarms
    }
    
    // Re-schedule alarm
    await this.state.storage.setAlarm(Date.now() + 60000);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "POST" && url.pathname === "/add") {
      const { tokenId, userId, tool, expiry } = await request.json() as any;
      const dpopJkt = "jit-default-jkt";
      
      // Write to D1 first
      try {
        const issuedAt = new Date().toISOString();
        const expiresAt = new Date(expiry).toISOString();
        await this.env.DB.prepare(
          "INSERT INTO access_tokens (token_id, client_id, user_id, scope, dpop_jkt, issued_at, expires_at, revoked) VALUES (?, 'jit', ?, ?, ?, ?, ?, 0)"
        ).bind(tokenId, userId, tool, dpopJkt, issuedAt, expiresAt).run();
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Update local cache
      this.cache.set(tokenId, { userId, tool, expiry });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (method === "POST" && url.pathname === "/revoke") {
      const { tokenId } = await request.json() as any;
      
      // Update D1
      try {
        await this.env.DB.prepare("UPDATE access_tokens SET revoked = 1 WHERE token_id = ?").bind(tokenId).run();
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Evict cache
      this.cache.delete(tokenId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (method === "POST" && url.pathname === "/validate") {
      const { tokenId } = await request.json() as any;
      
      // Check cache first
      let tokenData = this.cache.get(tokenId);
      
      if (!tokenData) {
        // Cache miss: query D1
        try {
          const row = await this.env.DB.prepare("SELECT * FROM access_tokens WHERE token_id = ? LIMIT 1").bind(tokenId).first() as any;
          if (row) {
            tokenData = {
              userId: row.user_id,
              tool: row.scope,
              expiry: new Date(row.expires_at).getTime(),
              revoked: row.revoked
            };
            // Populate cache
            if (tokenData.revoked !== 1 && Date.now() <= tokenData.expiry) {
              this.cache.set(tokenId, tokenData);
            }
          }
        } catch (err: any) {
          return new Response(JSON.stringify({ valid: false, error: err.message }), {
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      if (!tokenData || tokenData.revoked === 1) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      if (Date.now() > tokenData.expiry) {
        this.cache.delete(tokenId);
        return new Response(JSON.stringify({ valid: false, reason: "Expired" }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ valid: true, userId: tokenData.userId, tool: tokenData.tool }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
}
