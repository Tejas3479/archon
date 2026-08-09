use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpatialWidget {
    pub id: String,
    pub title: String,
    pub detail: String,
    pub position: (f32, f32, f32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpatialScene {
    pub orb_color: String,
    pub orb_pulse_rate: f32,
    pub camera_fov: f32,
    pub widgets: Vec<SpatialWidget>,
    pub animation_trigger: Option<String>,
}

pub struct SpatialUI;

impl SpatialUI {
    // WHY: Converts the twin's active cognitive/intent state into a spatial 3D scene descriptor
    // that floating widgets and 3D orbs render in VR, AR, or screen WebView spaces.
    pub fn generate_scene(
        has_pending_intents: bool,
        anomalies_detected: bool,
        comfort_temp: Option<f64>,
    ) -> SpatialScene {
        let mut widgets = Vec::new();

        // 1. Render a floating widget for Comfort Thermostat preference if learned
        if let Some(temp) = comfort_temp {
            widgets.push(SpatialWidget {
                id: "widget_thermostat".to_string(),
                title: "Smart Thermostat".to_string(),
                detail: format!("Auto Comfort Setpoint: {:.1}°F", temp),
                position: (-1.5, 0.5, -2.0),
            });
        }

        // 2. Set orb properties and triggers based on cognitive state
        let (color, pulse, trigger) = if anomalies_detected {
            widgets.push(SpatialWidget {
                id: "widget_alert".to_string(),
                title: "BioAnomaly Warning".to_string(),
                detail: "High heart rate spikes recorded. Check Health tab.".to_string(),
                position: (0.0, 1.5, -2.0),
            });
            ("#ef4444".to_string(), 3.5, Some("spasm_pulse".to_string()))
        } else if has_pending_intents {
            widgets.push(SpatialWidget {
                id: "widget_action".to_string(),
                title: "Proactive Task".to_string(),
                detail: "Awaiting approval for claim refund draft.".to_string(),
                position: (1.5, 0.5, -2.0),
            });
            ("#3b82f6".to_string(), 2.0, Some("breathing_pulse".to_string()))
        } else {
            widgets.push(SpatialWidget {
                id: "widget_status".to_string(),
                title: "System Active".to_string(),
                detail: "Archon secure enclave running normally.".to_string(),
                position: (0.0, -1.0, -2.0),
            });
            ("#10b981".to_string(), 0.5, None)
        };

        SpatialScene {
            orb_color: color,
            orb_pulse_rate: pulse,
            camera_fov: 60.0,
            widgets,
            animation_trigger: trigger,
        }
    }
}
