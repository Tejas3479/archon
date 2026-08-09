// WHY: Swarm relay mailbox utilizing Durable Objects to queue encrypted packets between peers, refactored to persist to D1.
export class SwarmRelay {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;

    // Set up alarm trigger for periodic expiration pruning
    this.state.blockConcurrencyWhile(async () => {
      await this.state.storage.setAlarm(Date.now() + 60000);
    });
  }

  async alarm() {
    try {
      const nowEpoch = Math.floor(Date.now() / 1000);
      await this.env.DB.prepare("DELETE FROM swarm_messages WHERE ttl < ?").bind(nowEpoch).run();
    } catch {
      // Ignore database availability drops in alarm cron
    }
    await this.state.storage.setAlarm(Date.now() + 60000);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "POST" && url.pathname === "/send") {
      const { recipientId, message } = await request.json() as any;
      if (!recipientId || !message) {
        return new Response(JSON.stringify({ error: "Missing recipientId or message" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const messageId = crypto.randomUUID();
      const ttl = Math.floor(Date.now() / 1000) + 3600; // 1-hour expiration lifespan

      // Write to D1
      try {
        await this.env.DB.prepare(
          "INSERT INTO swarm_messages (id, sender, recipient, payload, ttl) VALUES (?, 'device', ?, ?, ?)"
        ).bind(messageId, recipientId, message, ttl).run();
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (method === "GET" && url.pathname === "/receive") {
      const recipientId = url.searchParams.get("recipientId");
      if (!recipientId) {
        return new Response(JSON.stringify({ error: "Missing recipientId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Query D1 for messages
      try {
        const { results } = await this.env.DB.prepare(
          "SELECT id, payload FROM swarm_messages WHERE recipient = ? ORDER BY created_at ASC"
        ).bind(recipientId).all();

        const messages = (results || []).map((row: any) => row.payload);

        // Delete fetched messages from database (retrieve-and-delete pattern)
        if (results && results.length > 0) {
          const idsPlaceholders = results.map(() => "?").join(",");
          const ids = results.map((row: any) => row.id);
          await this.env.DB.prepare(
            `DELETE FROM swarm_messages WHERE id IN (${idsPlaceholders})`
          ).bind(...ids).run();
        }

        return new Response(JSON.stringify({ messages }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}
