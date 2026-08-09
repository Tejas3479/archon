use crate::error::ArchonError;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VoiceProcessor {
    pub awaiting_parameter: Option<String>,
    pub current_domain: Option<String>,
    pub current_action: Option<String>,
    pub stored_params: serde_json::Map<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceResult {
    pub intent_detected: bool,
    pub clarification_needed: bool,
    pub message: String,
    pub intent: Option<serde_json::Value>,
}

pub static INTENT_CENTROIDS: &[(&str, [f32; 16])] = &[
    ("travel", [0.8931, -0.0638, -0.0401, 0.0537, 0.1601, 0.1417, -0.1633, -0.0051, 0.0560, 0.0862, -0.0818, 0.1444, 0.0763, -0.1504, 0.1610, 0.1192]),
    ("food", [-0.0151, 0.9416, 0.0076, 0.1260, 0.0463, -0.0526, -0.0575, 0.1340, 0.0933, 0.1656, 0.0093, -0.0901, -0.1462, 0.0583, -0.0359, -0.1132]),
    ("home", [-0.0270, 0.1581, 0.9439, 0.0558, -0.1274, 0.0504, 0.1311, -0.1622, -0.0194, 0.0877, 0.0664, 0.0252, -0.0743, -0.0759, 0.1066, -0.0268]),
    ("finance", [0.0858, -0.0632, 0.0833, 0.9009, 0.1770, 0.0435, 0.0392, 0.1118, -0.0691, -0.1503, 0.1121, -0.1165, 0.1132, -0.1167, 0.0984, -0.1592]),
    ("health", [0.0601, 0.1018, 0.0768, -0.1332, 0.9332, 0.1738, 0.0175, 0.0799, 0.0734, -0.1554, 0.1343, 0.1042, -0.0116, 0.0740, -0.0305, 0.0673]),
    ("social", [0.0246, -0.0949, 0.0338, 0.1592, -0.0403, 0.8880, 0.1991, 0.0038, -0.1637, -0.1812, -0.1562, 0.0510, 0.1169, -0.0311, -0.1747, -0.0474]),
];

pub fn get_word_embedding(word: &str) -> Option<[f32; 16]> {
    match word {
        "flight" => Some([0.9342, 0.0091, 0.1469, 0.1125, -0.1523, 0.0688, 0.0567, 0.0115, -0.0727, 0.0440, -0.1211, -0.0203, -0.0144, 0.1415, 0.1172, -0.0738]),
        "travel" => Some([0.9011, -0.1158, 0.1487, 0.1335, -0.0726, 0.0501, 0.0393, -0.1251, 0.0946, 0.0142, 0.1004, 0.0109, -0.1800, -0.0634, -0.1732, 0.1546]),
        "trip" => Some([0.9194, 0.1059, -0.0615, -0.1412, 0.1207, 0.1427, -0.1323, -0.0045, -0.1376, 0.0832, 0.0849, -0.1187, -0.0079, 0.0159, -0.0750, 0.1189]),
        "book" => Some([0.9285, -0.1104, 0.0151, 0.0881, -0.1145, -0.0721, 0.1897, 0.0574, -0.0237, 0.0067, -0.1452, -0.1055, -0.0620, 0.0338, -0.1034, -0.1072]),
        "destination" => Some([0.8722, 0.0552, -0.1142, 0.1707, 0.1515, -0.1807, -0.1103, 0.0712, -0.1203, -0.1548, 0.1834, 0.0299, -0.0115, 0.1199, 0.1295, -0.1304]),
        "vacation" => Some([0.9134, -0.0300, -0.0333, -0.0144, 0.0998, 0.0755, 0.2109, -0.1749, -0.0424, -0.0700, 0.1575, -0.1095, -0.1349, -0.0224, -0.0340, -0.0965]),
        "fly" => Some([0.8588, 0.1616, -0.0217, 0.1379, 0.0192, -0.1716, 0.1906, 0.1283, 0.1790, 0.1628, 0.1331, -0.1274, -0.0055, -0.1093, -0.0378, -0.1685]),
        "hotel" => Some([0.8996, 0.1835, -0.0888, 0.1074, -0.0170, -0.0291, 0.1729, 0.1873, 0.0211, 0.0826, -0.1305, -0.0769, 0.1772, 0.0299, 0.0160, 0.0938]),
        "food" => Some([-0.1556, 0.9081, 0.0010, 0.1240, -0.1204, 0.1619, -0.1476, -0.1104, 0.0334, 0.0616, -0.0931, -0.1336, 0.1372, -0.0892, 0.0332, 0.0420]),
        "order" => Some([-0.0287, 0.9175, 0.0081, 0.1544, -0.1050, 0.0768, -0.0928, -0.0370, 0.0610, -0.0710, -0.0653, 0.0894, -0.1518, -0.0148, 0.1770, 0.1762]),
        "delivery" => Some([-0.1667, 0.8644, -0.0917, 0.1692, 0.1488, 0.1481, -0.0510, -0.1337, 0.1304, 0.0795, 0.0436, 0.1903, 0.0601, -0.1922, 0.1239, -0.0784]),
        "dinner" => Some([0.0521, 0.9376, -0.1167, -0.1227, -0.1254, 0.0170, -0.0726, 0.0334, 0.0694, -0.0946, 0.0428, -0.0753, -0.0037, 0.1293, 0.1104, -0.1301]),
        "hungry" => Some([-0.0300, 0.8928, -0.1947, 0.1063, 0.0538, -0.0934, 0.0946, 0.0203, -0.0284, -0.1923, -0.1666, 0.1502, 0.1584, 0.0179, 0.1312, 0.0324]),
        "restaurant" => Some([-0.1427, 0.8627, -0.0778, 0.1618, 0.1201, 0.1463, 0.1618, -0.1176, -0.1016, -0.1611, 0.1136, 0.1558, -0.0380, 0.0489, -0.1401, 0.1743]),
        "eat" => Some([0.1120, 0.9139, 0.0954, 0.1171, -0.1459, 0.0726, -0.0515, 0.1323, 0.0928, 0.1118, 0.0954, -0.0716, 0.0882, -0.1203, 0.1143, 0.1101]),
        "pizza" => Some([-0.0914, 0.9274, -0.0131, -0.0641, 0.0972, -0.0897, -0.1568, -0.1010, -0.0565, 0.1200, 0.1537, -0.0727, 0.0466, -0.0330, 0.1584, 0.0119]),
        "light" => Some([0.1395, -0.1222, 0.9433, -0.1021, 0.1469, -0.0745, -0.1244, -0.0208, 0.0726, -0.0592, 0.0337, 0.0036, -0.0365, 0.0243, -0.0779, 0.0663]),
        "lights" => Some([-0.1813, 0.1548, 0.9234, 0.0798, 0.0880, 0.0621, -0.0494, -0.1564, 0.0597, -0.0618, -0.0677, 0.1266, 0.0799, -0.0726, -0.0694, -0.0333]),
        "turn" => Some([-0.0422, -0.0883, 0.9191, -0.0344, 0.1903, 0.0766, 0.1740, 0.0499, -0.0860, 0.0207, -0.2158, -0.0921, -0.0303, 0.0346, 0.0668, -0.0151]),
        "on" => Some([-0.0213, -0.1055, 0.9114, 0.1478, 0.1091, -0.1217, -0.1530, 0.0057, 0.0490, -0.0607, 0.1173, 0.0925, 0.0637, -0.1015, -0.1109, -0.1753]),
        "off" => Some([-0.0843, -0.0082, 0.9418, -0.1412, -0.0283, 0.0429, -0.1010, 0.0649, -0.0019, -0.0846, 0.0516, -0.1634, 0.0829, 0.0892, -0.1300, -0.0247]),
        "temperature" => Some([-0.1159, 0.1637, 0.9001, -0.1608, -0.0897, 0.1245, -0.0156, 0.1077, 0.0599, 0.1744, 0.0341, 0.1609, 0.1399, 0.0403, 0.0784, 0.0017]),
        "thermostat" => Some([0.1093, 0.0158, 0.9576, 0.0805, -0.0084, -0.0796, -0.0835, 0.0455, 0.0879, 0.0070, 0.0419, -0.0745, -0.1397, -0.0708, -0.0755, -0.0596]),
        "smart" => Some([0.0165, -0.1489, 0.9188, 0.0799, 0.0850, -0.1794, -0.0380, 0.0175, -0.0347, -0.1207, -0.0329, 0.1667, 0.0346, 0.0805, 0.1469, 0.1094]),
        "home" => Some([-0.0462, -0.1908, 0.9081, 0.0979, 0.1365, 0.1751, -0.0313, 0.0956, 0.0178, 0.0399, -0.1079, -0.1083, -0.0248, -0.1819, -0.0633, 0.0692]),
        "balance" => Some([-0.0404, -0.1414, -0.0138, 0.8982, 0.0516, -0.1997, -0.0447, 0.0272, -0.1996, 0.0603, -0.1538, -0.0162, -0.1898, -0.0510, -0.1217, -0.0731]),
        "subscription" => Some([0.0853, -0.0394, 0.0822, 0.9242, -0.0808, -0.1364, -0.1569, 0.0129, 0.1631, -0.0490, 0.0490, 0.0918, 0.0495, 0.0830, 0.1467, -0.0981]),
        "spend" => Some([-0.1613, -0.1169, -0.1257, 0.8979, 0.0215, -0.0949, 0.0671, 0.0898, -0.1117, 0.0361, 0.0834, -0.1296, 0.1074, 0.1563, -0.1318, -0.1595]),
        "money" => Some([-0.0703, 0.0663, 0.1714, 0.8966, 0.0804, -0.1586, 0.0713, 0.0476, -0.1489, 0.1019, 0.1310, 0.0376, -0.1418, 0.1810, 0.1057, -0.0572]),
        "cost" => Some([-0.0277, -0.0500, 0.0023, 0.9052, 0.1352, 0.1246, -0.1525, 0.1782, 0.0524, 0.1271, 0.0801, -0.0249, 0.0904, 0.1800, -0.0889, 0.1192]),
        "finance" => Some([0.0130, -0.0056, -0.0220, 0.9309, -0.0789, 0.1199, 0.1127, -0.1409, 0.1301, -0.0873, -0.0120, 0.0376, -0.0412, -0.1606, 0.1196, -0.1084]),
        "budget" => Some([-0.0936, 0.0969, -0.0519, 0.9367, 0.0654, -0.0728, -0.1593, 0.1457, -0.1348, 0.0716, -0.0037, 0.0840, 0.0620, 0.0474, -0.0030, 0.0953]),
        "expensive" => Some([-0.1629, -0.1115, 0.0768, 0.9232, 0.0326, -0.0107, 0.0124, -0.0298, 0.0985, -0.0677, 0.0812, -0.0917, -0.0995, -0.1519, -0.1231, -0.1523]),
        "heart" => Some([0.0131, 0.0960, -0.1152, -0.1038, 0.9093, 0.0822, 0.1744, 0.0090, -0.0794, -0.1462, -0.1120, -0.0997, -0.1173, -0.1778, 0.0125, -0.0826]),
        "rate" => Some([0.1548, 0.0174, 0.0644, -0.1219, 0.9359, -0.0030, 0.1216, 0.0242, -0.0100, -0.0194, -0.1030, -0.1464, 0.1439, -0.0073, 0.1051, -0.0324]),
        "pulse" => Some([-0.1516, 0.0461, -0.1589, -0.1249, 0.9122, -0.0698, 0.1758, -0.1358, 0.0941, 0.0378, 0.1035, -0.0976, 0.0080, -0.0176, -0.0204, 0.1282]),
        "health" => Some([0.1641, -0.0652, 0.0405, 0.0367, 0.9177, 0.1499, -0.0979, -0.0968, 0.0537, -0.1149, -0.1092, -0.1423, -0.1666, -0.0166, 0.0314, -0.0699]),
        "bpm" => Some([-0.0929, 0.0716, 0.0702, -0.0159, 0.9295, 0.1466, 0.0996, 0.0433, 0.0557, 0.1500, -0.0259, 0.0154, 0.0511, 0.1413, 0.1130, -0.1482]),
        "sleep" => Some([-0.1326, -0.0763, 0.0988, 0.0275, 0.9081, -0.1490, 0.0749, 0.0792, 0.1756, 0.0002, -0.0025, -0.1665, -0.1826, -0.0270, -0.0705, -0.0990]),
        "workout" => Some([-0.1283, 0.1451, 0.1055, 0.0236, 0.9267, 0.1569, 0.0541, -0.0724, -0.1444, 0.0805, -0.0093, 0.0476, 0.1307, -0.1000, 0.0268, 0.0423]),
        "fitness" => Some([-0.0029, -0.1430, -0.0532, -0.0583, 0.9339, 0.1251, -0.0595, 0.0677, -0.0741, 0.1557, 0.1097, 0.0175, -0.0158, -0.0649, -0.0618, 0.1644]),
        "birthday" => Some([-0.0371, 0.0056, 0.1889, 0.0610, 0.0165, 0.9337, -0.1209, -0.0535, 0.0992, 0.0485, 0.1006, -0.1147, 0.0190, 0.1655, -0.0239, 0.0767]),
        "congrats" => Some([-0.1342, 0.1677, 0.0386, -0.0924, -0.1211, 0.9043, 0.0185, -0.1442, 0.1745, 0.1464, -0.0137, -0.1356, 0.1177, -0.0006, 0.0768, 0.0031]),
        "wedding" => Some([-0.0854, 0.1262, 0.1811, -0.0966, 0.0193, 0.8989, 0.1591, 0.0031, 0.1431, 0.1373, -0.0844, 0.1094, -0.0321, 0.1638, 0.0029, 0.1209]),
        "message" => Some([-0.0949, -0.0880, 0.0380, 0.2180, -0.0045, 0.9389, 0.0169, -0.0677, 0.0227, 0.0190, -0.0195, -0.0779, -0.1361, 0.0863, 0.0314, -0.1164]),
        "social" => Some([0.1038, -0.1720, 0.0922, 0.0773, 0.1174, 0.8993, 0.0617, 0.1209, 0.1812, -0.0018, -0.1745, 0.0009, 0.0340, 0.1393, 0.1410, -0.0225]),
        "greetings" => Some([0.0111, -0.0184, 0.0952, -0.0385, 0.0663, 0.9222, -0.0131, 0.2009, -0.0691, 0.0825, 0.0641, 0.1506, 0.1508, 0.1538, -0.0514, -0.0785]),
        "celebrate" => Some([0.0746, 0.0885, 0.1271, -0.1584, -0.1473, 0.8977, 0.1436, 0.1697, 0.0842, -0.0225, -0.1370, 0.0456, 0.1271, -0.0192, 0.0662, 0.1376]),
        _ => None,
    }
}

impl VoiceProcessor {
    pub fn new() -> Self {
        Self::default()
    }

    // WHY: Processes natural language text inputs and classifies them into structured twin actions
    // using an on-device Semantic Vector Embedding space (cosine similarity).
    pub fn process_command(&mut self, text: &str) -> Result<VoiceResult, ArchonError> {
        let text_lower = text.to_lowercase();

        // 1. Check if we are currently awaiting a clarification parameter from previous turn
        if let Some(param) = &self.awaiting_parameter {
            let p_name = param.clone();
            self.stored_params.insert(p_name, serde_json::json!(text.to_string()));
            self.awaiting_parameter = None;

            let domain = self.current_domain.take().unwrap_or_default();
            let action = self.current_action.take().unwrap_or_default();
            let params = serde_json::Value::Object(self.stored_params.clone());
            self.stored_params.clear();

            return Ok(VoiceResult {
                intent_detected: true,
                clarification_needed: false,
                message: format!("Confirmed. Initiating {} {} workflow.", domain, action.replace("_", " ")),
                intent: Some(serde_json::json!({
                    "domain": domain,
                    "action": action,
                    "parameters": params
                })),
            });
        }

        // 2. Semantic Embedding NLU (Tokenization + Average Pooling)
        let mut sentence_vec = [0.0f32; 16];
        let mut words_found = 0;
        
        let words: Vec<&str> = text_lower.split_whitespace().collect();
        for word in &words {
            // Strip punctuation for clean lookup
            let clean_word: String = word.chars().filter(|c| c.is_alphanumeric()).collect();
            if let Some(vec) = get_word_embedding(&clean_word) {
                for i in 0..16 {
                    sentence_vec[i] += vec[i];
                }
                words_found += 1;
            }
        }
        
        // If no semantic match, fallback or clarify
        if words_found == 0 {
            return Ok(VoiceResult {
                intent_detected: false,
                clarification_needed: false,
                message: "I couldn't derive the semantic meaning of that. Could you clarify?".to_string(),
                intent: None,
            });
        }
        
        // Average pooling
        for i in 0..16 {
            sentence_vec[i] /= words_found as f32;
        }
        
        // 3. Cosine Similarity Classification
        let mut best_intent = "";
        let mut best_score = -1.0;
        
        for (intent_name, centroid) in INTENT_CENTROIDS.iter() {
            let mut dot = 0.0;
            let mut mag_a = 0.0;
            let mut mag_b = 0.0;
            for i in 0..16 {
                dot += sentence_vec[i] * centroid[i];
                mag_a += sentence_vec[i] * sentence_vec[i];
                mag_b += centroid[i] * centroid[i];
            }
            
            let score = if mag_a > 0.0 && mag_b > 0.0 {
                dot / (mag_a.sqrt() * mag_b.sqrt())
            } else {
                0.0
            };
            
            if score > best_score {
                best_score = score;
                best_intent = intent_name;
            }
        }
        
        // Confidence Threshold
        if best_score < 0.65 {
            return Ok(VoiceResult {
                intent_detected: false,
                clarification_needed: false,
                message: "I'm not confident about what you want to do. Could you clarify?".to_string(),
                intent: None,
            });
        }

        // 4. Parameter Extraction (NER) based on the classified semantic intent
        match best_intent {
            "travel" => {
                let destinations = vec!["new york", "london", "paris", "tokyo", "chicago", "san francisco", "berlin"];
                let mut found_dest = None;
                for dest in destinations {
                    if text_lower.contains(dest) {
                        found_dest = Some(dest.to_string());
                        break;
                    }
                }

                if let Some(dest) = found_dest {
                    return Ok(VoiceResult {
                        intent_detected: true,
                        clarification_needed: false,
                        message: format!("Scheduling flight search to {}.", dest),
                        intent: Some(serde_json::json!({
                            "domain": "travel",
                            "action": "search_flights",
                            "parameters": {
                                "destination": dest,
                                "departure_date": "2026-06-12"
                            }
                        })),
                    });
                } else {
                    self.awaiting_parameter = Some("destination".to_string());
                    self.current_domain = Some("travel".to_string());
                    self.current_action = Some("search_flights".to_string());
                    return Ok(VoiceResult {
                        intent_detected: false,
                        clarification_needed: true,
                        message: "What is your flight destination?".to_string(),
                        intent: None,
                    });
                }
            },
            "food" => {
                self.awaiting_parameter = Some("restaurant".to_string());
                self.current_domain = Some("social".to_string());
                self.current_action = Some("order_dinner".to_string());
                return Ok(VoiceResult {
                    intent_detected: false,
                    clarification_needed: true,
                    message: "Which restaurant would you like to order food from?".to_string(),
                    intent: None,
                });
            },
            "home" => {
                return Ok(VoiceResult {
                    intent_detected: true,
                    clarification_needed: false,
                    message: "Updating smart home configurations.".to_string(),
                    intent: Some(serde_json::json!({
                        "domain": "home",
                        "action": "toggle_device",
                        "parameters": {
                            "device": if text_lower.contains("light") { "light" } else { "thermostat" },
                            "state": if text_lower.contains("off") { "off" } else { "on" }
                        }
                    })),
                });
            },
            "finance" => {
                return Ok(VoiceResult {
                    intent_detected: true,
                    clarification_needed: false,
                    message: "Retrieving active subscription cost ledgers.".to_string(),
                    intent: Some(serde_json::json!({
                        "domain": "finance",
                        "action": "detect_subscriptions",
                        "parameters": {}
                    })),
                });
            },
            "health" => {
                return Ok(VoiceResult {
                    intent_detected: true,
                    clarification_needed: false,
                    message: "Auditing biometrics heart rate log history.".to_string(),
                    intent: Some(serde_json::json!({
                        "domain": "health",
                        "action": "detect_anomaly",
                        "parameters": {}
                    })),
                });
            },
            "social" => {
                return Ok(VoiceResult {
                    intent_detected: true,
                    clarification_needed: false,
                    message: "Analyzing message history logs for social milestones.".to_string(),
                    intent: Some(serde_json::json!({
                        "domain": "social",
                        "action": "extract_life_events",
                        "parameters": {}
                    })),
                });
            },
            _ => {
                return Ok(VoiceResult {
                    intent_detected: false,
                    clarification_needed: false,
                    message: "Unknown intent.".to_string(),
                    intent: None,
                });
            }
        }
    }
}
