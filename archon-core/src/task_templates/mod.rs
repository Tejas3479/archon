pub mod flight_delay;

use crate::detector::TaskTemplate;
use flight_delay::FlightDelayTemplate;

// WHY: Registers all proactive task templates in a unified vector
pub fn get_all_templates() -> Vec<Box<dyn TaskTemplate>> {
    vec![
        Box::new(FlightDelayTemplate),
    ]
}
