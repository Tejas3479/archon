import { z } from "zod";

// WHY: Validates hex-encoded 32-byte Ed25519 public key
export const PublicKeySchema = z.string().regex(/^[0-9a-fA-F]{64}$/, "Invalid Ed25519 public key hex encoding");

// WHY: Validates client self-attestation payload sent to the gateway
export const AttestationSchema = z.object({
  publicKey: PublicKeySchema,
  signature: z.string().regex(/^[0-9a-fA-F]{128}$/, "Invalid signature hex encoding"),
  timestamp: z.number().int().positive(),
  deviceId: z.string().uuid("Invalid device UUID")
});

export type Attestation = z.infer<typeof AttestationSchema>;
