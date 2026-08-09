import { z } from "zod";

// WHY: Validates NodeType serializations from the Rust orchestrator graph
export const NodeTypeSchema = z.union([
  z.object({ Decision: z.string() }),
  z.object({ ToolCall: z.string() }),
  z.object({ HumanApproval: z.string() }),
  z.object({ SelfHealing: z.string() })
]);

export type NodeType = z.infer<typeof NodeTypeSchema>;

// WHY: Validates individual delta operations used in self-healing graph repairs
export const DeltaOpSchema = z.union([
  z.object({
    AddNode: z.object({
      id: z.string().min(1),
      node_type: NodeTypeSchema
    })
  }),
  z.object({
    RemoveNode: z.object({
      id: z.string().min(1)
    })
  }),
  z.object({
    AddEdge: z.object({
      from_id: z.string().min(1),
      to_id: z.string().min(1)
    })
  }),
  z.object({
    ChangeProperty: z.object({
      node_id: z.string().min(1),
      property: z.string().min(1),
      value: z.any()
    })
  })
]);

export type DeltaOp = z.infer<typeof DeltaOpSchema>;

// WHY: Validates the collection of operations representing a workflow change
export const GraphDeltaSchema = z.object({
  operations: z.array(DeltaOpSchema)
});

export type GraphDelta = z.infer<typeof GraphDeltaSchema>;

// WHY: Validates self-healing failure analysis results
export const AnnealResultSchema = GraphDeltaSchema;

export type AnnealResult = z.infer<typeof AnnealResultSchema>;

// WHY: Validates preference update requests passed to the enclaves
export const PreferenceUpdateSchema = z.object({
  key: z.string().min(1),
  delta: z.number()
});

export type PreferenceUpdate = z.infer<typeof PreferenceUpdateSchema>;

// WHY: Validates input features for attention budget predictions
export const AttentionInputSchema = z.object({
  calendar_busy: z.boolean(),
  hrv: z.number(),
  task_priority: z.number().int().min(0).max(255),
  time_of_day: z.number().min(0.0).max(24.0),
  day_of_week: z.number().int().min(0).max(6)
});

export type AttentionInput = z.infer<typeof AttentionInputSchema>;
