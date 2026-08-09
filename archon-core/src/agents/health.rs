use crate::agents::DomainAgent;
use crate::error::ArchonError;
use serde_json::Value;

pub struct HealthAgent;

impl DomainAgent for HealthAgent {
    // WHY: Routes incoming health actions
    fn process_intent(&self, action: &str, variables: &Value) -> Result<Value, ArchonError> {
        match action {
            "detect_anomaly" => self.detect_anomaly(variables),
            _ => Err(ArchonError::Internal(format!("Unknown health action: {}", action))),
        }
    }
}

impl HealthAgent {
    // WHY: Heart rate moving average anomaly detection
    fn detect_anomaly(&self, variables: &Value) -> Result<Value, ArchonError> {
        let heart_rates = variables.get("heart_rates")
            .and_then(|v| v.as_array())
            .ok_or_else(|| ArchonError::Internal("Missing 'heart_rates' array".to_string()))?;

        if heart_rates.is_empty() {
            return Ok(serde_json::json!({
                "average": 0.0,
                "anomaly_detected": false,
                "anomalies": [],
                "message": "No heart rate readings recorded."
            }));
        }

        let mut sum = 0.0;
        let mut readings = Vec::new();
        for rate in heart_rates {
            let val = rate.as_f64().ok_or_else(|| ArchonError::Internal("Invalid heart rate reading type".to_string()))?;
            sum += val;
            readings.push(val);
        }

        let average = sum / (readings.len() as f64);
        let mut anomalies = Vec::new();
        let mut anomaly_detected = false;

        for val in readings {
            // Flag if reading is 20% above average or exceeds 120 bpm threshold
            if val > average * 1.2 || val > 120.0 {
                anomalies.push(val);
                anomaly_detected = true;
            }
        }

        let message = if anomaly_detected {
            format!("Warning: We detected elevated heart rate anomalies (readings: {:?}). We suggest scheduling a doctor checkup.", anomalies)
        } else {
            "Heart rate metrics are normal. Well done!".to_string()
        };

        Ok(serde_json::json!({
            "average": average,
            "anomaly_detected": anomaly_detected,
            "anomalies": anomalies,
            "message": message
        }))
    }
}
