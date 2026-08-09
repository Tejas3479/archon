import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ArchonBridge } from "../services/ArchonBridge";

export function SocialDashboardScreen() {
  const [loading, setLoading] = useState<boolean>(false);
  const [events, setEvents] = useState<any[]>([]);

  const loadSocialFeed = async () => {
    setLoading(true);
    try {
      const mockMessages = [
        { sender: "Mom", text: "Happy birthday to you, hope it's great!" },
        { sender: "John", text: "Congrats on the new job promotion!" },
        { sender: "Alice", text: "Can't wait for the wedding next week!" },
        { sender: "Bob", text: "What are you doing today?" } // Normal chat
      ];

      const resStr = await ArchonBridge.processDomainIntent(
        "social",
        "extract_life_events",
        JSON.stringify({ messages: mockMessages })
      );

      const parsed = JSON.parse(resStr);
      setEvents(parsed);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to process inbox milestones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocialFeed();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social Intelligence</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadSocialFeed}>
          <Text style={styles.refreshBtnText}>Scan Inbox</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#60a5fa" style={styles.spinner} />
      ) : (
        <>
          <Text style={styles.sectionHeader}>Extracted Milestones & Reminders</Text>
          {events.length > 0 ? (
            events.map((event, idx) => (
              <View key={idx} style={styles.eventCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.sender}>From: {event.sender}</Text>
                    <Text style={styles.eventType}>{event.event_type}</Text>
                  </View>
                  <View style={styles.milestoneBadge}>
                    <Text style={styles.milestoneBadgeText}>Milestone</Text>
                  </View>
                </View>
                
                <View style={styles.bodyBox}>
                  <Text style={styles.originalLabel}>Extracted Context:</Text>
                  <Text style={styles.originalText}>"{event.original_text}"</Text>
                </View>

                <View style={styles.suggestionBox}>
                  <Text style={styles.suggestionLabel}>Suggested Response Action:</Text>
                  <Text style={styles.suggestionText}>{event.suggestion}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => Alert.alert("Draft Message", `DRAFT: "${event.suggestion}"`)}
                >
                  <Text style={styles.actionBtnText}>Send Quick Reply</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming birthday, wedding, or job promotion milestones found in inbox feeds.</Text>
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
  header: {
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
  refreshBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12
  },
  spinner: {
    marginTop: 40
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15
  },
  eventCard: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 15
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  sender: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold"
  },
  eventType: {
    color: "#60a5fa",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3
  },
  milestoneBadge: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  milestoneBadgeText: {
    color: "#60a5fa",
    fontSize: 10,
    fontWeight: "bold"
  },
  bodyBox: {
    backgroundColor: "#1f2937",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#374151"
  },
  originalLabel: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "bold",
    marginBottom: 4
  },
  originalText: {
    color: "#e5e7eb",
    fontSize: 13,
    fontStyle: "italic"
  },
  suggestionBox: {
    backgroundColor: "#1e1b4b",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4338ca",
    marginBottom: 12
  },
  suggestionLabel: {
    fontSize: 10,
    color: "#c084fc",
    fontWeight: "bold",
    marginBottom: 4
  },
  suggestionText: {
    color: "#e9d5ff",
    fontSize: 13,
    lineHeight: 18
  },
  actionBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center"
  },
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13
  },
  emptyCard: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 12,
    alignItems: "center"
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center"
  }
});
