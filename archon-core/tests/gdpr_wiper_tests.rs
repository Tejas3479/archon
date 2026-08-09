use archon_core::identity::Identity;
use archon_core::gdpr_wiper::GDPRWiper;

#[test]
fn test_gdpr_wiper_signature_generation() {
    let identity = Identity::generate().unwrap();
    let user_id = "user_789";
    
    let signature_hex = GDPRWiper::prepare_and_sign_wipe(&identity, user_id).unwrap();
    
    // Proving signature is a non-empty hex string
    assert!(!signature_hex.is_empty());
    assert!(signature_hex.len() >= 128); // Ed25519 signature is 64 bytes (128 hex chars)
    
    // Decode signature bytes for validation
    let mut sig_bytes = Vec::new();
    let mut chars = signature_hex.chars();
    while let (Some(c1), Some(c2)) = (chars.next(), chars.next()) {
        let hex_str = format!("{}{}", c1, c2);
        let b = u8::from_str_radix(&hex_str, 16).unwrap();
        sig_bytes.push(b);
    }
    
    let message = format!("delete_all_user_data:{}", user_id);
    let pubkey = identity.public_key_bytes();
    
    // Cryptographically verify signature matches
    let is_valid = Identity::verify(&sig_bytes, message.as_bytes(), &pubkey);
    assert!(is_valid);
}
