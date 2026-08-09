use archon_core::identity::Identity;

#[test]
fn test_identity_key_generation_and_signatures() {
    // Generate new Ed25519 identity
    let identity = Identity::generate().expect("Should generate identity successfully");
    let public_key = identity.public_key_bytes();
    
    let message = b"Archon Zero-Trust Handshake Protocol V1";
    
    // Sign the message
    let signature = identity.sign(message);
    assert_eq!(signature.len(), 64);
    
    // Verify signature
    let verified = Identity::verify(&signature, message, &public_key);
    assert!(verified, "Signature verification should pass");

    // Invalid signature verification should fail
    let mut invalid_signature = signature.clone();
    invalid_signature[0] ^= 0xFF;
    let verified_failed = Identity::verify(&invalid_signature, message, &public_key);
    assert!(!verified_failed, "Invalid signature verification should fail");
}
