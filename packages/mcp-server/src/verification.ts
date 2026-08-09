import { Context, Next } from "hono";
import * as crypto from "node:crypto";

export interface Proof {
  proof_type: string;
  created: string;
  verification_method: string;
  proof_value: string;
}

export interface Credential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: string;
  issuance_date: string;
  credential_subject: {
    id: string;
    claims: any;
  };
  proof?: Proof;
}

export interface VerifiablePresentation {
  "@context": string[];
  type: string[];
  verifiable_credential: Credential[];
  proof?: Proof;
}

// WHY: Verifies that the credential proof is cryptographically sound using the issuer's public key
export function verifyCredential(cred: Credential): boolean {
  if (!cred.proof) return false;
  
  // Reconstruct unsigned copy
  const { proof, ...unsignedCopy } = cred;
  
  // In Rust, serialization is done. In JS, to match exactly we can stringify.
  // To avoid key sorting issues, let's reconstruct keys in exact order:
  // context, id, type, issuer, issuance_date, credential_subject
  const canonical: any = {};
  canonical["@context"] = unsignedCopy["@context"];
  canonical["id"] = unsignedCopy["id"];
  canonical["type"] = unsignedCopy["type"];
  canonical["issuer"] = unsignedCopy["issuer"];
  canonical["issuance_date"] = unsignedCopy["issuance_date"];
  canonical["credential_subject"] = unsignedCopy["credential_subject"];
  
  const payloadStr = JSON.stringify(canonical);
  
  const issuerPrefix = "did:key:";
  if (!cred.issuer.startsWith(issuerPrefix)) return false;
  const publicKeyHex = cred.issuer.slice(issuerPrefix.length);
  
  try {
    const pubKeyBuffer = Buffer.from(publicKeyHex, "hex");
    const sigBuffer = Buffer.from(proof.proof_value, "hex");
    const dataBuffer = Buffer.from(payloadStr);
    
    const pubKey = crypto.createPublicKey({
      key: {
        kty: "OKP",
        crv: "Ed25519",
        x: pubKeyBuffer.toString("base64url")
      },
      format: "jwk"
    });
    
    return crypto.verify(null, dataBuffer, pubKey, sigBuffer);
  } catch (e) {
    return false;
  }
}

// WHY: Verify the presentation wrapper and each credential within it
export function verifyPresentation(vp: VerifiablePresentation): boolean {
  if (!vp.proof) return false;
  const { proof, ...unsignedCopy } = vp;
  
  // Reconstruct canonical presentation
  const canonical: any = {};
  canonical["@context"] = unsignedCopy["@context"];
  canonical["type"] = unsignedCopy["type"];
  canonical["verifiable_credential"] = unsignedCopy["verifiable_credential"];
  
  const payloadStr = JSON.stringify(canonical);
  
  const subjectPrefix = "did:key:";
  const verificationMethod = proof.verification_method;
  const hashIndex = verificationMethod.indexOf("#");
  const methodUri = hashIndex !== -1 ? verificationMethod.slice(0, hashIndex) : verificationMethod;
  
  if (!methodUri.startsWith(subjectPrefix)) return false;
  const subjectPubKeyHex = methodUri.slice(subjectPrefix.length);
  
  try {
    const pubKeyBuffer = Buffer.from(subjectPubKeyHex, "hex");
    const sigBuffer = Buffer.from(proof.proof_value, "hex");
    const dataBuffer = Buffer.from(payloadStr);
    
    const pubKey = crypto.createPublicKey({
      key: {
        kty: "OKP",
        crv: "Ed25519",
        x: pubKeyBuffer.toString("base64url")
      },
      format: "jwk"
    });
    
    const isVpValid = crypto.verify(null, dataBuffer, pubKey, sigBuffer);
    if (!isVpValid) return false;
  } catch (e) {
    return false;
  }
  
  // Verify each credential individually
  for (const cred of vp.verifiable_credential) {
    if (!verifyCredential(cred)) {
      return false;
    }
  }
  
  return true;
}

// WHY: Middleware that extracts and cryptographically validates VC or VP tokens from Authorization headers
export const vcMiddleware = async (c: Context<{ Variables: { verifiedClaims: any[] } }>, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  
  const token = authHeader.substring(7);
  try {
    const parsed = JSON.parse(token);
    let isValid = false;
    let claims: any[] = [];
    
    if (parsed.presentation_type || parsed.verifiable_credential) {
      isValid = verifyPresentation(parsed as VerifiablePresentation);
      if (isValid) {
        claims = parsed.verifiable_credential.map((cred: Credential) => cred.credential_subject.claims);
      }
    } else if (parsed.credential_subject) {
      isValid = verifyCredential(parsed as Credential);
      if (isValid) {
        claims = [parsed.credential_subject.claims];
      }
    }
    
    if (!isValid) {
      return c.json({ error: "Verifiable Credential signature verification failed" }, 401);
    }
    
    // Attach verified claims to context
    c.set("verifiedClaims", claims);
    await next();
  } catch (error: any) {
    return c.json({ error: "Failed to parse Verifiable Credential: " + error.message }, 400);
  }
};
