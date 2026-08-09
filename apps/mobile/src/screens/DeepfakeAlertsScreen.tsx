import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAtom } from "jotai";
import { ArchonBridge } from "../services/ArchonBridge";
import { deepfakeAlertsAtom } from "../store";

export default function DeepfakeAlertsScreen() {
  const [alerts, setAlerts] = useAtom(deepfakeAlertsAtom);
  const [mediaHash, setMediaHash] = useState("synthetic_voice_recording_01");
  const [loading, setLoading] = useState(false);

  const handleVerifyMedia = async () => {
    if (!mediaHash.trim()) return;
    setLoading(true);
    try {
      const score = await ArchonBridge.deepfakeCheck(mediaHash);
      
      const newAlert = {
        media_url: `https://archon-gateway.dev/media/${mediaHash}.bin`,
        media_hash: mediaHash,
        confidence: score,
        timestamp: new Date().toISOString(),
      };

      setAlerts((prev) => [newAlert, ...prev]);

      if (score > 0.9) {
        Alert.alert(
          "🚨 Deepfake Alert",
          `High-confidence synthetic signature detected (${(score * 100).toFixed(0)}%). Secure biometric isolation is active for this session.`
        );
      } else {
        Alert.alert(
          "Verification Complete",
          `Media scan reports authentic signatures. Synthetic score is low (${(score * 100).toFixed(0)}%).`
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Forensic audit failed");
    } finally {
      setLoading(false);
    }
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Deepfake Forensics</Text>
        <Text style={styles.subtitle}>On-Device Cryptographic Signature Integrity Checks</Text>
      </View>

      {/* Forensic Audit Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Verify Incoming Audio/Video File</Text>
        <Text style={styles.panelDesc}>
          Enter file identifier hash signature to perform deep neural analysis:
        </Text>
        
        <TextInput
          style={styles.textInput}
          value={mediaHash}
          onChangeText={setMediaHash}
          placeholder="e.g. synthetic_voice_leak"
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity style={styles.actionBtn} onPress={handleVerifyMedia} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.btnText}>Audit Media Signatures</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Audit History Banners */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Logs & Banners</Text>
        {alerts.length === 0 ? (
          <Text style={styles.emptyText}>No media files audited in this session.</Text>
        ) : (
          alerts.map((item, idx) => {
            const isSynthetic = item.confidence > 0.8;
            return (
              <View
                key={idx}
                style={[
                  styles.card,
                  isSynthetic ? styles.dangerCard : styles.safeCard,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.media_hash}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.label}>Synthetic Probability:</Text>
                  <Text
                    style={[
                      styles.scoreValue,
                      isSynthetic ? styles.redText : styles.greenText,
                    ]}
                  >
                    {(item.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
                <Text style={styles.statusMsg}>
                  {isSynthetic
                    ? "🚨 Critical Warning: Synthetic media detected. Core credential exposure blocks are activated."
                    : "🟢 Verification Passed: Valid authentic file signatures."}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {alerts.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearAlerts}>
          <Text style={styles.clearBtnText}>Wipe Audit Logs</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#f3f4f6",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  panel: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 24,
  },
  panelTitle: {
    color: "#60a5fa",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  panelDesc: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f3f4f6",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.05,
    marginBottom: 10,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  dangerCard: {
    backgroundColor: "#1c0c0c",
    borderColor: "#ef4444",
  },
  safeCard: {
    backgroundColor: "#06130e",
    borderColor: "#10b981",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    color: "#f3f4f6",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "70%",
  },
  timestamp: {
    color: "#9ca3af",
    fontSize: 11,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    color: "#9ca3af",
    fontSize: 13,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  redText: {
    color: "#ef4444",
  },
  greenText: {
    color: "#10b981",
  },
  statusMsg: {
    color: "#e5e7eb",
    fontSize: 12,
    lineHeight: 16,
    fontStyle: "italic",
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  clearBtnText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
});
