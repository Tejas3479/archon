import { Hono } from "hono";
import { authorizedTools } from "./tools/discovery.js";
import { vcMiddleware } from "./verification.js";

// WHY: Standalone MCP Server for third-party AI agents.
// It verifies scoped tool access rules and authorizes tools like email.read via JIT tokens and VCs.
const app = new Hono<{ Variables: { verifiedClaims: any[] } }>();

// Simple in-memory budget/cost tracker for external agent calls (limits to $5.00 / 500 cents daily)
export const mockCostDb = new Map<string, number>();

// List exposed tools based on JIT token scopes / VC claims
app.get("/tools", vcMiddleware, (c) => {
  const verifiedClaims = c.get("verifiedClaims") || [];
  const allowedScopes = new Set<string>();
  
  for (const claim of verifiedClaims) {
    if (claim.scope) allowedScopes.add(claim.scope);
    if (claim.capabilities && Array.isArray(claim.capabilities)) {
      claim.capabilities.forEach((cap: string) => allowedScopes.add(cap));
    }
    if (claim.authorized_for_email || claim.email) allowedScopes.add("email");
    if (claim.authorized_for_calendar || claim.calendar) allowedScopes.add("calendar");
    if (claim.authorized_for_defi || claim.defi || claim.scope === "defi:read") allowedScopes.add("defi:read");
    if (claim.authorized_for_defi_write || claim.scope === "defi:write") allowedScopes.add("defi:write");
    if (claim.authorized_for_deepfake || claim.deepfake || claim.scope === "deepfake") allowedScopes.add("deepfake");
  }

  const filtered = authorizedTools.filter(t => allowedScopes.has(t.scope));
  return c.json({ tools: filtered });
});

// Proxy execution handler verifying VC token scope authorization and daily FinOps budgets
app.post("/tools/execute", vcMiddleware, async (c) => {
  const { userId, token, tool, arguments: args } = await c.req.json() as {
    userId: string;
    token: string;
    tool: string;
    arguments: any;
  };

  if (!userId || !token || !tool) {
    return c.json({ error: "Missing required parameters (userId, token, tool)" }, 400);
  }

  // 1. Verify JIT token exists and is valid
  if (!token.startsWith("jit_token_")) {
    return c.json({ error: "Invalid or unauthorized JIT token" }, 403);
  }

  // 2. Validate scope access
  const toolEntry = authorizedTools.find(t => t.name === tool);
  if (!toolEntry) {
    return c.json({ error: `Tool ${tool} is not exposed to third-party agents` }, 403);
  }

  // Verify the VC actually contains the capability for this tool
  const verifiedClaims = c.get("verifiedClaims") || [];
  const allowedScopes = new Set<string>();
  
  for (const claim of verifiedClaims) {
    if (claim.scope) allowedScopes.add(claim.scope);
    if (claim.capabilities && Array.isArray(claim.capabilities)) {
      claim.capabilities.forEach((cap: string) => allowedScopes.add(cap));
    }
    if (claim.authorized_for_email || claim.email) allowedScopes.add("email");
    if (claim.authorized_for_calendar || claim.calendar) allowedScopes.add("calendar");
    if (claim.authorized_for_defi || claim.defi || claim.scope === "defi:read") allowedScopes.add("defi:read");
    if (claim.authorized_for_defi_write || claim.scope === "defi:write") allowedScopes.add("defi:write");
    if (claim.authorized_for_deepfake || claim.deepfake || claim.scope === "deepfake") allowedScopes.add("deepfake");
  }

  if (!allowedScopes.has(toolEntry.scope)) {
    return c.json({ error: `Unauthorized scope for tool ${tool}` }, 403);
  }

  // 3. FinOps Budget Limit: check if daily budget of 500 cents ($5.00) is exceeded
  const currentCost = mockCostDb.get(userId) || 0;
  if (currentCost >= 500) {
    return c.json({ error: "Daily spending budget exceeded" }, 402);
  }

  // 4. Charge simulated fee (50 cents per call for third-party agents)
  mockCostDb.set(userId, currentCost + 50);

  // 5. Produce mock response data matching UC2 flight delayed email
  if (tool === "email.read") {
    if (args?.id === "msg_12345") {
      return c.json({
        result: {
          id: "msg_12345",
          from: "notifications@airline.com",
          to: "user@archon.me",
          subject: "Urgent: Your Flight AA234 is Delayed",
          body: "Dear Passenger, we regret to inform you that your flight AA234 from JFK to LAX is delayed by 3 hours. Booking ref: GJKD8S.",
          timestamp: Date.now() - 3600000
        }
      });
    }
    return c.json({ error: "Message not found" }, 404);
  }

  if (tool === "calendar.list_events") {
    return c.json({
      result: {
        events: [
          {
            id: "evt_1001",
            summary: "Flight AA234 (JFK to LAX)",
            description: "Boarding flight home"
          }
        ]
      }
    });
  }

  if (tool === "defi.get_balance") {
    return c.json({
      result: {
        balance: "10.0 ETH",
        tokens: [
          { symbol: "ETH", balance: 10.0 },
          { symbol: "USDC", balance: 500.0 }
        ]
      }
    });
  }

  if (tool === "defi.suggest_swap") {
    return c.json({
      result: {
        suggestion: "Swap 1.5 ETH to USDC",
        rate: 3500.0,
        price_change_percent: args?.price_change_percent || 2.5
      }
    });
  }

  if (tool === "deepfake.check") {
    const isSynthetic = (args?.media_hash || "").includes("synthetic");
    return c.json({
      result: {
        media_hash: args?.media_hash || "unknown",
        confidence: isSynthetic ? 0.98 : 0.05,
        is_synthetic: isSynthetic
      }
    });
  }

  return c.json({ error: "Execution failed" }, 500);
});

export default app;
