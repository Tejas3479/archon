use archon_core::vault::Vault;

#[test]
fn test_vault_encryption_roundtrip() {
    let master_key = [0x42u8; 32];
    let vault = Vault::new(&master_key);
    
    let plaintext = b"Confidential Personal Bio Data: CGM=115, Sleep=94%";
    
    // Encrypt
    let ciphertext = vault.encrypt(plaintext).expect("Encryption should succeed");
    assert!(ciphertext.len() > 12); // Must include 12-byte nonce
    
    // Decrypt
    let decrypted = vault.decrypt(&ciphertext).expect("Decryption should succeed");
    assert_eq!(decrypted, plaintext);
}

#[test]
fn test_vault_decryption_failures() {
    let master_key = [0x42u8; 32];
    let vault = Vault::new(&master_key);
    
    // Attempting to decrypt empty/too-short ciphertexts
    let short_res = vault.decrypt(&[1, 2, 3]);
    assert!(short_res.is_err(), "Should error on ciphertext too short");
    
    let plaintext = b"Hello, Vault!";
    let mut ciphertext = vault.encrypt(plaintext).expect("Encryption should succeed");
    
    // Modifying the ciphertext payload (breaking the auth tag)
    let end = ciphertext.len() - 1;
    ciphertext[end] ^= 0x01;
    
    let bad_decrypt = vault.decrypt(&ciphertext);
    assert!(bad_decrypt.is_err(), "Decryption should fail if ciphertext is tampered with");
}
