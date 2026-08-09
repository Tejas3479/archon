import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAtom } from "jotai";
import { financeStatementAtom } from "../store";
import { ArchonBridge } from "../services/ArchonBridge";

export function FinanceDashboardScreen() {
  const [loading, setLoading] = useState<boolean>(false);
  const [financeState, setFinanceState] = useAtom(financeStatementAtom);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const mockTransactions = [
        { merchant: "Delta Airlines", amount: 350.00 },
        { merchant: "Spotify Premium", amount: 14.99 },
        { merchant: "Whole Foods Market", amount: 82.50 },
        { merchant: "Spotify Premium", amount: 14.99 }, // Recurring Spotify
        { merchant: "Comcast Cable", amount: 120.00 },    // Eligible for negotiation
        { merchant: "Comcast Cable", amount: 120.00 }     // Recurring Comcast
      ];

      // 1. Categorize transactions via Wasm Finance Agent
      const categorizeRes = await ArchonBridge.processDomainIntent(
        "finance",
        "categorize_transactions",
        JSON.stringify({ transactions: mockTransactions })
      );
      const categorized = JSON.parse(categorizeRes);

      // 2. Detect recurring subscriptions
      const subsRes = await ArchonBridge.processDomainIntent(
        "finance",
        "detect_subscriptions",
        JSON.stringify({ transactions: mockTransactions })
      );
      const subscriptions = JSON.parse(subsRes);

      // 3. Suggest cost optimizations
      const negRes = await ArchonBridge.processDomainIntent(
        "finance",
        "suggest_negotiation",
        JSON.stringify({ transactions: mockTransactions })
      );
      const suggestions = JSON.parse(negRes).suggestions;

      setFinanceState({
        transactions: categorized,
        subscriptions,
        suggestions
      });
    } catch (err: any) {
      Alert.alert("Analysis Error", err.message || "Failed to analyze financial logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>FinOps Dashboard</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadFinancialData}>
          <Text style={styles.refreshText}>Analyze Statement</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#60a5fa" style={styles.spinner} />
      ) : (
        <>
          {/* Optimization Suggestions */}
          <Text style={styles.sectionTitle}>Negotiation Recommendations</Text>
          {financeState?.suggestions && financeState.suggestions.length > 0 ? (
            financeState.suggestions.map((item, idx) => (
              <View key={idx} style={styles.optCard}>
                <Text style={styles.optText}>{item}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No high-cost subscription optimization recommendations available.</Text>
            </View>
          )}

          {/* Active Subscriptions */}
          <Text style={styles.sectionTitle}>Detected Subscriptions</Text>
          {financeState?.subscriptions && financeState.subscriptions.length > 0 ? (
            financeState.subscriptions.map((item, idx) => (
              <View key={idx} style={styles.subCard}>
                <View>
                  <Text style={styles.merchantText}>{item.merchant}</Text>
                  <Text style={styles.freqText}>{item.frequency.toUpperCase()}</Text>
                </View>
                <Text style={styles.amountText}>${item.amount.toFixed(2)} / mo</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active subscriptions detected.</Text>
            </View>
          )}

          {/* Ledger History */}
          <Text style={styles.sectionTitle}>Categorized Ledger</Text>
          {financeState?.transactions && financeState.transactions.length > 0 ? (
            financeState.transactions.map((item, idx) => (
              <View key={idx} style={styles.txCard}>
                <View>
                  <Text style={styles.txMerchant}>{item.merchant}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                  </View>
                </View>
                <Text style={styles.txAmount}>-${item.amount.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No transactions imported yet.</Text>
            </View>
          )}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff"
  },
  refreshBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  refreshText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12
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
  optCard: {
    backgroundColor: "#1e1b4b",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4338ca",
    marginBottom: 10
  },
  optText: {
    color: "#c084fc",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500"
  },
  subCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 10
  },
  merchantText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold"
  },
  freqText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4
  },
  amountText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  txCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1f2937"
  },
  txMerchant: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600"
  },
  badge: {
    backgroundColor: "#374151",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 5,
    alignSelf: "flex-start"
  },
  badgeText: {
    color: "#9ca3af",
    fontSize: 9,
    fontWeight: "bold"
  },
  txAmount: {
    color: "#f3f4f6",
    fontSize: 14,
    fontWeight: "700"
  },
  emptyCard: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 10,
    alignItems: "center"
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center"
  }
});
