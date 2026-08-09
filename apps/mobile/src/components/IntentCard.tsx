import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Intent } from "../store.js";

interface IntentCardProps {
  intent: Intent;
  onApprove: (id: string) => void;
  onIgnore: (id: string) => void;
  onEdit: (id: string) => void;
}

// WHY: Premium card component showing proactive action proposals to the user
export const IntentCard: React.FC<IntentCardProps> = ({ intent, onApprove, onIgnore, onEdit }) => {
  const confidencePercent = Math.round(intent.confidence * 100);
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.domainText}>{intent.domain.toUpperCase()}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{confidencePercent}% Confidence</Text>
        </View>
      </View>

      <Text style={styles.actionTitle}>
        {intent.action.replace("_", " ").toUpperCase()}
      </Text>
      
      <Text style={styles.description}>
        Archon detected a delayed flight. Ready to draft and submit a refund claim.
      </Text>

      {/* Render parameters in clean styling */}
      <View style={styles.paramContainer}>
        <Text style={styles.paramLabel}>Booking Ref: </Text>
        <Text style={styles.paramValue}>{intent.parameters.booking_reference}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, styles.btnIgnore]} onPress={() => onIgnore(intent.id)}>
          <Text style={styles.btnTextIgnore}>Ignore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={() => onEdit(intent.id)}>
          <Text style={styles.btnTextEdit}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => onApprove(intent.id)}>
          <Text style={styles.btnTextApprove}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#1f2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  domainText: {
    color: "#60a5fa",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "600",
  },
  actionTitle: {
    color: "#f3f4f6",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  paramContainer: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  paramLabel: {
    color: "#9ca3af",
    fontSize: 13,
  },
  paramValue: {
    color: "#60a5fa",
    fontWeight: "600",
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnIgnore: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#374151",
  },
  btnTextIgnore: {
    color: "#9ca3af",
    fontWeight: "600",
    fontSize: 14,
  },
  btnEdit: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#60a5fa",
  },
  btnTextEdit: {
    color: "#60a5fa",
    fontWeight: "600",
    fontSize: 14,
  },
  btnApprove: {
    backgroundColor: "#10b981",
  },
  btnTextApprove: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
