use serde::{Serialize, Deserialize};
use crate::error::ArchonError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelWeights {
    pub w1: Vec<Vec<f64>>, // 16x5 matrix
    pub b1: Vec<f64>,      // 16 array
    pub w2: Vec<f64>,      // 16 array
    pub b2: f64,           // scalar bias
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttentionInput {
    pub calendar_busy: bool,
    pub hrv: f64,
    pub task_priority: u8,
    pub time_of_day: f64,  // 0.0 to 24.0 hours
    pub day_of_week: u8,   // 0 to 6
}

pub struct AttentionModel {
    weights: ModelWeights,
}

impl AttentionModel {
    // WHY: Constructor parses pre-trained neural network weights from a JSON config
    pub fn new(json_str: &str) -> Result<Self, ArchonError> {
        let weights: ModelWeights = serde_json::from_str(json_str)
            .map_err(|e| ArchonError::Serialization(format!("Failed to parse model weights: {:?}", e)))?;
            
        // Validate matrix dimensions
        if weights.w1.len() != 16 || weights.w1.iter().any(|row| row.len() != 5) {
            return Err(ArchonError::Internal("Weights dimension w1 must be 16x5".to_string()));
        }
        if weights.b1.len() != 16 || weights.w2.len() != 16 {
            return Err(ArchonError::Internal("Biases/Weights dimension b1/w2 must be 16".to_string()));
        }

        Ok(Self { weights })
    }

    // WHY: Predicts the user's interrupt budget score using feedforward neural inference
    pub fn predict(&self, input: &AttentionInput) -> f64 {
        // 1. Normalize features to range [0, 1]
        let x = vec![
            if input.calendar_busy { 1.0 } else { 0.0 },
            ((input.hrv - 20.0) / 130.0).clamp(0.0, 1.0),
            (input.task_priority as f64 / 5.0).clamp(0.0, 1.0),
            (input.time_of_day / 24.0).clamp(0.0, 1.0),
            (input.day_of_week as f64 / 6.0).clamp(0.0, 1.0),
        ];

        // 2. Hidden Layer (16 neurons, ReLU activation)
        let mut hidden = vec![0.0; 16];
        for i in 0..16 {
            let mut val = self.weights.b1[i];
            for j in 0..5 {
                val += x[j] * self.weights.w1[i][j];
            }
            hidden[i] = if val > 0.0 { val } else { 0.0 };
        }

        // 3. Output Layer (1 neuron, Sigmoid activation)
        let mut out = self.weights.b2;
        for i in 0..16 {
            out += hidden[i] * self.weights.w2[i];
        }

        // Sigmoid activation yields probability range [0.0, 1.0]
        1.0 / (1.0 + (-out).exp())
    }
}
