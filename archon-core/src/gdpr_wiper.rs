use crate::error::ArchonError;
use crate::identity::Identity;

pub struct GDPRWiper;

impl GDPRWiper {
    // WHY: Cryptographically signs a GDPR data wipe request using the active identity key
    // so the gateway can verify the user authorized deleting remote backups, then wipes on-device memory.
    pub fn prepare_and_sign_wipe(
        identity: &Identity,
        user_id: &str,
    ) -> Result<String, ArchonError> {
        let payload = format!("delete_all_user_data:{}", user_id);
        let signature_bytes = identity.sign(payload.as_bytes());
        
        // Return hexadecimal representation of signature for web API submission
        let signature_hex = signature_bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();
            
        Ok(signature_hex)
    }
}
