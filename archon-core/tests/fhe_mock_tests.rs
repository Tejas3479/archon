use archon_core::memory_fhe::MemoryFHE;

#[test]
fn test_fhe_mock_encryption_roundtrip() {
    let plain_embeddings = vec![0.12345, -0.98765, 0.00001];
    
    // Encrypt
    let cipher_bytes = MemoryFHE::encrypt_embedding(&plain_embeddings);
    assert_eq!(cipher_bytes.len(), plain_embeddings.len() * 8); // 8 bytes per i64
    
    // Decrypt (mock)
    let decrypted = MemoryFHE::decrypt_result(&cipher_bytes);
    assert_eq!(decrypted, cipher_bytes);
    
    // Validate values are scaled and masked correctly
    let mut offset = 0;
    for &val in &plain_embeddings {
        let mut slice = [0u8; 8];
        slice.copy_from_slice(&cipher_bytes[offset..offset+8]);
        let cipher_i64 = i64::from_be_bytes(slice);
        
        // Unmask and unscale
        let unmasked = cipher_i64 ^ 424242i64;
        let float_val = (unmasked as f64) / 100000.0;
        
        // Assert floating approximation matches
        assert!((float_val - val).abs() < 0.00001);
        
        offset += 8;
    }
}
