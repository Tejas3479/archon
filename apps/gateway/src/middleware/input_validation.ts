import { z } from "zod";
import { Context, Next } from "hono";

export const registerSchema = z.object({
  userId: z.string().min(1),
  publicKey: z.string().length(64) // Ed25519 hex is 64 hex characters
});

export const tokenRequestSchema = z.object({
  userId: z.string().min(1),
  tool: z.string().min(1),
  signature: z.string().min(1),
  timestamp: z.number().int().positive()
});

export const executeSchema = z.object({
  userId: z.string().min(1),
  token: z.string().min(1),
  tool: z.string().min(1),
  arguments: z.any().optional()
});

export const swarmSendSchema = z.object({
  recipientId: z.string().min(1),
  message: z.string().min(1)
});

export const installSchema = z.object({
  skillId: z.string().min(1)
});

export const sandboxReviewSchema = z.object({
  skillId: z.string().min(1)
});

export const writeCodeSchema = z.object({
  task_description: z.string().min(1),
  language: z.enum(["rust", "typescript"])
});

export const orgCreateSchema = z.object({
  name: z.string().min(1),
  plan: z.string().optional()
});

export const orgInviteSchema = z.object({
  email: z.string().email(),
  role: z.preprocess((val) => typeof val === "string" ? val.toLowerCase() : val, z.enum(["admin", "member", "viewer", "owner"]))
});

export const orgRoleUpdateSchema = z.object({
  role: z.preprocess((val) => typeof val === "string" ? val.toLowerCase() : val, z.enum(["admin", "member", "viewer", "owner"]))
});

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      let body: any = {};
      const contentType = c.req.header("Content-Type") || "";
      if (contentType.includes("application/json")) {
        body = await c.req.json();
      } else {
        body = await c.req.parseBody();
      }
      
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "validation_failed", details: parsed.error.format() }, 400);
      }
      
      c.set("validBody", parsed.data);
      await next();
    } catch (err: any) {
      return c.json({ error: "validation_failed", error_description: "Malformed body or invalid format" }, 400);
    }
  };
}
