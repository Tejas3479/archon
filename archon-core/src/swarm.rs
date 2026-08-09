use crate::error::ArchonError;
use crate::vault::Vault;
use x25519_dalek::{StaticSecret, PublicKey};
use hkdf::Hkdf;
use sha2::Sha256;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

// WHY: SwarmMessage defines the peer-to-peer data packet types exchanged between family twin instances.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SwarmMessage {
    ShareIntent {
        intent_id: String,
        domain: String,
        payload: serde_json::Value,
    },
    Request {
        request_id: String,
        query: String,
    },
    Response {
        request_id: String,
        data: serde_json::Value,
    },
    CapabilityUpdate {
        capabilities: Vec<String>,
    },
}

// WHY: SwarmPolicy stores capability token mappings. It dictates what metrics or scopes can be shared with which peer public keys.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SwarmPolicy {
    pub permissions: HashMap<String, Vec<String>>, // peer_pubkey_hex -> list of authorized scopes/domains
}

impl SwarmPolicy {
    pub fn new() -> Self {
        Self {
            permissions: HashMap::new(),
        }
    }

    pub fn authorize_peer(&mut self, peer_pubkey_hex: &str, scope: &str) {
        self.permissions
            .entry(peer_pubkey_hex.to_string())
            .or_insert_with(Vec::new)
            .push(scope.to_string());
    }

    pub fn is_authorized(&self, peer_pubkey_hex: &str, scope: &str) -> bool {
        if let Some(scopes) = self.permissions.get(peer_pubkey_hex) {
            scopes.iter().any(|s| s == scope || s == "*")
        } else {
            false
        }
    }
}

pub struct SwarmManager {
    static_secret: StaticSecret,
    public_key: PublicKey,
    pub policy: SwarmPolicy,
}

impl SwarmManager {
    // WHY: Constructor initializes deterministic X25519 secret keys from the twin's private seed.
    pub fn new(identity_secret: [u8; 32]) -> Self {
        let static_secret = StaticSecret::from(identity_secret);
        let public_key = PublicKey::from(&static_secret);
        Self {
            static_secret,
            public_key,
            policy: SwarmPolicy::new(),
        }
    }

    // WHY: Swarm public key to exchange with peers
    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.public_key.to_bytes()
    }

    // WHY: Performs Diffie-Hellman key exchange and HKDF-SHA256 expansion to derive shared symmetric AES-GCM keys
    pub fn derive_shared_key(&self, peer_pubkey: &[u8; 32]) -> [u8; 32] {
        let peer_public = PublicKey::from(*peer_pubkey);
        let shared_secret = self.static_secret.diffie_hellman(&peer_public);
        
        let hk = Hkdf::<Sha256>::new(None, shared_secret.as_bytes());
        let mut aes_key = [0u8; 32];
        hk.expand(b"archon-swarm-aes-gcm", &mut aes_key)
            .expect("HKDF shared key expansion failed");
            
        aes_key
    }

    // WHY: Encrypts swarm message payload using the derived peer shared key via AES-GCM
    pub fn encrypt_message(
        &self,
        peer_pubkey: &[u8; 32],
        message: &SwarmMessage,
    ) -> Result<Vec<u8>, ArchonError> {
        let shared_key = self.derive_shared_key(peer_pubkey);
        let vault = Vault::new(&shared_key);
        
        let plaintext_bytes = serde_json::to_vec(message)
            .map_err(|e| ArchonError::Serialization(format!("SwarmMessage serialize failed: {:?}", e)))?;
            
        vault.encrypt(&plaintext_bytes)
    }

    // WHY: Decrypts swarm message payload using the derived peer shared key
    pub fn decrypt_message(
        &self,
        peer_pubkey: &[u8; 32],
        ciphertext: &[u8],
    ) -> Result<SwarmMessage, ArchonError> {
        let shared_key = self.derive_shared_key(peer_pubkey);
        let vault = Vault::new(&shared_key);
        
        let decrypted_bytes = vault.decrypt(ciphertext)?;
        
        let message: SwarmMessage = serde_json::from_slice(&decrypted_bytes)
            .map_err(|e| ArchonError::Serialization(format!("SwarmMessage deserialize failed: {:?}", e)))?;
            
        Ok(message)
    }
}
