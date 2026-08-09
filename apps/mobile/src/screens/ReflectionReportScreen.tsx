import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAtom } from "jotai";
import { ArchonBridge } from "../services/ArchonBridge";
import { reflectionReportAtom } from "../store";

export default function ReflectionReportScreen() {
  const [report, setReport] = useAtom(reflectionReportAtom);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const reportStr = await ArchonBridge.triggerReflection();
      const parsed = JSON.parse(reportStr);
      setReport({
        actions_count: parsed.actions_count,
        time_saved_minutes: parsed.time_saved_minutes,
        money_saved_dollars: parsed.money_saved_dollars,
        self_healing_count: parsed.self_healing_count,
        total_finops_cost_cents: parsed.total_finops_cost_cents,
        health_score: parsed.health_score,
        message: parsed.message,
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to compile reflection report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Self-Reflection</Text>
        <Text style={styles.subtitle}>Autonomous Core Diagnostics & Value Metrics</Text>
      </View>

      <TouchableOpacity
        style={styles.generateBtn}
        onPress={handleGenerateReport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.generateBtnText}>🔄 Compile Weekly Report</Text>
        )}
      </TouchableOpacity>

      {report ? (
        <View style={styles.reportCard}>
          <Text style={styles.cardHeader}>📊 Reflection Report Metrics</Text>
          
          <Text style={styles.summaryMessage}>{report.message}</Text>

          <View style={styles.divider} />

          <View style={styles.metricGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Twin Actions</Text>
              <Text style={styles.metricValue}>{report.actions_count}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Time Saved</Text>
              <Text style={styles.metricValue}>{report.time_saved_minutes} min</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Money Recovered</Text>
              <Text style={[styles.metricValue, styles.greenText]}>
                ${report.money_saved_dollars.toFixed(2)}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Self-Healing Repairs</Text>
              <Text style={[styles.metricValue, styles.blueText]}>
                {report.self_healing_count}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>FinOps Enclave Cost</Text>
              <Text style={styles.metricValue}>
                ${(report.total_finops_cost_cents / 100).toFixed(2)}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Core Integrity Score</Text>
              <Text style={[styles.metricValue, styles.healthText]}>
                {report.health_score}%
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No report compiled yet. Tap above to trigger the Archon reflection engine.
          </Text>
        </View>
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
  generateBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  generateBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  reportCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
  },
  cardHeader: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.05,
    marginBottom: 12,
  },
  summaryMessage: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#1f2937",
    marginBottom: 16,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    width: "47%",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  greenText: {
    color: "#10b981",
  },
  blueText: {
    color: "#3b82f6",
  },
  healthText: {
    color: "#8b5cf6",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
});
