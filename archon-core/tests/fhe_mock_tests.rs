use archon_core::memory_fhe::MemoryFHE;

#[test]
fn test_fhe_mock_encryption_roundtrip() {
    let plain_embeddings = vec![0.12345, -0.98765, 0.00001];
    
    // Encrypt
    let cipher_bytes = MemoryFHE::encrypt_embedding(&plain_embeddings);
    assert_eq!(cipher_bytes.len(), plain_embeddings.len() * 16); // 16 bytes per element (a, b) pair
    
    // Decrypt LWE ciphertext directly back to scaled integers
    let decrypted = MemoryFHE::decrypt_result(&cipher_bytes);
    assert_eq!(decrypted.len(), plain_embeddings.len() * 8); 
    
    // Validate values map correctly back to floats
    let mut offset = 0;
    for &val in &plain_embeddings {
        let mut slice = [0u8; 8];
        slice.copy_from_slice(&decrypted[offset..offset+8]);
        let unmasked = i64::from_be_bytes(slice);
        
        let float_val = (unmasked as f64) / 100000.0;
        
        // Assert floating approximation matches
        assert!((float_val - val).abs() < 0.00001);
        
        offset += 8;
    }
}

#[test]
fn test_fhe_homomorphic_addition() {
    let plain1 = vec![1.5, -2.0];
    let plain2 = vec![3.0, 1.2];
    
    let c1 = MemoryFHE::encrypt_embedding(&plain1);
    let c2 = MemoryFHE::encrypt_embedding(&plain2);
    
    // Homomorphically add c1 and c2 in ciphertext space
    let mut c_sum = Vec::with_capacity(c1.len());
    let mut offset = 0;
    while offset < c1.len() {
        let mut a1_b = [0u8; 8]; a1_b.copy_from_slice(&c1[offset..offset+8]);
        let mut b1_b = [0u8; 8]; b1_b.copy_from_slice(&c1[offset+8..offset+16]);
        let a1 = i64::from_be_bytes(a1_b);
        let b1 = i64::from_be_bytes(b1_b);
        
        let mut a2_b = [0u8; 8]; a2_b.copy_from_slice(&c2[offset..offset+8]);
        let mut b2_b = [0u8; 8]; b2_b.copy_from_slice(&c2[offset+8..offset+16]);
        let a2 = i64::from_be_bytes(a2_b);
        let b2 = i64::from_be_bytes(b2_b);
        
        // Homomorphic Add!
        let a_sum = a1.wrapping_add(a2);
        let b_sum = b1.wrapping_add(b2);
        
        c_sum.extend_from_slice(&a_sum.to_be_bytes());
        c_sum.extend_from_slice(&b_sum.to_be_bytes());
        offset += 16;
    }
    
    // Decrypt the sum
    let decrypted = MemoryFHE::decrypt_result(&c_sum);
    
    // Check results
    // Since noise adds up (e1 + e2), our static noise subtraction of 3 in decrypt_result 
    // will leave an extra 3 of noise. So we expect `m + 3` after decrypting a sum of 2 elements.
    let expected = vec![4.5, -0.8];
    let mut offset_dec = 0;
    for &val in &expected {
        let mut slice = [0u8; 8];
        slice.copy_from_slice(&decrypted[offset_dec..offset_dec+8]);
        let unmasked = i64::from_be_bytes(slice);
        
        // adjust for accumulated noise
        let adjusted = unmasked.wrapping_sub(3);
        let float_val = (adjusted as f64) / 100000.0;
        
        assert!((float_val - val).abs() < 0.00001);
        offset_dec += 8;
    }
}
