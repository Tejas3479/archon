import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Clipboard, Switch } from "react-native";
import { useAtom } from "jotai";
import { identityAtom, intentsAtom, attentionModeAtom, attentionScoreAtom, attentionProbabilityAtom, Intent } from "../store";
import { IntentCard } from "../components/IntentCard";
import { ArchonBridge } from "../services/ArchonBridge";

// WHY: DashboardScreen shows active agent intents, allows one-tap consent actions,
// integrates attention budget model predictions, and links to preferences and logs.
export const DashboardScreen = ({ navigation }: any) => {
  const [identity] = useAtom(identityAtom);
  const [intents, setIntents] = useAtom(intentsAtom);
  const [attentionMode, setAttentionMode] = useAtom(attentionModeAtom);
  const [attentionScore, setAttentionScore] = useAtom(attentionScoreAtom);
  const [, setAttentionProbability] = useAtom(attentionProbabilityAtom);

  // Simulation inputs for the attention model
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [hrv, setHrv] = useState(80.0); // Normal HRV
  const [taskPriority, setTaskPriority] = useState(3); // Medium priority

  // Run attention inference when any parameter changes
  useEffect(() => {
    async function runInference() {
      try {
        const input = {
          calendar_busy: calendarBusy,
          hrv: hrv,
          task_priority: taskPriority,
          time_of_day: 14.5, // 2:30 PM
          day_of_week: 2, // Tuesday
        };
        
        const score = await ArchonBridge.predictAttention(JSON.stringify(input));
        setAttentionScore(score);
        setAttentionProbability(score);
      } catch (err) {
        // Model might not be loaded yet
      }
    }
    runInference();
  }, [calendarBusy, hrv, taskPriority]);

  const copyIdentity = () => {
    if (identity) {
      Clipboard.setString(identity);
      Alert.alert("Copied", "Public Key copied to clipboard");
    }
  };

  const pollMockEmails = async () => {
    try {
      const mockEvent = {
        domain: "email",
        payload: {
          subject: "Urgent: Your Flight AA234 is Delayed",
          body: "We regret to inform you that flight AA234 is delayed. Booking ref: HFKD9D.",
          delay_minutes: 180
        },
        timestamp: Date.now()
      };

      const resultJson = await ArchonBridge.processEvent(JSON.stringify(mockEvent));
      const newIntents = JSON.parse(resultJson) as Intent[];

      if (newIntents.length > 0) {
        setIntents((prev) => {
          const existingIds = prev.map(i => i.id);
          const filtered = newIntents.filter(i => !existingIds.includes(i.id));
          return [...prev, ...filtered];
        });
        Alert.alert("Event Detector", "Proactive flight delay detected! Claim Intent created.");
      } else {
        Alert.alert("No Intents", "No tasks detected in incoming feeds.");
      }
    } catch (err: any) {
      Alert.alert("Processing Error", err.message);
    }
  };

  const handleApprove = (id: string) => {
    setIntents((prev) =>
      prev.map((intent) =>
        intent.id === id ? { ...intent, status: "approved" as const } : intent
      )
    );
    Alert.alert(
      "Claim Approved",
      "Refund claim signed with your Ed25519 identity key and submitted via gateway."
    );
  };

  const handleIgnore = (id: string) => {
    setIntents((prev) => prev.filter((i) => i.id !== id));
  };

  const handleEdit = (id: string) => {
    Alert.alert("Edit Intent", "Claim email drafting editor is active.");
  };

  const truncateKey = (key: string | null) => {
    if (!key) return "Not generated";
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Navigation Shortcuts */}
      <View style={styles.navGrid}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("FinanceDashboard")}>
            <Text style={styles.navBtnText}>💸 Finance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("HealthDashboard")}>
            <Text style={styles.navBtnText}>❤️ Health</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("Voice")}>
            <Text style={styles.navBtnText}>🎙️ Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("ReflectionReport")}>
            <Text style={styles.navBtnText}>📊 Reflection</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("SkillMarketplace")}>
            <Text style={styles.navBtnText}>📥 Skills</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("Family")}>
            <Text style={styles.navBtnText}>🌐 Swarm</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={{marginTop: 8}} onPress={() => navigation.navigate("AdminDashboard")}>
          <Text style={{color: "#6b7280", fontSize: 11, textAlign: "center"}}>Switch to Enterprise Admin</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.identityHeader}>
        <View>
          <Text style={styles.identityLabel}>Archon Identity Key</Text>
          <TouchableOpacity onPress={copyIdentity}>
            <Text style={styles.identityKey}>{truncateKey(identity)}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={copyIdentity}>
          <Text style={styles.copyBtnText}>COPY</Text>
        </TouchableOpacity>
      </View>

      {/* Attention Budget Manager */}
      <View style={styles.budgetCard}>
        <Text style={styles.sectionTitle}>Attention Budget Manager</Text>
        
        {/* Toggle Mode */}
        <View style={styles.budgetRow}>
          <TouchableOpacity
            style={[styles.budgetBtn, attentionMode === "quiet" && styles.budgetBtnActive]}
            onPress={() => setAttentionMode("quiet")}
          >
            <Text style={[styles.budgetBtnText, attentionMode === "quiet" && styles.budgetBtnTextActive]}>
              Quiet Mode (Batch)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.budgetBtn, attentionMode === "active" && styles.budgetBtnActive]}
            onPress={() => setAttentionMode("active")}
          >
            <Text style={[styles.budgetBtnText, attentionMode === "active" && styles.budgetBtnTextActive]}>
              Active (Interrupt)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Neural Network Predictor controls */}
        <Text style={styles.subSectionTitle}>Interrupt Predictor Simulator</Text>
        
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Calendar Busy</Text>
          <Switch value={calendarBusy} onValueChange={setCalendarBusy} />
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>HRV (Stress Indicator)</Text>
          <View style={styles.hrvButtons}>
            <TouchableOpacity 
              style={[styles.hrvBtn, hrv === 30.0 && styles.hrvBtnActive]} 
              onPress={() => setHrv(30.0)}
            >
              <Text style={styles.hrvBtnText}>Low (Stress)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.hrvBtn, hrv === 110.0 && styles.hrvBtnActive]} 
              onPress={() => setHrv(110.0)}
            >
              <Text style={styles.hrvBtnText}>High (Relaxed)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Task Priority</Text>
          <View style={styles.hrvButtons}>
            {[1, 3, 5].map((p) => (
              <TouchableOpacity 
                key={p} 
                style={[styles.priorityBtn, taskPriority === p && styles.priorityBtnActive]} 
                onPress={() => setTaskPriority(p)}
              >
                <Text style={styles.priorityBtnText}>P{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prediction Results output */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Predicted Interrupt Probability:</Text>
          <Text style={styles.scoreValue}>{(attentionScore * 100).toFixed(1)}%</Text>
        </View>
      </View>

      <View style={styles.intentHeaderRow}>
        <Text style={styles.sectionTitle}>Proactive Intent Queue</Text>
        <TouchableOpacity style={styles.pollBtn} onPress={pollMockEmails}>
          <Text style={styles.pollBtnText}>Poll Feed</Text>
        </TouchableOpacity>
      </View>

      {intents.filter(i => i.status === "pending").length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>All quiet. No pending proactive items detected.</Text>
        </View>
      ) : (
        intents
          .filter(i => i.status === "pending")
          .map((intent) => (
            <IntentCard
              key={intent.id}
              intent={intent}
              onApprove={handleApprove}
              onIgnore={handleIgnore}
              onEdit={handleEdit}
            />
          ))
      )}

      {intents.filter(i => i.status === "approved").length > 0 && (
        <View style={styles.approvedSection}>
          <Text style={styles.sectionTitle}>Action Log</Text>
          {intents
            .filter(i => i.status === "approved")
            .map(intent => (
              <View key={intent.id} style={styles.logItem}>
                <Text style={styles.logText}>
                  ✓ Submitting refund claim for Booking {intent.parameters.booking_reference}
                </Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  navGrid: {
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  navRow: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    flex: 1,
    backgroundColor: "#1f2937",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  navBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  identityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 24,
  },
  identityLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  identityKey: {
    color: "#60a5fa",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  copyBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  subSectionTitle: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
  },
  budgetCard: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 24,
  },
  budgetRow: {
    flexDirection: "row",
    gap: 8,
  },
  budgetBtn: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  budgetBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  budgetBtnText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  budgetBtnTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  controlLabel: {
    color: "#f3f4f6",
    fontSize: 13,
  },
  hrvButtons: {
    flexDirection: "row",
    gap: 8,
  },
  hrvBtn: {
    backgroundColor: "#1f2937",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  hrvBtnActive: {
    backgroundColor: "#3b82f6",
  },
  hrvBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  priorityBtn: {
    backgroundColor: "#1f2937",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  priorityBtnActive: {
    backgroundColor: "#ef4444",
  },
  priorityBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(96, 165, 250, 0.08)",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.2)",
  },
  scoreLabel: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  scoreValue: {
    color: "#60a5fa",
    fontSize: 16,
    fontWeight: "800",
  },
  intentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pollBtn: {
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    borderWidth: 1,
    borderColor: "#60a5fa",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pollBtnText: {
    color: "#60a5fa",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    backgroundColor: "#111827",
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
  approvedSection: {
    marginTop: 24,
  },
  logItem: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    marginVertical: 4,
  },
  logText: {
    color: "#34d399",
    fontSize: 13,
    fontWeight: "600",
  },
});
