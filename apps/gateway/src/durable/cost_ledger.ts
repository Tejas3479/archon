// WHY: CostLedger records API spending transactions persistently, enabling budget limits.
// Refactored to write-through to D1 table 'cost_ledger', using Durable Object memory as cache.
export class CostLedger {
  state: DurableObjectState;
  env: any;
  cache: Map<string, number> = new Map(); // cache key: "userId:YYYY-MM-DD"

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "POST" && url.pathname === "/record") {
      const { userId, cost } = await request.json() as any;
      const today = new Date().toISOString().split("T")[0];
      const key = `${userId}:${today}`;
      
      // Write to D1 first
      try {
        await this.env.DB.prepare(
          "INSERT INTO cost_ledger (user_id, amount_cents, description) VALUES (?, ?, 'api-call')"
        ).bind(userId, cost).run();
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Check / update local cache
      const currentCached = this.cache.get(key);
      let newTotal = cost;
      if (currentCached !== undefined) {
        newTotal = currentCached + cost;
      } else {
        // Cache miss: load sum first
        try {
          const row = await this.env.DB.prepare(
            "SELECT SUM(amount_cents) as total FROM cost_ledger WHERE user_id = ? AND created_at >= ?"
          ).bind(userId, `${today}T00:00:00.000Z`).first() as { total: number } | null;
          newTotal = row?.total || cost;
        } catch {
          // Fallback to local
        }
      }
      this.cache.set(key, newTotal);

      return new Response(JSON.stringify({ success: true, total: newTotal }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (method === "POST" && url.pathname === "/total") {
      const { userId } = await request.json() as any;
      const today = new Date().toISOString().split("T")[0];
      const key = `${userId}:${today}`;
      
      // Check cache
      let totalCost = this.cache.get(key);
      
      if (totalCost === undefined) {
        // Cache miss: query D1 SUM
        try {
          const row = await this.env.DB.prepare(
            "SELECT SUM(amount_cents) as total FROM cost_ledger WHERE user_id = ? AND created_at >= ?"
          ).bind(userId, `${today}T00:00:00.000Z`).first() as { total: number } | null;
          totalCost = row?.total || 0;
          this.cache.set(key, totalCost);
        } catch (err: any) {
          return new Response(JSON.stringify({ total: 0, error: err.message }), {
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      return new Response(JSON.stringify({ total: totalCost }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
}
