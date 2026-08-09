import { z } from "zod";

// WHY: Validates generic events processed by the Proactive Detector
export const EventSchema = z.object({
  domain: z.string().min(1),
  payload: z.record(z.any()),
  timestamp: z.number().int().positive()
});

export type Event = z.infer<typeof EventSchema>;

// WHY: Validates agent-generated Proactive Intents for user approval
export const IntentSchema = z.object({
  id: z.string().uuid(),
  domain: z.string().min(1),
  action: z.string().min(1),
  confidence: z.number().min(0).max(1),
  parameters: z.record(z.any()),
  status: z.enum(["pending", "approved", "ignored", "executed"])
});

export type Intent = z.infer<typeof IntentSchema>;

// WHY: Recovery actions used by the Self-Healing router when a task failures
export const RecoveryActionSchema = z.enum(["Retry", "SwitchTool", "Escalate", "Abort"]);

export type RecoveryAction = z.infer<typeof RecoveryActionSchema>;
