use serde::{Serialize, Deserialize};
use crate::identity::Identity;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignedMCPRequest {
    pub user_id: String,
    pub tool: String,
    pub arguments: serde_json::Value,
    pub signature: String,
    pub timestamp: u64,
}

pub struct MCPClient;

impl MCPClient {
    // WHY: Formulates and signs a tool execution request using the Ed25519 identity key.
    // The gateway verifies this signature against the user's public key before issuing a JIT token.
    pub fn create_request(
        identity: &Identity,
        user_id: &str,
        tool: &str,
        arguments: serde_json::Value,
        timestamp: u64,
    ) -> SignedMCPRequest {
        let payload = format!("{}:{}:{}", user_id, tool, timestamp);
        let signature_bytes = identity.sign(payload.as_bytes());
        
        // Custom hex encoder to bypass dependency requirements
        let signature_hex = signature_bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        SignedMCPRequest {
            user_id: user_id.to_string(),
            tool: tool.to_string(),
            arguments,
            signature: signature_hex,
            timestamp,
        }
    }
}
