use crate::error::ArchonError;
use crate::identity::Identity;
use serde::{Serialize, Deserialize};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proof {
    pub proof_type: String, // e.g. "Ed25519Signature2020"
    pub created: String,    // ISO 8601 timestamp
    pub verification_method: String, // e.g. "did:key:<issuer_pub_key_hex>"
    pub proof_value: String,         // Hex-encoded signature value
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credential {
    #[serde(rename = "@context")]
    pub context: Vec<String>,
    pub id: String,
    #[serde(rename = "type")]
    pub credential_type: Vec<String>,
    pub issuer: String, // e.g. "did:key:<issuer_pub_key_hex>"
    pub issuance_date: String,
    pub credential_subject: serde_json::Value,
    pub proof: Option<Proof>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifiablePresentation {
    #[serde(rename = "@context")]
    pub context: Vec<String>,
    #[serde(rename = "type")]
    pub presentation_type: Vec<String>,
    pub verifiable_credential: Vec<Credential>,
    pub proof: Option<Proof>,
}

impl Credential {
    // WHY: Issue a signed verifiable credential using the issuer's identity
    pub fn issue(
        id: &str,
        issuer_pub_key_hex: &str,
        subject_pub_key_hex: &str,
        claims: serde_json::Value,
        identity: &Identity,
    ) -> Result<Self, ArchonError> {
        let mut credential = Self {
            context: vec!["https://www.w3.org/2018/credentials/v1".to_string()],
            id: id.to_string(),
            credential_type: vec!["VerifiableCredential".to_string(), "ArchonClaimCredential".to_string()],
            issuer: format!("did:key:{}", issuer_pub_key_hex),
            issuance_date: Utc::now().to_rfc3339(),
            credential_subject: serde_json::json!({
                "id": format!("did:key:{}", subject_pub_key_hex),
                "claims": claims
            }),
            proof: None,
        };

        // Serialize canonical representation for signature payload
        let payload = serde_json::to_vec(&credential)
            .map_err(|e| ArchonError::Serialization(format!("Credential canonicalization failed: {:?}", e)))?;

        let sig_bytes = identity.sign(&payload);
        let proof_value_hex = sig_bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        let proof = Proof {
            proof_type: "Ed25519Signature2020".to_string(),
            created: Utc::now().to_rfc3339(),
            verification_method: format!("did:key:{}#key-1", issuer_pub_key_hex),
            proof_value: proof_value_hex,
        };

        credential.proof = Some(proof);
        Ok(credential)
    }

    // WHY: Verifies that the credential proof is cryptographically sound using the issuer's public key
    pub fn verify(&self, issuer_pub_key: &[u8; 32]) -> bool {
        let Some(proof) = &self.proof else {
            return false;
        };

        // Reconstruct credential without proof to verify original payload
        let mut unsigned_copy = self.clone();
        unsigned_copy.proof = None;

        let Ok(payload) = serde_json::to_vec(&unsigned_copy) else {
            return false;
        };

        // Custom hex decoder
        let sig_bytes = match decode_hex(&proof.proof_value) {
            Ok(bytes) => bytes,
            Err(_) => return false,
        };

        Identity::verify(&sig_bytes, &payload, issuer_pub_key)
    }
}

impl VerifiablePresentation {
    // WHY: Creates a verifiable presentation signed by the subject to prove ownership of contained credentials
    pub fn create(
        credentials: Vec<Credential>,
        subject_pub_key_hex: &str,
        identity: &Identity,
    ) -> Result<Self, ArchonError> {
        let mut vp = Self {
            context: vec!["https://www.w3.org/2018/credentials/v1".to_string()],
            presentation_type: vec!["VerifiablePresentation".to_string()],
            verifiable_credential: credentials,
            proof: None,
        };

        let payload = serde_json::to_vec(&vp)
            .map_err(|e| ArchonError::Serialization(format!("VP canonicalization failed: {:?}", e)))?;

        let sig_bytes = identity.sign(&payload);
        let proof_value_hex = sig_bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        let proof = Proof {
            proof_type: "Ed25519Signature2020".to_string(),
            created: Utc::now().to_rfc3339(),
            verification_method: format!("did:key:{}#key-1", subject_pub_key_hex),
            proof_value: proof_value_hex,
        };

        vp.proof = Some(proof);
        Ok(vp)
    }

    // WHY: Verify the presentation wrapper and each credential within it
    pub fn verify(&self, subject_pub_key: &[u8; 32]) -> bool {
        let Some(proof) = &self.proof else {
            return false;
        };

        let mut unsigned_copy = self.clone();
        unsigned_copy.proof = None;

        let Ok(payload) = serde_json::to_vec(&unsigned_copy) else {
            return false;
        };

        let sig_bytes = match decode_hex(&proof.proof_value) {
            Ok(bytes) => bytes,
            Err(_) => return false,
        };

        // 1. Verify subject signature on the presentation wrapper
        if !Identity::verify(&sig_bytes, &payload, subject_pub_key) {
            return false;
        }

        // 2. Verify each credential individually
        for cred in &self.verifiable_credential {
            // Extract issuer public key from did:key:<pubkey>
            let issuer_prefix = "did:key:";
            if !cred.issuer.starts_with(issuer_prefix) {
                return false;
            }
            let pub_key_hex = &cred.issuer[issuer_prefix.len()..];
            let Ok(pub_key_bytes) = decode_hex(pub_key_hex) else {
                return false;
            };
            let Ok(pub_key_array) = <[u8; 32]>::try_from(pub_key_bytes) else {
                return false;
            };

            if !cred.verify(&pub_key_array) {
                return false;
            }
        }

        true
    }
}

fn decode_hex(s: &str) -> Result<Vec<u8>, ArchonError> {
    let mut bytes = Vec::new();
    let mut chars = s.chars();
    while let (Some(c1), Some(c2)) = (chars.next(), chars.next()) {
        let hex_str = format!("{}{}", c1, c2);
        let b = u8::from_str_radix(&hex_str, 16)
            .map_err(|e| ArchonError::Serialization(format!("Invalid hex string: {:?}", e)))?;
        bytes.push(b);
    }
    Ok(bytes)
}
