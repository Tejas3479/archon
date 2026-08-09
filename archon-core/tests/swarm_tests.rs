use archon_core::swarm::{SwarmManager, SwarmMessage};

#[test]
fn test_swarm_key_exchange_and_encryption() {
    // Generate two distinct mock identity seeds
    let seed_a = [1u8; 32];
    let seed_b = [2u8; 32];

    let manager_a = SwarmManager::new(seed_a);
    let manager_b = SwarmManager::new(seed_b);

    let pub_a = manager_a.public_key_bytes();
    let pub_b = manager_b.public_key_bytes();

    // Perform DH key exchanges
    let key_ab = manager_a.derive_shared_key(&pub_b);
    let key_ba = manager_b.derive_shared_key(&pub_a);

    // Assert both derived identical symmetric keys
    assert_eq!(key_ab, key_ba);

    // Encrypt message A -> B
    let msg = SwarmMessage::ShareIntent {
        intent_id: "int_77".to_string(),
        domain: "health".to_string(),
        payload: serde_json::json!({ "hrv": 85.0 }),
    };

    let ciphertext = manager_a.encrypt_message(&pub_b, &msg).expect("Encryption failed");

    // Decrypt B <- A
    let decrypted = manager_b.decrypt_message(&pub_a, &ciphertext).expect("Decryption failed");

    match decrypted {
        SwarmMessage::ShareIntent { intent_id, domain, payload } => {
            assert_eq!(intent_id, "int_77");
            assert_eq!(domain, "health");
            assert_eq!(payload["hrv"], 85.0);
        }
        _ => panic!("Unexpected message type decoded"),
    }
}

#[test]
fn test_swarm_capability_policy() {
    let seed_a = [1u8; 32];
    let mut manager_a = SwarmManager::new(seed_a);
    
    let peer_pub_hex = "02".repeat(32);
    
    // Default is unauthorized
    assert!(!manager_a.policy.is_authorized(&peer_pub_hex, "health.read"));

    // Authorize specific scope
    manager_a.policy.authorize_peer(&peer_pub_hex, "health.read");
    assert!(manager_a.policy.is_authorized(&peer_pub_hex, "health.read"));
    assert!(!manager_a.policy.is_authorized(&peer_pub_hex, "finance.read"));

    // Wildcard authorization
    manager_a.policy.authorize_peer(&peer_pub_hex, "*");
    assert!(manager_a.policy.is_authorized(&peer_pub_hex, "finance.read"));
}
