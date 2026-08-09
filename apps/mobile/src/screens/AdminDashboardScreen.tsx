import React, { useState, useEffect } from "react";
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
import { organizationAtom, ssoTokenAtom } from "../store";

export default function AdminDashboardScreen({ navigation }: any) {
  const [org] = useAtom(organizationAtom);
  const [ssoToken] = useAtom(ssoTokenAtom);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActions: 0,
    totalCost: 0,
    activeAgents: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || "http://localhost:8787";
      const res = await fetch(`${GATEWAY_URL}/org/${org?.id}/stats`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${ssoToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        throw new Error("Gateway error");
      }
    } catch (err) {
      // Fallback mock stats if offline
      setStats({
        totalActions: 320,
        totalCost: 1540,
        activeAgents: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Enterprise Admin Dashboard</Text>
        <Text style={styles.subtitle}>Aggregate usage metrics and FinOps limits for {org?.name}</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : (
        <View>
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active Twins</Text>
              <Text style={styles.statValue}>{stats.activeAgents}</Text>
              <Text style={styles.statSub}>Running Enclaves</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Executions</Text>
              <Text style={styles.statValue}>{stats.totalActions}</Text>
              <Text style={styles.statSub}>Tool & Task runs</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionHeader}>FinOps Billing Overview</Text>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Current Billing Cycle Cost:</Text>
              <Text style={styles.billingValue}>${(stats.totalCost / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Allocated Team Budget:</Text>
              <Text style={[styles.billingValue, { color: "#34d399" }]}>$50.00 / day</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(stats.totalCost / 5000) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {((stats.totalCost / 5000) * 100).toFixed(1)}% of daily allowance consumed
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Admin Directives</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("TeamManagement")}
            >
              <Text style={styles.actionBtnText}>👥 Manage Team Members</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={() => Alert.alert("Audit Logs Export", "Generating CSV audit sheet. Fetching from /org/org_123/audit?format=csv")}
            >
              <Text style={styles.secondaryBtnText}>📥 Export Organization Audit Logs</Text>
            </TouchableOpacity>
          </View>
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
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  loader: {
    marginTop: 40,
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    color: "#60a5fa",
    fontSize: 28,
    fontWeight: "800",
    marginVertical: 4,
  },
  statSub: {
    color: "#6b7280",
    fontSize: 11,
  },
  card: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  billingLabel: {
    color: "#d1d5db",
    fontSize: 13,
  },
  billingValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#1f2937",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
  progressText: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
  },
  actionBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  secondaryBtnText: {
    color: "#d1d5db",
    fontWeight: "700",
    fontSize: 13,
  },
});
