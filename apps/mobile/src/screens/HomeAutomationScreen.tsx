import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ArchonBridge } from "../services/ArchonBridge";

export function HomeAutomationScreen() {
  const [loading, setLoading] = useState<boolean>(false);
  const [preferenceState, setPreferenceState] = useState<any>(null);
  const [useSufficientData, setUseSufficientData] = useState<boolean>(true);
  const [thermostatOn, setThermostatOn] = useState<boolean>(true);
  const [livingRoomLight, setLivingRoomLight] = useState<boolean>(false);

  const analyzeAdjustments = async () => {
    setLoading(true);
    try {
      // Setup mock data for sufficient adjustments (72.0 is repeated 3 times)
      // and insufficient adjustments (varying temps)
      const adjustments = useSufficientData
        ? [
            { temp: 72.0, time: "10:00" },
            { temp: 72.0, time: "12:00" },
            { temp: 68.0, time: "14:00" },
            { temp: 72.0, time: "16:00" }
          ]
        : [
            { temp: 72.0, time: "10:00" },
            { temp: 68.0, time: "12:00" }
          ];

      const resStr = await ArchonBridge.processDomainIntent(
        "home",
        "learn_preference",
        JSON.stringify({ temperature_adjustments: adjustments })
      );

      const parsed = JSON.parse(resStr);
      setPreferenceState(parsed);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to analyze thermostat adjustments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeAdjustments();
  }, [useSufficientData]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Home Intelligence Center</Text>

      {/* Configuration toggle */}
      <View style={styles.simCard}>
        <Text style={styles.simHeader}>Thermostat Log State</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.simBtn, useSufficientData && styles.simBtnActive]}
            onPress={() => setUseSufficientData(true)}
          >
            <Text style={styles.simBtnText}>Sufficient Logs (Pattern)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.simBtn, !useSufficientData && styles.simBtnActive]}
            onPress={() => setUseSufficientData(false)}
          >
            <Text style={styles.simBtnText}>Insufficient Logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#60a5fa" style={styles.spinner} />
      ) : (
        <>
          {/* Machine Learning Insights */}
          <Text style={styles.sectionTitle}>Smart Schedule Automation</Text>
          <View style={[styles.learnCard, preferenceState?.preference_detected && styles.learnCardSuccess]}>
            <Text style={styles.learnHeader}>
              {preferenceState?.preference_detected 
                ? "💡 Learned Automation Rule" 
                : "⏳ Analytics Gathering"}
            </Text>
            <Text style={styles.learnMessage}>{preferenceState?.message}</Text>
            
            {preferenceState?.preference_detected && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Learned Setpoint:</Text>
                <Text style={styles.metricVal}>{preferenceState?.learned_temp.toFixed(1)}°F</Text>
              </View>
            )}
          </View>

          {/* Quick Smart Actions */}
          <Text style={styles.sectionTitle}>Device Controls</Text>
          <View style={styles.deviceList}>
            <View style={styles.deviceRow}>
              <View>
                <Text style={styles.deviceName}>Smart Thermostat</Text>
                <Text style={styles.deviceStatus}>{thermostatOn ? "Status: ACTIVE" : "Status: IDLE"}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggleBtn, thermostatOn ? styles.toggleOn : styles.toggleOff]}
                onPress={() => setThermostatOn(!thermostatOn)}
              >
                <Text style={styles.toggleBtnText}>{thermostatOn ? "ON" : "OFF"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.deviceRow}>
              <View>
                <Text style={styles.deviceName}>Living Room Light</Text>
                <Text style={styles.deviceStatus}>{livingRoomLight ? "Status: ENABLED" : "Status: DISABLED"}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggleBtn, livingRoomLight ? styles.toggleOn : styles.toggleOff]}
                onPress={() => setLivingRoomLight(!livingRoomLight)}
              >
                <Text style={styles.toggleBtnText}>{livingRoomLight ? "ON" : "OFF"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0b0f19"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20
  },
  simCard: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 20
  },
  simHeader: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  simBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    marginHorizontal: 4
  },
  simBtnActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#3b82f6"
  },
  simBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 11
  },
  spinner: {
    marginTop: 40
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 15,
    marginBottom: 10
  },
  learnCard: {
    backgroundColor: "#1f2937",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 20
  },
  learnCardSuccess: {
    backgroundColor: "#064e3b",
    borderColor: "#059669"
  },
  learnHeader: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 8
  },
  learnMessage: {
    color: "#d1d5db",
    fontSize: 13,
    lineHeight: 18
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)"
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8
  },
  metricVal: {
    color: "#60a5fa",
    fontSize: 18,
    fontWeight: "bold"
  },
  deviceList: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 15,
    marginBottom: 30
  },
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937"
  },
  deviceName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold"
  },
  deviceStatus: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 4
  },
  toggleBtn: {
    width: 60,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center"
  },
  toggleOn: {
    backgroundColor: "#10b981"
  },
  toggleOff: {
    backgroundColor: "#374151"
  },
  toggleBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12
  }
});
