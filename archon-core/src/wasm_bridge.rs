use crate::identity::Identity;
use crate::vault::Vault;
use crate::detector::{Detector, Event};
use crate::event_bus::{publish_info, publish_error};
use crate::task_templates::get_all_templates;
use crate::graph::{Graph, Node, NodeType};
use crate::preferences::PreferenceGraph;
use crate::attention::{AttentionModel, AttentionInput};
use crate::anneal::{AnnealEngine, FailureRecord, GraphDelta};
use crate::rsi_sandbox::Sandbox;
use crate::swarm::{SwarmManager, SwarmMessage};
use crate::vc::{Credential, VerifiablePresentation};
use crate::agents::{finance::FinanceAgent, health::HealthAgent, home::HomeAgent, social::SocialAgent, forensic::ForensicAgent, travel::TravelAgent, defi::DeFiAgent, DomainAgent};
use crate::voice::VoiceProcessor;
use crate::spatial_ui::SpatialUI;
use crate::self_reflection::ReflectionEngine;
use crate::rsi_coordinator::RSICoordinator;
use crate::deepfake::DeepfakeChecker;
use crate::gdpr_wiper::GDPRWiper;
use crate::memory_fhe::MemoryFHE;

use std::sync::{Mutex, OnceLock};
use wasm_bindgen::prelude::*;

static IDENTITY: OnceLock<Mutex<Option<Identity>>> = OnceLock::new();
static VAULT: OnceLock<Mutex<Option<Vault>>> = OnceLock::new();
static DETECTOR: OnceLock<Detector> = OnceLock::new();
static GRAPH: OnceLock<Mutex<Graph>> = OnceLock::new();
static PREFERENCES: OnceLock<Mutex<PreferenceGraph>> = OnceLock::new();
static ATTENTION_MODEL: OnceLock<Mutex<Option<AttentionModel>>> = OnceLock::new();
static SWARM_MANAGER: OnceLock<Mutex<Option<SwarmManager>>> = OnceLock::new();
static VOICE_PROCESSOR: OnceLock<Mutex<VoiceProcessor>> = OnceLock::new();
static DEEPFAKE_CHECKER: OnceLock<DeepfakeChecker> = OnceLock::new();

#[wasm_bindgen]
pub fn init() -> Result<String, JsValue> {

    // Initialise tracing/console logs in wasm environments
    #[cfg(target_arch = "wasm32")]
    {
        tracing_wasm::set_as_global_default();
    }

    let templates = get_all_templates();
    let detector = Detector::new(templates);
    
    // Seed a default PKG workflow in the graph for testing
    let mut graph = Graph::new();
    let _ = graph.add_node(Node {
        id: "start_node".to_string(),
        node_type: NodeType::Decision("Check Delay".to_string()),
    });
    let _ = graph.add_node(Node {
        id: "old_tool_node".to_string(),
        node_type: NodeType::ToolCall("email.read".to_string()),
    });
    let _ = graph.add_node(Node {
        id: "tool_node".to_string(),
        node_type: NodeType::ToolCall("email.read".to_string()),
    });
    let _ = graph.add_edge("start_node", "tool_node");
    
    let _ = DETECTOR.set(detector);
    let _ = IDENTITY.set(Mutex::new(None));
    let _ = VAULT.set(Mutex::new(None));
    let _ = GRAPH.set(Mutex::new(graph));
    let _ = PREFERENCES.set(Mutex::new(PreferenceGraph::new()));
    let _ = ATTENTION_MODEL.set(Mutex::new(None));
    let _ = SWARM_MANAGER.set(Mutex::new(None));
    let _ = VOICE_PROCESSOR.set(Mutex::new(VoiceProcessor::new()));
    let _ = DEEPFAKE_CHECKER.set(DeepfakeChecker::new());

    publish_info("Archon core initialized successfully");
    Ok("Initialized".to_string())
}


#[wasm_bindgen]
pub fn generate_identity() -> Result<String, JsValue> {
    let identity = Identity::generate()
        .map_err(|e| {
            publish_error(&e);
            JsValue::from_str(&e.to_string())
        })?;
        
    let pub_key_hex = encode_hex(&identity.public_key_bytes());
    
    // Derived vault encryption key based on private seed
    let vault_key = identity.derive_vault_key();
    let vault = Vault::new(&vault_key);

    // Initialize SwarmManager with the deterministic identity secret
    let swarm_manager = SwarmManager::new(*identity.secret_bytes());

    if let Some(mutex) = IDENTITY.get() {
        let mut guard = mutex.lock().unwrap();
        *guard = Some(identity);
    }
    
    if let Some(mutex) = VAULT.get() {
        let mut guard = mutex.lock().unwrap();
        *guard = Some(vault);
    }

    if let Some(mutex) = SWARM_MANAGER.get() {
        let mut guard = mutex.lock().unwrap();
        *guard = Some(swarm_manager);
    }

    publish_info(&format!("Identity generated: {}", pub_key_hex));
    Ok(pub_key_hex)
}

#[wasm_bindgen]
pub fn encrypt_memory(plaintext: &str) -> Result<Vec<u8>, JsValue> {
    let vault_mutex = VAULT.get()
        .ok_or_else(|| JsValue::from_str("Vault OnceLock not initialized"))?;
    let vault_guard = vault_mutex.lock().unwrap();
    let vault = vault_guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Vault not derived. Generate identity first."))?;
        
    let ciphertext = vault.encrypt(plaintext.as_bytes())
        .map_err(|e| {
            publish_error(&e);
            JsValue::from_str(&e.to_string())
        })?;
        
    Ok(ciphertext)
}

#[wasm_bindgen]
pub fn decrypt_memory(ciphertext: &[u8]) -> Result<String, JsValue> {
    let vault_mutex = VAULT.get()
        .ok_or_else(|| JsValue::from_str("Vault OnceLock not initialized"))?;
    let vault_guard = vault_mutex.lock().unwrap();
    let vault = vault_guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Vault not derived. Generate identity first."))?;
        
    let decrypted_bytes = vault.decrypt(ciphertext)
        .map_err(|e| {
            publish_error(&e);
            JsValue::from_str(&e.to_string())
        })?;
        
    let plaintext = String::from_utf8(decrypted_bytes)
        .map_err(|err| JsValue::from_str(&format!("Invalid UTF-8 plaintext: {:?}", err)))?;
        
    Ok(plaintext)
}

#[wasm_bindgen]
pub fn process_event(json_str: &str) -> Result<String, JsValue> {
    let event: Event = serde_json::from_str(json_str)
        .map_err(|err| JsValue::from_str(&format!("Failed to parse Event JSON: {:?}", err)))?;
        
    let detector = DETECTOR.get()
        .ok_or_else(|| JsValue::from_str("Detector OnceLock not initialized"))?;
        
    let intents = detector.process_event(&event);
    
    let result_json = serde_json::to_string(&intents)
        .map_err(|err| JsValue::from_str(&format!("Failed to serialize Intents: {:?}", err)))?;
        
    Ok(result_json)
}

// WHY: Exported function to run failure regex analysis for ANNEAL repairs
#[wasm_bindgen]
pub fn anneal_analyze(json_failures: &str) -> Result<String, JsValue> {
    let failures: Vec<FailureRecord> = serde_json::from_str(json_failures)
        .map_err(|err| JsValue::from_str(&format!("Failed to parse failures: {:?}", err)))?;
        
    let engine = AnnealEngine::new();
    let delta = engine.analyze_failures(&failures)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    let res = serde_json::to_string(&delta)
        .map_err(|err| JsValue::from_str(&format!("Failed to serialize delta: {:?}", err)))?;
        
    Ok(res)
}

// WHY: Exported function to execute and verify graph-structural updates
#[wasm_bindgen]
pub fn apply_delta(json_delta: &str) -> Result<bool, JsValue> {
    let delta: GraphDelta = serde_json::from_str(json_delta)
        .map_err(|err| JsValue::from_str(&format!("Failed to parse delta: {:?}", err)))?;
        
    let graph_mutex = GRAPH.get()
        .ok_or_else(|| JsValue::from_str("Graph OnceLock not initialized"))?;
        
    let mut graph = graph_mutex.lock().unwrap();
    graph.apply_delta(&delta)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    Ok(true)
}

// WHY: Exported function to fetch active user style preference weights
#[wasm_bindgen]
pub fn get_preference(key: &str) -> Result<f64, JsValue> {
    let prefs_mutex = PREFERENCES.get()
        .ok_or_else(|| JsValue::from_str("Preferences OnceLock not initialized"))?;
        
    let prefs = prefs_mutex.lock().unwrap();
    Ok(prefs.get_preference(key))
}

// WHY: Exported function to update user style preference weights
#[wasm_bindgen]
pub fn update_preference(key: &str, delta: f64) -> Result<(), JsValue> {
    let prefs_mutex = PREFERENCES.get()
        .ok_or_else(|| JsValue::from_str("Preferences OnceLock not initialized"))?;
        
    let mut prefs = prefs_mutex.lock().unwrap();
    prefs.update_preference(key, delta);
    Ok(())
}

// WHY: Exported function to initialize pre-trained weights for the attention model
#[wasm_bindgen]
pub fn init_attention_model(json_weights: &str) -> Result<(), JsValue> {
    let model = AttentionModel::new(json_weights)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    let model_mutex = ATTENTION_MODEL.get()
        .ok_or_else(|| JsValue::from_str("Attention model OnceLock not initialized"))?;
        
    let mut guard = model_mutex.lock().unwrap();
    *guard = Some(model);
    Ok(())
}

// WHY: Exported function to predict attention budget interrupt probability on-device
#[wasm_bindgen]
pub fn predict_attention(json_input: &str) -> Result<f64, JsValue> {
    let input: AttentionInput = serde_json::from_str(json_input)
        .map_err(|err| JsValue::from_str(&format!("Failed to parse input: {:?}", err)))?;
        
    let model_mutex = ATTENTION_MODEL.get()
        .ok_or_else(|| JsValue::from_str("Attention model OnceLock not initialized"))?;
        
    let guard = model_mutex.lock().unwrap();
    let model = guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Attention model not initialized. Call init_attention_model first."))?;
        
    Ok(model.predict(&input))
}

// WHY: Exported function to run nested Wasm sandbox with memory/fuel metering
#[wasm_bindgen]
pub fn sandbox_run(wasm_bytes: &[u8], input_json: &str) -> Result<String, JsValue> {
    let sandbox = Sandbox::new();
    let res = sandbox.run(wasm_bytes, input_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(res)
}

// WHY: Custom hex encode utility to avoid bloating wasm build with extra crates
fn encode_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

fn decode_hex(s: &str) -> Result<Vec<u8>, JsValue> {
    let mut bytes = Vec::new();
    let mut chars = s.chars();
    while let (Some(c1), Some(c2)) = (chars.next(), chars.next()) {
        let hex_str = format!("{}{}", c1, c2);
        let b = u8::from_str_radix(&hex_str, 16)
            .map_err(|e| JsValue::from_str(&format!("Invalid hex string: {:?}", e)))?;
        bytes.push(b);
    }
    Ok(bytes)
}

#[wasm_bindgen]
pub fn swarm_send_message(peer_pubkey_hex: &str, payload_json: &str) -> Result<String, JsValue> {
    let peer_pubkey_bytes = decode_hex(peer_pubkey_hex)?;
    let peer_pubkey_array = <[u8; 32]>::try_from(peer_pubkey_bytes)
        .map_err(|_| JsValue::from_str("Peer public key must be 32 bytes"))?;

    let message: SwarmMessage = serde_json::from_str(payload_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid payload: {:?}", e)))?;

    let swarm_mutex = SWARM_MANAGER.get()
        .ok_or_else(|| JsValue::from_str("Swarm OnceLock not initialized"))?;
    let guard = swarm_mutex.lock().unwrap();
    let swarm = guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Swarm not initialized. Generate identity first."))?;

    let encrypted_bytes = swarm.encrypt_message(&peer_pubkey_array, &message)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(encode_hex(&encrypted_bytes))
}

#[wasm_bindgen]
pub fn swarm_receive_message(peer_pubkey_hex: &str, ciphertext_hex: &str) -> Result<String, JsValue> {
    let peer_pubkey_bytes = decode_hex(peer_pubkey_hex)?;
    let peer_pubkey_array = <[u8; 32]>::try_from(peer_pubkey_bytes)
        .map_err(|_| JsValue::from_str("Peer public key must be 32 bytes"))?;

    let ciphertext = decode_hex(ciphertext_hex)?;

    let swarm_mutex = SWARM_MANAGER.get()
        .ok_or_else(|| JsValue::from_str("Swarm OnceLock not initialized"))?;
    let guard = swarm_mutex.lock().unwrap();
    let swarm = guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Swarm not initialized. Generate identity first."))?;

    let message = swarm.decrypt_message(&peer_pubkey_array, &ciphertext)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let res = serde_json::to_string(&message)
        .map_err(|e| JsValue::from_str(&format!("Serialize failed: {:?}", e)))?;

    Ok(res)
}

#[wasm_bindgen]
pub fn swarm_authorize_peer(peer_pubkey_hex: &str, scope: &str) -> Result<(), JsValue> {
    let swarm_mutex = SWARM_MANAGER.get()
        .ok_or_else(|| JsValue::from_str("Swarm OnceLock not initialized"))?;
    let mut guard = swarm_mutex.lock().unwrap();
    let swarm = guard.as_mut()
        .ok_or_else(|| JsValue::from_str("Swarm not initialized"))?;

    swarm.policy.authorize_peer(peer_pubkey_hex, scope);
    Ok(())
}

#[wasm_bindgen]
pub fn swarm_check_peer_authorized(peer_pubkey_hex: &str, scope: &str) -> Result<bool, JsValue> {
    let swarm_mutex = SWARM_MANAGER.get()
        .ok_or_else(|| JsValue::from_str("Swarm OnceLock not initialized"))?;
    let guard = swarm_mutex.lock().unwrap();
    let swarm = guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Swarm not initialized"))?;

    Ok(swarm.policy.is_authorized(peer_pubkey_hex, scope))
}

#[wasm_bindgen]
pub fn swarm_get_public_key() -> Result<String, JsValue> {
    let swarm_mutex = SWARM_MANAGER.get()
        .ok_or_else(|| JsValue::from_str("Swarm OnceLock not initialized"))?;
    let guard = swarm_mutex.lock().unwrap();
    let swarm = guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Swarm not initialized"))?;

    Ok(encode_hex(&swarm.public_key_bytes()))
}

#[wasm_bindgen]
pub fn issue_credential(id: &str, subject_pubkey_hex: &str, claims_json: &str) -> Result<String, JsValue> {
    let identity_mutex = IDENTITY.get()
        .ok_or_else(|| JsValue::from_str("Identity OnceLock not initialized"))?;
    let identity_guard = identity_mutex.lock().unwrap();
    let identity = identity_guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Identity not generated"))?;

    let issuer_pubkey_hex = encode_hex(&identity.public_key_bytes());
    let claims: serde_json::Value = serde_json::from_str(claims_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid claims JSON: {:?}", e)))?;

    let credential = Credential::issue(id, &issuer_pubkey_hex, subject_pubkey_hex, claims, identity)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let res = serde_json::to_string(&credential)
        .map_err(|e| JsValue::from_str(&format!("Serialize credential failed: {:?}", e)))?;

    Ok(res)
}

#[wasm_bindgen]
pub fn verify_credential(credential_json: &str, issuer_pubkey_hex: &str) -> Result<bool, JsValue> {
    let credential: Credential = serde_json::from_str(credential_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid credential JSON: {:?}", e)))?;

    let issuer_pubkey_bytes = decode_hex(issuer_pubkey_hex)?;
    let issuer_pubkey_array = <[u8; 32]>::try_from(issuer_pubkey_bytes)
        .map_err(|_| JsValue::from_str("Issuer public key must be 32 bytes"))?;

    Ok(credential.verify(&issuer_pubkey_array))
}

#[wasm_bindgen]
pub fn create_presentation(credentials_json: &str, subject_pubkey_hex: &str) -> Result<String, JsValue> {
    let identity_mutex = IDENTITY.get()
        .ok_or_else(|| JsValue::from_str("Identity OnceLock not initialized"))?;
    let identity_guard = identity_mutex.lock().unwrap();
    let identity = identity_guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Identity not generated"))?;

    let credentials: Vec<Credential> = serde_json::from_str(credentials_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid credentials JSON: {:?}", e)))?;

    let vp = VerifiablePresentation::create(credentials, subject_pubkey_hex, identity)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let res = serde_json::to_string(&vp)
        .map_err(|e| JsValue::from_str(&format!("Serialize VP failed: {:?}", e)))?;

    Ok(res)
}

#[wasm_bindgen]
pub fn verify_presentation(presentation_json: &str, subject_pubkey_hex: &str) -> Result<bool, JsValue> {
    let vp: VerifiablePresentation = serde_json::from_str(presentation_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid presentation JSON: {:?}", e)))?;

    let subject_pubkey_bytes = decode_hex(subject_pubkey_hex)?;
    let subject_pubkey_array = <[u8; 32]>::try_from(subject_pubkey_bytes)
        .map_err(|_| JsValue::from_str("Subject public key must be 32 bytes"))?;

    Ok(vp.verify(&subject_pubkey_array))
}

#[wasm_bindgen]
pub fn process_domain_intent(domain: &str, action: &str, json_variables: &str) -> Result<String, JsValue> {
    let variables: serde_json::Value = serde_json::from_str(json_variables)
        .map_err(|e| JsValue::from_str(&format!("Invalid variables JSON: {:?}", e)))?;

    let res = match domain.to_lowercase().as_str() {
        "finance" => {
            let agent = FinanceAgent;
            agent.process_intent(action, &variables)
        }
        "health" => {
            let agent = HealthAgent;
            agent.process_intent(action, &variables)
        }
        "home" => {
            let agent = HomeAgent;
            agent.process_intent(action, &variables)
        }
        "social" => {
            let agent = SocialAgent;
            agent.process_intent(action, &variables)
        }
        "forensic" => {
            let agent = ForensicAgent;
            agent.process_intent(action, &variables)
        }
        "travel" => {
            let agent = TravelAgent;
            agent.process_intent(action, &variables)
        }
        "defi" => {
            let agent = DeFiAgent;
            agent.process_intent(action, &variables)
        }
        _ => return Err(JsValue::from_str(&format!("Unknown domain agent: {}", domain))),
    }.map_err(|e| JsValue::from_str(&e.to_string()))?;


    let res_str = serde_json::to_string(&res)
        .map_err(|e| JsValue::from_str(&format!("Serialize response failed: {:?}", e)))?;

    Ok(res_str)
}

#[wasm_bindgen]
pub fn process_voice_command(text: &str) -> Result<String, JsValue> {
    let voice_mutex = VOICE_PROCESSOR.get()
        .ok_or_else(|| JsValue::from_str("Voice OnceLock not initialized"))?;
    let mut guard = voice_mutex.lock().unwrap();

    let res = guard.process_command(text)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let res_str = serde_json::to_string(&res)
        .map_err(|e| JsValue::from_str(&format!("Serialize voice result failed: {:?}", e)))?;

    Ok(res_str)
}

#[wasm_bindgen]
pub fn get_spatial_scene() -> Result<String, JsValue> {
    let graph_mutex = GRAPH.get()
        .ok_or_else(|| JsValue::from_str("Graph OnceLock not initialized"))?;
    let graph_guard = graph_mutex.lock().unwrap();
    let has_pending = graph_guard.node_ids().len() > 1;

    let pref_mutex = PREFERENCES.get()
        .ok_or_else(|| JsValue::from_str("Preferences OnceLock not initialized"))?;
    let pref_guard = pref_mutex.lock().unwrap();
    let temp_weight = pref_guard.get_preference("risk_averse"); 
    let comfort_temp = if temp_weight > 0.0 { Some(72.0) } else { None };


    let anomalies_detected = false; 

    let scene = SpatialUI::generate_scene(has_pending, anomalies_detected, comfort_temp);
    let scene_str = serde_json::to_string(&scene)
        .map_err(|e| JsValue::from_str(&format!("Serialize scene failed: {:?}", e)))?;

    Ok(scene_str)
}

#[wasm_bindgen]
pub fn trigger_reflection() -> Result<String, JsValue> {
    let event_logs = vec![
        "Claim delayed flight refund intent created".to_string(),
        "Thermostat temperature preference learned: 72.0".to_string(),
        "Tool execution: email.read".to_string(),
        "Self-healing delta verified and applied".to_string()
    ];

    let report = ReflectionEngine::generate_report(&event_logs)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let report_str = serde_json::to_string(&report)
        .map_err(|e| JsValue::from_str(&format!("Serialize report failed: {:?}", e)))?;

    Ok(report_str)
}

#[wasm_bindgen]
pub fn travel_agent_process_intent(json_variables: &str) -> Result<String, JsValue> {
    let variables: serde_json::Value = serde_json::from_str(json_variables)
        .map_err(|e| JsValue::from_str(&format!("Invalid variables JSON: {:?}", e)))?;
        
    let action = variables.get("action").and_then(|v| v.as_str()).unwrap_or("search_flights");
    
    let agent = TravelAgent;
    let res = agent.process_intent(action, &variables)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    let res_str = serde_json::to_string(&res)
        .map_err(|e| JsValue::from_str(&format!("Serialize travel response failed: {:?}", e)))?;

    Ok(res_str)
}

#[wasm_bindgen]
pub fn rsi_run(json_failures: &str, wasm_bytes: &[u8]) -> Result<String, JsValue> {
    let failures: Vec<FailureRecord> = serde_json::from_str(json_failures)
        .map_err(|err| JsValue::from_str(&format!("Failed to parse failures: {:?}", err)))?;
        
    let graph_mutex = GRAPH.get()
        .ok_or_else(|| JsValue::from_str("Graph OnceLock not initialized"))?;
        
    let mut graph = graph_mutex.lock().unwrap();
    let records = RSICoordinator::run(&failures, wasm_bytes, &mut graph)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    let records_json = serde_json::to_string(&records)
        .map_err(|err| JsValue::from_str(&format!("Failed to serialize records: {:?}", err)))?;
        
    Ok(records_json)
}

#[wasm_bindgen]
pub fn defi_get_balance() -> Result<String, JsValue> {
    let agent = DeFiAgent;
    let res = agent.process_intent("check_balance", &serde_json::Value::Null)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let res_str = serde_json::to_string(&res)
        .map_err(|e| JsValue::from_str(&format!("Serialize response failed: {:?}", e)))?;
    Ok(res_str)
}

#[wasm_bindgen]
pub fn defi_suggest_swap(from: &str, to: &str, amount: f64) -> Result<String, JsValue> {
    let agent = DeFiAgent;
    let variables = serde_json::json!({
        "from": from,
        "to": to,
        "amount": amount,
        "price_change_percent": 2.5
    });
    let res = agent.process_intent("suggest_swap", &variables)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let res_str = serde_json::to_string(&res)
        .map_err(|e| JsValue::from_str(&format!("Serialize response failed: {:?}", e)))?;
    Ok(res_str)
}

#[wasm_bindgen]
pub fn deepfake_check(media_hash: &str) -> Result<f64, JsValue> {
    let checker = DEEPFAKE_CHECKER.get()
        .ok_or_else(|| JsValue::from_str("Deepfake OnceLock not initialized"))?;
    Ok(checker.check_media(media_hash))
}

#[wasm_bindgen]
pub fn gdpr_wipe(user_id: &str) -> Result<String, JsValue> {
    let identity_mutex = IDENTITY.get()
        .ok_or_else(|| JsValue::from_str("Identity OnceLock not initialized"))?;
    let identity_guard = identity_mutex.lock().unwrap();
    let identity = identity_guard.as_ref()
        .ok_or_else(|| JsValue::from_str("Identity not generated. Generate identity first."))?;

    let signature_hex = GDPRWiper::prepare_and_sign_wipe(identity, user_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Reset local state in memory
    if let Some(mutex) = VAULT.get() {
        *mutex.lock().unwrap() = None;
    }
    if let Some(mutex) = GRAPH.get() {
        let mut graph = mutex.lock().unwrap();
        *graph = Graph::new();
    }
    if let Some(mutex) = PREFERENCES.get() {
        let mut prefs = mutex.lock().unwrap();
        *prefs = PreferenceGraph::new();
    }

    Ok(signature_hex)
}

#[wasm_bindgen]
pub fn fhe_encrypt_embedding(plain: &[f64]) -> Result<Vec<u8>, JsValue> {
    Ok(MemoryFHE::encrypt_embedding(plain))
}

#[wasm_bindgen]
pub fn fhe_decrypt_result(encrypted: &[u8]) -> Result<Vec<u8>, JsValue> {
    Ok(MemoryFHE::decrypt_result(encrypted))
}

#[wasm_bindgen]
pub fn dev_agent_request(json_task: &str) -> Result<String, JsValue> {
    let task: crate::dev_agent::TaskDescription = serde_json::from_str(json_task)
        .map_err(|err| JsValue::from_str(&format!("Failed to parse TaskDescription: {:?}", err)))?;
        
    let response = crate::dev_agent::DevAgent::request_improvement(&task)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    let response_json = serde_json::to_string(&response)
        .map_err(|err| JsValue::from_str(&format!("Failed to serialize CodeGenResponse: {:?}", err)))?;
        
    Ok(response_json)
}

