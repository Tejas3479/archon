use archon_core::identity::Identity;
use archon_core::tools::mcp_client::MCPClient;

fn hex_decode(s: &str) -> Vec<u8> {
    let mut bytes = Vec::new();
    let mut chars = s.chars();
    while let (Some(c1), Some(c2)) = (chars.next(), chars.next()) {
        let hex_str = format!("{}{}", c1, c2);
        if let Ok(b) = u8::from_str_radix(&hex_str, 16) {
            bytes.push(b);
        }
    }
    bytes
}

#[test]
fn test_mcp_client_signed_request() {
    let identity = Identity::generate().expect("Failed to generate identity");
    let user_id = "test_user_123";
    let tool = "calendar.read";
    let args = serde_json::json!({ "date": "2026-06-07" });
    let timestamp = 1622505600;

    let req = MCPClient::create_request(&identity, user_id, tool, args, timestamp);

    assert_eq!(req.user_id, user_id);
    assert_eq!(req.tool, tool);
    assert_eq!(req.timestamp, timestamp);

    // Verify signature
    let payload = format!("{}:{}:{}", user_id, tool, timestamp);
    let sig_bytes = hex_decode(&req.signature);
    let pub_key = identity.public_key_bytes();

    let is_valid = Identity::verify(&sig_bytes, payload.as_bytes(), &pub_key);
    assert!(is_valid, "Signature verification failed");
}
