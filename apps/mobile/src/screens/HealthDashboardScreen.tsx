import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAtom } from "jotai";
import { healthMetricsAtom } from "../store";
import { ArchonBridge } from "../services/ArchonBridge";

export function HealthDashboardScreen() {
  const [loading, setLoading] = useState<boolean>(false);
  const [healthState, setHealthState] = useAtom(healthMetricsAtom);
  const [showSpike, setShowSpike] = useState<boolean>(false);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      // Simulate reading from gateway's health simulator
      // If showSpike is true, simulate an anomaly (HR = 125 bpm)
      const mockHR = showSpike 
        ? [72.0, 75.0, 71.0, 125.0, 73.0]
        : [70.0, 72.0, 73.0, 71.0, 74.0];

      const resStr = await ArchonBridge.processDomainIntent(
        "health",
        "detect_anomaly",
        JSON.stringify({ heart_rates: mockHR })
      );
      
      const parsed = JSON.parse(resStr);
      setHealthState({
        heartRates: mockHR,
        averageRate: parsed.average,
        anomalyDetected: parsed.anomaly_detected,
        message: parsed.message
      });
    } catch (err: any) {
      Alert.alert("Analysis Error", err.message || "Failed to analyze biosensors logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, [showSpike]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Biometric Health Center</Text>

      {/* Simulator controller */}
      <View style={styles.controller}>
        <Text style={styles.controllerHeader}>Simulator Configuration</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity 
            style={[styles.simBtn, !showSpike && styles.simBtnActive]} 
            onPress={() => setShowSpike(false)}
          >
            <Text style={styles.simBtnText}>Normal Rhythm</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.simBtn, showSpike && styles.simBtnActive, showSpike && { borderColor: "#ef4444" }]} 
            onPress={() => setShowSpike(true)}
          >
            <Text style={[styles.simBtnText, showSpike && { color: "#f87171" }]}>Simulate Heart Spike</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#60a5fa" style={styles.spinner} />
      ) : (
        <>
          {/* Status Banner */}
          <View style={[
            styles.bannerCard,
            healthState?.anomalyDetected ? styles.bannerAnomaly : styles.bannerNormal
          ]}>
            <Text style={styles.bannerHeader}>
              {healthState?.anomalyDetected ? "⚠️ HEALTH ANOMALY DETECTED" : "✅ BIOSENSORS SECURE"}
            </Text>
            <Text style={styles.bannerMessage}>{healthState?.message}</Text>
          </View>

          {/* Core Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Average Heart Rate</Text>
              <Text style={styles.metricVal}>{healthState?.averageRate.toFixed(1)} <Text style={styles.unit}>BPM</Text></Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Data Samples</Text>
              <Text style={styles.metricVal}>{healthState?.heartRates?.length || 0} <Text style={styles.unit}>Logs</Text></Text>
            </View>
          </View>

          {/* Readings History */}
          <Text style={styles.sectionTitle}>Recent Readings Trace</Text>
          <View style={styles.traceCard}>
            {healthState?.heartRates?.map((rate, idx) => {
              const isAnomaly = rate > 120.0 || rate > healthState.averageRate * 1.2;
              return (
                <View key={idx} style={styles.traceLine}>
                  <Text style={styles.traceTime}>Sample #{idx + 1}</Text>
                  <Text style={[styles.traceVal, isAnomaly && { color: "#f87171", fontWeight: "bold" }]}>
                    {rate.toFixed(1)} BPM {isAnomaly && "(Spike)"}
                  </Text>
                </View>
              );
            })}
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
  controller: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 20
  },
  controllerHeader: {
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
  bannerCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20
  },
  bannerNormal: {
    backgroundColor: "#064e3b",
    borderColor: "#059669"
  },
  bannerAnomaly: {
    backgroundColor: "#7f1d1d",
    borderColor: "#dc2626"
  },
  bannerHeader: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6
  },
  bannerMessage: {
    color: "#e5e7eb",
    fontSize: 13,
    lineHeight: 18
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginHorizontal: 4
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6
  },
  metricVal: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold"
  },
  unit: {
    fontSize: 12,
    color: "#9ca3af"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10
  },
  traceCard: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 30
  },
  traceLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937"
  },
  traceTime: {
    color: "#9ca3af",
    fontSize: 13
  },
  traceVal: {
    color: "#ffffff",
    fontSize: 13
  }
});
