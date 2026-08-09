use archon_core::attention::{AttentionModel, AttentionInput, ModelWeights};

fn make_dummy_weights() -> ModelWeights {
    ModelWeights {
        w1: vec![vec![0.1; 5]; 16],
        b1: vec![0.05; 16],
        w2: vec![0.2; 16],
        b2: -0.5,
    }
}

#[test]
fn test_attention_model_initialization() {
    let weights = make_dummy_weights();
    let json_str = serde_json::to_string(&weights).unwrap();
    
    let model = AttentionModel::new(&json_str);
    assert!(model.is_ok());
}

#[test]
fn test_attention_model_invalid_dimensions() {
    let mut weights = make_dummy_weights();
    weights.w1[0] = vec![0.1; 4]; // Invalid row size
    
    let json_str = serde_json::to_string(&weights).unwrap();
    let model = AttentionModel::new(&json_str);
    assert!(model.is_err());
}

#[test]
fn test_attention_model_prediction() {
    let weights = make_dummy_weights();
    let json_str = serde_json::to_string(&weights).unwrap();
    let model = AttentionModel::new(&json_str).unwrap();
    
    let input = AttentionInput {
        calendar_busy: true,
        hrv: 80.0,
        task_priority: 3,
        time_of_day: 14.5,
        day_of_week: 2,
    };
    
    let prob = model.predict(&input);
    assert!(prob >= 0.0 && prob <= 1.0);
}
