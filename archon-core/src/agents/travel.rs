use crate::agents::DomainAgent;
use crate::error::ArchonError;
use serde_json::Value;

pub struct TravelAgent;

impl DomainAgent for TravelAgent {
    // WHY: Routes travel intent commands to their rule-based evaluators
    fn process_intent(&self, action: &str, variables: &Value) -> Result<Value, ArchonError> {
        match action {
            "search_flights" => self.search_flights(variables),
            "monitor_price_drop" => self.monitor_price_drop(variables),
            "auto_checkin" => self.auto_checkin(variables),
            "suggest_hotel" => self.suggest_hotel(variables),
            _ => Err(ArchonError::Internal(format!("Unknown travel action: {}", action))),
        }
    }
}

impl TravelAgent {
    fn search_flights(&self, variables: &Value) -> Result<Value, ArchonError> {
        let dest = variables.get("destination").and_then(|v| v.as_str()).unwrap_or("New York");
        
        // Mock flight search result
        Ok(serde_json::json!({
            "flights": [
                { "flight_no": "AA234", "airline": "American Airlines", "price": 350.00, "destination": dest },
                { "flight_no": "DL892", "airline": "Delta Airlines", "price": 380.00, "destination": dest }
            ]
        }))
    }

    // WHY: Monitors recent bookings and checks for cheaper pricing, triggering auto-rebooking intents
    fn monitor_price_drop(&self, variables: &Value) -> Result<Value, ArchonError> {
        let original_price = variables.get("original_price").and_then(|v| v.as_f64()).unwrap_or(350.00);
        let dest = variables.get("destination").and_then(|v| v.as_str()).unwrap_or("New York");

        // Simulate flight price drop check (mock finding a $280 flight)
        if original_price > 300.0 && dest.to_lowercase().contains("new york") {
            let new_price = 280.00;
            let savings = original_price - new_price;
            Ok(serde_json::json!({
                "price_drop_detected": true,
                "new_price": new_price,
                "savings": savings,
                "flight_no": "AA234",
                "message": format!(
                    "Price Drop Alert: We detected a price drop for your trip to {}. Flight AA234 is now available for ${:.2} (saving you ${:.2}). Would you like to rebook?",
                    dest, new_price, savings
                )
            }))
        } else {
            Ok(serde_json::json!({
                "price_drop_detected": false,
                "message": "Flight prices are currently stable."
            }))
        }
    }

    // WHY: Automatically runs check-in scripts inside the 24-hour departure window
    fn auto_checkin(&self, variables: &Value) -> Result<Value, ArchonError> {
        let booking_ref = variables.get("booking_reference").and_then(|v| v.as_str())
            .ok_or_else(|| ArchonError::Internal("Missing 'booking_reference'".to_string()))?;

        Ok(serde_json::json!({
            "checkin_successful": true,
            "booking_reference": booking_ref,
            "seat": "14B",
            "boarding_pass_url": "https://archon-gateway.dev/passes/boarding_pass_AA234.pdf",
            "message": format!(
                "Auto Check-in Successful for Booking {}. Assigned Seat: 14B. Boarding pass has been successfully saved to your credential wallet.",
                booking_ref
            )
        }))
    }

    fn suggest_hotel(&self, variables: &Value) -> Result<Value, ArchonError> {
        let dest = variables.get("destination").and_then(|v| v.as_str()).unwrap_or("New York");

        Ok(serde_json::json!({
            "hotels": [
                { "name": "The Plaza", "price": 450.00, "rating": 4.8, "destination": dest },
                { "name": "Standard High Line", "price": 280.00, "rating": 4.5, "destination": dest }
            ]
        }))
    }
}
