// WHY: Client-side prototype of FHE LWE (Learning With Errors) embedding serialization.
// Converts floating-point vectors into partially homomorphic noisy ciphertext pairs.
pub struct MemoryFHE;

impl MemoryFHE {
    // Generate deterministic pseudo-random key component for LWE encryption
    fn prng(seed: u64) -> i64 {
        let mut x = seed;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        x as i64
    }

    pub fn encrypt_embedding(plain: &[f64]) -> Vec<u8> {
        // Output array size doubles: (a, b) pairs of i64 (8 bytes each = 16 bytes per float)
        let mut encrypted = Vec::with_capacity(plain.len() * 16);
        let secret_key = 424242i64;
        
        for (i, &val) in plain.iter().enumerate() {
            // Scale up to preserve precision
            let m = (val * 100000.0) as i64;
            
            // LWE encryption: c = (a, a*s + m + e)
            let a = Self::prng((i as u64) + 1);
            let e = 3i64; // Small bounded noise
            
            let b = a.wrapping_mul(secret_key).wrapping_add(m).wrapping_add(e);
            
            encrypted.extend_from_slice(&a.to_be_bytes());
            encrypted.extend_from_slice(&b.to_be_bytes());
        }
        encrypted
    }

    pub fn decrypt_result(encrypted: &[u8]) -> Vec<u8> {
        let secret_key = 424242i64;
        let mut decrypted = Vec::with_capacity(encrypted.len() / 2);
        
        let mut offset = 0;
        while offset < encrypted.len() {
            let mut a_bytes = [0u8; 8];
            a_bytes.copy_from_slice(&encrypted[offset..offset+8]);
            let a = i64::from_be_bytes(a_bytes);
            
            let mut b_bytes = [0u8; 8];
            b_bytes.copy_from_slice(&encrypted[offset+8..offset+16]);
            let b = i64::from_be_bytes(b_bytes);
            
            // Decrypt LWE: m + e = b - a*s
            let m_noisy = b.wrapping_sub(a.wrapping_mul(secret_key));
            
            // In a real system, you'd round to nearest scaling delta. We just subtract the static noise.
            let m = m_noisy.wrapping_sub(3i64);
            
            decrypted.extend_from_slice(&m.to_be_bytes());
            
            offset += 16;
        }
        
        decrypted
    }
}
