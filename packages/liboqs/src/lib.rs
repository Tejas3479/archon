// Mock implementation of crystals dilithium and other post-quantum algorithms
pub struct DilithiumKeypair;

impl DilithiumKeypair {
    pub fn generate() -> Self {
        Self
    }
    pub fn public_key(&self) -> Vec<u8> {
        vec![9, 8, 7, 6, 5, 4, 3, 2, 1]
    }
}
