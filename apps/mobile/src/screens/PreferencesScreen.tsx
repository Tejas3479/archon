import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useAtom } from "jotai";
import { preferencesAtom } from "../store";
import { ArchonBridge } from "../services/ArchonBridge";

interface CustomSliderProps {
  value: number;
  onValueChange: (val: number) => void;
  color: string;
}

const CustomSlider = ({ value, onValueChange, color }: CustomSliderProps) => {
  return (
    <View style={sliderStyles.container}>
      <TouchableOpacity 
        style={sliderStyles.btn} 
        onPress={() => onValueChange(Math.max(0, value - 0.1))}
      >
        <Text style={sliderStyles.btnText}>-</Text>
      </TouchableOpacity>
      
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${value * 100}%`, backgroundColor: color }]} />
      </View>
      
      <TouchableOpacity 
        style={sliderStyles.btn} 
        onPress={() => onValueChange(Math.min(1, value + 0.1))}
      >
        <Text style={sliderStyles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// WHY: PreferencesScreen allows the user to tune personal style preference parameters.
// Adjusting one slider sends updates to the Rust preference graph, propagating weight changes along edges.
export const PreferencesScreen = () => {
  const [preferences, setPreferences] = useAtom(preferencesAtom);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({
    tone_casual: 0.5,
    risk_averse: 0.5,
    diet_vegan: 0.0,
  });

  // Load preferences from Rust core on mount
  useEffect(() => {
    async function loadPrefs() {
      try {
        const tone = await ArchonBridge.getPreference("tone_casual");
        const risk = await ArchonBridge.getPreference("risk_averse");
        const diet = await ArchonBridge.getPreference("diet_vegan");
        
        const loaded = { tone_casual: tone, risk_averse: risk, diet_vegan: diet };
        setLocalWeights(loaded);
        setPreferences(loaded);
      } catch (err: any) {
        Alert.alert("Error Loading Preferences", err.message);
      }
    }
    loadPrefs();
  }, []);

  // Update a preference weight in Rust and propagate updates
  const handleValueChange = async (key: string, newValue: number) => {
    try {
      const oldValue = localWeights[key];
      const delta = newValue - oldValue;
      
      // Update in Rust core
      await ArchonBridge.updatePreference(key, delta);
      
      // Fetch all updated preferences to see propagated effects
      const tone = await ArchonBridge.getPreference("tone_casual");
      const risk = await ArchonBridge.getPreference("risk_averse");
      const diet = await ArchonBridge.getPreference("diet_vegan");
      
      const updated = { tone_casual: tone, risk_averse: risk, diet_vegan: diet };
      setLocalWeights(updated);
      setPreferences(updated);
    } catch (err: any) {
      Alert.alert("Update Error", err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>Preference Tuner</Text>
      <Text style={styles.headerSubtitle}>
        Adjust weights below. Edge propagation is computed in real-time in the Rust property graph.
      </Text>

      {/* Tone Casual Slider */}
      <View style={styles.prefCard}>
        <View style={styles.prefHeader}>
          <Text style={styles.prefTitle}>Casual Tone</Text>
          <Text style={styles.prefValue}>{(localWeights.tone_casual * 100).toFixed(0)}%</Text>
        </View>
        <Text style={styles.prefDesc}>
          Influences the twin's generated communication style to be informal. Negative association edge to Risk Aversion.
        </Text>
        <CustomSlider
          value={localWeights.tone_casual}
          onValueChange={(val: number) => handleValueChange("tone_casual", val)}
          color="#3b82f6"
        />
      </View>

      {/* Risk Averse Slider */}
      <View style={styles.prefCard}>
        <View style={styles.prefHeader}>
          <Text style={styles.prefTitle}>Risk Aversion</Text>
          <Text style={styles.prefValue}>{(localWeights.risk_averse * 100).toFixed(0)}%</Text>
        </View>
        <Text style={styles.prefDesc}>
          Controls threshold for autonomous actions without requiring explicit human approval.
        </Text>
        <CustomSlider
          value={localWeights.risk_averse}
          onValueChange={(val: number) => handleValueChange("risk_averse", val)}
          color="#ef4444"
        />
      </View>

      {/* Diet Vegan Slider */}
      <View style={styles.prefCard}>
        <View style={styles.prefHeader}>
          <Text style={styles.prefTitle}>Vegan Affinity</Text>
          <Text style={styles.prefValue}>{(localWeights.diet_vegan * 100).toFixed(0)}%</Text>
        </View>
        <Text style={styles.prefDesc}>
          Toggles prioritization for vegan-friendly options during food and restaurant queries.
        </Text>
        <CustomSlider
          value={localWeights.diet_vegan}
          onValueChange={(val: number) => handleValueChange("diet_vegan", val)}
          color="#10b981"
        />
      </View>
    </ScrollView>
  );
};

const sliderStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: "#1f2937",
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  contentContainer: {
    padding: 24,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  prefCard: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 20,
  },
  prefHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  prefTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  prefValue: {
    color: "#60a5fa",
    fontSize: 16,
    fontWeight: "800",
  },
  prefDesc: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
});
