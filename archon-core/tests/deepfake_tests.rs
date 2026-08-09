use archon_core::deepfake::DeepfakeChecker;

#[test]
fn test_deepfake_checker_known_good() {
    let checker = DeepfakeChecker::new();
    
    // Known-good registered hash returns 0.0 (authentic)
    let score = checker.check_media("hash_authentic_selfie_01");
    assert_eq!(score, 0.0);
    
    let score2 = checker.check_media("hash_passport_photo_raw");
    assert_eq!(score2, 0.0);
}

#[test]
fn test_deepfake_checker_synthetic() {
    let checker = DeepfakeChecker::new();
    
    // Media with 'synthetic' or 'deepfake' pattern returns high risk score
    let score = checker.check_media("hash_deepfake_voice_leak");
    assert!(score > 0.9);
    
    let score2 = checker.check_media("some_synthetic_avatar_rendered");
    assert!(score2 > 0.9);
}

#[test]
fn test_deepfake_checker_unregistered_baseline() {
    let checker = DeepfakeChecker::new();
    
    // Normal unregistered hash returns base low baseline
    let score = checker.check_media("hash_unregistered_normal_photo_xyz");
    assert!((score - 0.15).abs() < 0.01);
}
