use archon_core::identity::Identity;
use archon_core::vc::{Credential, VerifiablePresentation};

#[test]
fn test_vc_issuance_and_verification() {
    let issuer_identity = Identity::generate().expect("Failed to generate identity");
    let subject_identity = Identity::generate().expect("Failed to generate subject identity");

    let issuer_pub_hex = encode_hex(&issuer_identity.public_key_bytes());
    let subject_pub_hex = encode_hex(&subject_identity.public_key_bytes());

    let claims = serde_json::json!({
        "age_over_18": true,
        "membership_type": "premium"
    });

    // 1. Issue VC
    let vc = Credential::issue("vc_123", &issuer_pub_hex, &subject_pub_hex, claims, &issuer_identity)
        .expect("VC issuance failed");

    // 2. Verify VC
    let is_valid = vc.verify(&issuer_identity.public_key_bytes());
    assert!(is_valid, "Cryptographic signature validation failed");

    // 3. Tampering test
    let mut tampered_vc = vc.clone();
    tampered_vc.credential_subject["claims"]["age_over_18"] = serde_json::json!(false);
    let is_tampered_valid = tampered_vc.verify(&issuer_identity.public_key_bytes());
    assert!(!is_tampered_valid, "Tampered credential should fail verification");
}

#[test]
fn test_vp_creation_and_verification() {
    let issuer_identity = Identity::generate().expect("Failed to generate issuer identity");
    let subject_identity = Identity::generate().expect("Failed to generate subject identity");

    let issuer_pub_hex = encode_hex(&issuer_identity.public_key_bytes());
    let subject_pub_hex = encode_hex(&subject_identity.public_key_bytes());

    let claims = serde_json::json!({ "authorized_for_social": true });
    let vc = Credential::issue("vc_456", &issuer_pub_hex, &subject_pub_hex, claims, &issuer_identity)
        .expect("VC issuance failed");

    // Create VP containing the VC, signed by the subject
    let vp = VerifiablePresentation::create(vec![vc], &subject_pub_hex, &subject_identity)
        .expect("VP creation failed");

    // Verify VP
    let is_vp_valid = vp.verify(&subject_identity.public_key_bytes());
    assert!(is_vp_valid, "Verifiable Presentation validation failed");
}

fn encode_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}
