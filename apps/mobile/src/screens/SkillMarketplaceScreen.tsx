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

interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  installed: boolean;
}

export default function SkillMarketplaceScreen() {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch marketplace catalog
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      // Fetch from Cloudflare Gateway registry endpoint or fallback to mock
      const response = await fetch("https://archon-gateway.dev/api/skills").catch(() => null);
      if (response && response.ok) {
        const data = await response.json();
        setSkills(data);
      } else {
        // Fallback mock catalog
        setSkills([
          {
            id: "skill_slack",
            name: "Slack Enclave Notifier",
            description: "Routes real-time warning logs and anomaly reports to your Slack workspace.",
            category: "Integration",
            price: "Free",
            installed: false,
          },
          {
            id: "skill_github",
            name: "GitHub Sync Agent",
            description: "Automatically pushes ANNEAL symbolic repairs and graphs to target repos.",
            category: "Development",
            price: "Free",
            installed: false,
          },
          {
            id: "skill_smart_locks",
            name: "August Smart Lock Hub",
            description: "Monitors and locks your home automatically when biosensors detect sleep.",
            category: "Smart Home",
            price: "Free",
            installed: true,
          },
        ]);
      }
    } catch (err) {
      console.warn("Marketplace fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (id: string) => {
    setInstallingId(id);
    try {
      // Mock call to install endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, installed: true } : s))
      );
      Alert.alert("Success", "Skill installed and sandbox bounds updated successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to install skill");
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Skill Marketplace</Text>
        <Text style={styles.subtitle}>Extend Your Digital Twin with Sandboxed Modules</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
      ) : (
        <View style={styles.list}>
          {skills.map((skill) => (
            <View key={skill.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{skill.name}</Text>
                  <Text style={styles.cardCategory}>{skill.category}</Text>
                </View>
                <Text style={styles.priceTag}>{skill.price}</Text>
              </View>
              <Text style={styles.cardDesc}>{skill.description}</Text>
              
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  skill.installed && styles.disabledBtn,
                  installingId === skill.id && styles.installingBtn,
                ]}
                disabled={skill.installed || installingId !== null}
                onPress={() => handleInstall(skill.id)}
              >
                {installingId === skill.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.actionBtnText}>
                    {skill.installed ? "✓ INSTALLED" : "📥 INSTALL TO SANDBOX"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
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
  loader: {
    marginTop: 40,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardName: {
    color: "#f3f4f6",
    fontSize: 15,
    fontWeight: "700",
  },
  cardCategory: {
    color: "#60a5fa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 2,
  },
  priceTag: {
    color: "#10b981",
    fontSize: 13,
    fontWeight: "700",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardDesc: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  installingBtn: {
    backgroundColor: "#1d4ed8",
  },
  disabledBtn: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
