import { Context, Next } from "hono";
import { logWarn } from "../event_log.js";

export async function rateLimit(
  c: Context,
  key: string,
  maxRequests: number,
  windowSec: number
): Promise<boolean> {
  const isPenTest = c.env.PEN_TEST_MODE === "true";
  if (isPenTest) {
    return true; // Bypass rate limiting during penetration tests
  }

  const kv = c.env.PUBLIC_KEYS as KVNamespace;
  if (!kv) {
    return true; // Fallback if KV is not bound (e.g. tests without KV)
  }

  const kvKey = `rate_limit:${key}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;

  try {
    const rawVal = await kv.get(kvKey);
    let timestamps: number[] = [];
    if (rawVal) {
      timestamps = JSON.parse(rawVal);
    }

    // Filter out old timestamps
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      logWarn("Rate limit exceeded", { key, total: timestamps.length, limit: maxRequests });
      return false;
    }

    // Add current timestamp and store back
    timestamps.push(now);
    await kv.put(kvKey, JSON.stringify(timestamps), { expirationTtl: windowSec });
    return true;
  } catch (err: any) {
    logWarn("Rate limiter error, defaulting to allow", { key, error: err.message });
    return true;
  }
}

export function limitByClient(maxRequests = 100, windowSec = 60) {
  return async (c: Context, next: Next) => {
    // Attempt to parse client_id from request params, query, body, or JWT context
    const body = await c.req.parseBody().catch(() => ({}));
    const payload = c.get("jwtPayload") as any;
    const clientId =
      c.req.query("client_id") ||
      (body as any).client_id ||
      payload?.clientId ||
      "anonymous_client";

    const allowed = await rateLimit(c, `client:${clientId}`, maxRequests, windowSec);
    if (!allowed) {
      return c.json({ error: "slow_down", error_description: "Client rate limit exceeded" }, 429);
    }
    await next();
  };
}

export function limitByUser(maxRequests = 300, windowSec = 60) {
  return async (c: Context, next: Next) => {
    const payload = c.get("jwtPayload") as any;
    const userId = payload?.userId || c.req.query("userId") || "anonymous_user";

    const allowed = await rateLimit(c, `user:${userId}`, maxRequests, windowSec);
    if (!allowed) {
      return c.json({ error: "slow_down", error_description: "User rate limit exceeded" }, 429);
    }
    await next();
  };
}
