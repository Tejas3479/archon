use crate::agents::DomainAgent;
use crate::error::ArchonError;
use serde_json::Value;

pub struct HomeAgent;

impl DomainAgent for HomeAgent {
    // WHY: Routes incoming home automation actions
    fn process_intent(&self, action: &str, variables: &Value) -> Result<Value, ArchonError> {
        match action {
            "learn_preference" => self.learn_preference(variables),
            _ => Err(ArchonError::Internal(format!("Unknown home action: {}", action))),
        }
    }
}

impl HomeAgent {
    // WHY: Learns temperature preference from historical manual thermostat adjustments
    fn learn_preference(&self, variables: &Value) -> Result<Value, ArchonError> {
        let adjustments = variables.get("temperature_adjustments")
            .and_then(|v| v.as_array())
            .ok_or_else(|| ArchonError::Internal("Missing 'temperature_adjustments' array".to_string()))?;

        if adjustments.is_empty() {
            return Ok(serde_json::json!({
                "learned_temp": null,
                "preference_detected": false,
                "message": "No climate adjustments recorded yet."
            }));
        }

        let mut frequency = std::collections::HashMap::new();
        for adj in adjustments {
            let temp = adj.get("temp")
                .and_then(|v| v.as_f64())
                .ok_or_else(|| ArchonError::Internal("Invalid temperature value type".to_string()))?;
            
            // Round to 1 decimal place to group effectively
            let temp_key = (temp * 10.0) as i64;
            *frequency.entry(temp_key).or_insert(0) += 1;
        }

        // Find most frequent temperature setting
        let mut best_temp = None;
        let mut max_count = 0;
        for (temp_key, count) in frequency {
            if count > max_count {
                max_count = count;
                best_temp = Some((temp_key as f64) / 10.0);
            }
        }

        // Trigger preference creation if seen more than 2 times
        let preference_detected = max_count > 2;
        let message = if let Some(temp) = best_temp {
            if preference_detected {
                format!(
                    "Preference Detected: We noticed you adjusted the temperature to {:.1}°F multiple times. Would you like to schedule an automation rule for this?",
                    temp
                )
            } else {
                format!("Analyzed adjustments. Most common temperature is {:.1}°F (count: {}). Gathering more data.", temp, max_count)
            }
        } else {
            "No clear temperature preference detected.".to_string()
        };

        Ok(serde_json::json!({
            "learned_temp": best_temp,
            "preference_detected": preference_detected,
            "message": message
        }))
    }
}
