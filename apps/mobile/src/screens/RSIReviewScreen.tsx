import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useAtom } from "jotai";
import { ArchonBridge } from "../services/ArchonBridge";
import { deploymentJournalAtom, intentsAtom } from "../store";

export default function RSIReviewScreen() {
  const [journal, setJournal] = useAtom(deploymentJournalAtom);
  const [, setIntents] = useAtom(intentsAtom);
  const [loading, setLoading] = useState(false);

  const triggerMockRSI = async () => {
    setLoading(true);
    try {
      const mockFailures = [
        {
          error_msg: "tool 'email.read' is deprecated, use 'email.search'",
          timestamp: Date.now(),
        },
      ];

      // Simulate running coordinator. We pass empty wasm_bytes so it doesn't fail compilation
      const resStr = await ArchonBridge.rsiRun(JSON.stringify(mockFailures), []);
      const records = JSON.parse(resStr);

      setJournal((prev) => [...prev, ...records]);
      Alert.alert("RSI Coordinator Run", `Successfully processed failure logs. Generated ${records.length} deployment records.`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to trigger self-evolution");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deltaId: string) => {
    setJournal((prev) =>
      prev.map((rec) =>
        rec.delta_id === deltaId ? { ...rec, status: "Applied" } : rec
      )
    );
    Alert.alert("Delta Approved", "Applied repairs to the active twin workflow graph.");
  };

  const handleReject = (deltaId: string) => {
    setJournal((prev) =>
      prev.map((rec) =>
        rec.delta_id === deltaId ? { ...rec, status: "Rejected" } : rec
      )
    );
    Alert.alert("Delta Rejected", "Proposed updates discarded. Flagged as bad patch.");
  };

  const clearJournal = () => {
    setJournal([]);
  };

  const pendingDeltas = journal.filter((rec) => rec.status === "FlaggedForHumanReview");
  const processedDeltas = journal.filter((rec) => rec.status !== "FlaggedForHumanReview");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Self-Evolution Cockpit</Text>
        <Text style={styles.subtitle}>Statistical Manual Oversight on Graph Repair Patches</Text>
      </View>

      <TouchableOpacity style={styles.simulateBtn} onPress={triggerMockRSI} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.simulateBtnText}>⚙️ Simulate Failure Audit</Text>
        )}
      </TouchableOpacity>

      {/* Flagged Review Queue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Oversight Queue</Text>
        {pendingDeltas.length === 0 ? (
          <Text style={styles.emptyText}>All proposed self-heals deployed automatically. No items flagged.</Text>
        ) : (
          pendingDeltas.map((item) => (
            <View key={item.delta_id} style={styles.reviewCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.riskBadge}>Risk Score: {(item.risk_score * 100).toFixed(0)}%</Text>
                <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              </View>
              <Text style={styles.reasonText}>{item.reason}</Text>
              <Text style={styles.deltaId}>Delta ID: {item.delta_id}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(item.delta_id)}
                >
                  <Text style={styles.btnText}>Approve & Deploy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleReject(item.delta_id)}
                >
                  <Text style={styles.btnText}>Reject Patch</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* History Journal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deployment Journal History</Text>
        {processedDeltas.length === 0 ? (
          <Text style={styles.emptyText}>No historical records in session journal.</Text>
        ) : (
          processedDeltas.map((item) => (
            <View key={item.delta_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.statusText,
                    item.status === "Applied" ? styles.greenText : styles.redText,
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
                <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              </View>
              <Text style={styles.reasonText}>{item.reason}</Text>
              <Text style={styles.deltaId}>Delta ID: {item.delta_id}</Text>
            </View>
          ))
        )}
      </View>

      {journal.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearJournal}>
          <Text style={styles.clearBtnText}>Wipe Session Journal</Text>
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
  simulateBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  simulateBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
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
  reviewCard: {
    backgroundColor: "#1e1b4b",
    borderWidth: 1,
    borderColor: "#4338ca",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  riskBadge: {
    color: "#fbbf24",
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timestamp: {
    color: "#9ca3af",
    fontSize: 11,
  },
  reasonText: {
    color: "#f3f4f6",
    fontSize: 13,
    lineHeight: 18,
  },
  deltaId: {
    color: "#9ca3af",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  greenText: {
    color: "#10b981",
  },
  redText: {
    color: "#ef4444",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  approveBtn: {
    backgroundColor: "#10b981",
  },
  rejectBtn: {
    backgroundColor: "#ef4444",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
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
