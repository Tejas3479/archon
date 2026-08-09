use crate::error::ArchonError;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce, Key
};
use rand::RngCore;

pub struct Vault {
    cipher: Aes256Gcm,
}

impl Vault {
    // WHY: Initialises the AES-256-GCM cipher with a 32-byte master key derived from the enclave.
    pub fn new(master_key: &[u8; 32]) -> Self {
        let key = Key::<Aes256Gcm>::from_slice(master_key);
        let cipher = Aes256Gcm::new(key);
        Self { cipher }
    }

    // WHY: Encrypts memory blocks returning: nonce (12 bytes) || ciphertext + tag
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, ArchonError> {
        let mut nonce_bytes = [0u8; 12];
        
        // getrandom is configured with "js" features, so rand work on wasm
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        let mut encrypted = self.cipher.encrypt(nonce, plaintext)
            .map_err(|err| ArchonError::Vault(format!("Encryption failed: {:?}", err)))?;
            
        let mut result = nonce_bytes.to_vec();
        result.append(&mut encrypted);
        
        Ok(result)
    }

    // WHY: Decrypts memory block using the prepended 12-byte nonce
    pub fn decrypt(&self, ciphertext: &[u8]) -> Result<Vec<u8>, ArchonError> {
        if ciphertext.len() < 12 {
            return Err(ArchonError::Vault("Ciphertext is too short (missing nonce)".to_string()));
        }
        
        let (nonce_bytes, encrypted_payload) = ciphertext.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        let decrypted = self.cipher.decrypt(nonce, encrypted_payload)
            .map_err(|err| ArchonError::Vault(format!("Decryption failed: {:?}", err)))?;
            
        Ok(decrypted)
    }
}
