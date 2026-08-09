import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from "react-native";
import { useAtom } from "jotai";
import { hasOnboardedAtom } from "../store";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Encrypted By Default",
    desc: "Your data stays on-device in a secure WASM enclave. Archon never reads your private memory.",
  },
  {
    id: "2",
    title: "Autonomous Actions",
    desc: "Deploy AI twins that act on your behalf, paying for services using crypto-native FinOps.",
  },
  {
    id: "3",
    title: "Peer-to-Peer Swarm",
    desc: "Your enclave communicates directly with trusted peers over encrypted relays. No centralized servers.",
  }
];

export default function OnboardingScreen({ navigation }: any) {
  const [hasOnboarded, setHasOnboarded] = useAtom(hasOnboardedAtom);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleNext = () => {
    if (activeSlide < SLIDES.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      setHasOnboarded(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.slideContent}>
        <View style={styles.iconPlaceholder} />
        <Text style={styles.title}>{SLIDES[activeSlide].title}</Text>
        <Text style={styles.desc}>{SLIDES[activeSlide].desc}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeSlide === index && styles.dotActive
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleNext}>
          <Text style={styles.btnText}>
            {activeSlide === SLIDES.length - 1 ? "Enter Enclave" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f19", justifyContent: "space-between" },
  slideContent: { flex: 1, justifyContent: "center", padding: 32 },
  iconPlaceholder: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#1e293b", marginBottom: 32, alignSelf: "center", borderWidth: 1, borderColor: "#334155" },
  title: { color: "#f3f4f6", fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 16 },
  desc: { color: "#9ca3af", fontSize: 16, textAlign: "center", lineHeight: 24 },
  footer: { padding: 32, paddingBottom: 48 },
  dotsRow: { flexDirection: "row", justifyContent: "center", marginBottom: 32, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#374151" },
  dotActive: { backgroundColor: "#60a5fa", width: 24 },
  btn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" }
});
