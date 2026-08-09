use archon_core::spatial_ui::SpatialUI;

#[test]
fn test_spatial_ui_default_active() {
    let scene = SpatialUI::generate_scene(false, false, None);
    
    assert_eq!(scene.orb_color, "#10b981"); // Green for default/active
    assert_eq!(scene.orb_pulse_rate, 0.5);
    assert_eq!(scene.camera_fov, 60.0);
    assert_eq!(scene.widgets.len(), 1);
    assert_eq!(scene.widgets[0].id, "widget_status");
    assert_eq!(scene.widgets[0].title, "System Active");
    assert!(scene.animation_trigger.is_none());
}

#[test]
fn test_spatial_ui_with_comfort_temp() {
    let scene = SpatialUI::generate_scene(false, false, Some(72.5));
    
    assert_eq!(scene.orb_color, "#10b981");
    assert_eq!(scene.widgets.len(), 2);
    
    let thermostat_widget = scene.widgets.iter().find(|w| w.id == "widget_thermostat").unwrap();
    assert_eq!(thermostat_widget.title, "Smart Thermostat");
    assert!(thermostat_widget.detail.contains("72.5"));
}

#[test]
fn test_spatial_ui_pending_intents() {
    let scene = SpatialUI::generate_scene(true, false, None);
    
    assert_eq!(scene.orb_color, "#3b82f6"); // Blue for pending intents
    assert_eq!(scene.orb_pulse_rate, 2.0);
    assert_eq!(scene.widgets.len(), 1);
    assert_eq!(scene.widgets[0].id, "widget_action");
    assert_eq!(scene.animation_trigger, Some("breathing_pulse".to_string()));
}

#[test]
fn test_spatial_ui_anomalies_detected() {
    let scene = SpatialUI::generate_scene(false, true, None);
    
    assert_eq!(scene.orb_color, "#ef4444"); // Red for warnings
    assert_eq!(scene.orb_pulse_rate, 3.5);
    
    let alert_widget = scene.widgets.iter().find(|w| w.id == "widget_alert").unwrap();
    assert_eq!(alert_widget.title, "BioAnomaly Warning");
    assert_eq!(scene.animation_trigger, Some("spasm_pulse".to_string()));
}
