import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAtom } from "jotai";
import * as LocalAuthentication from "expo-local-authentication";
import { identityAtom } from "../store";
import { ArchonBridge } from "../services/ArchonBridge";
import { SecureStoreService } from "../services/SecureStore";

// WHY: OnboardingScreen handles the FaceID registration, key derivation, and initial twin setup
export const OnboardingScreen = ({ navigation }: { navigation: any }) => {
  const [, setIdentity] = useAtom(identityAtom);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleBirthTwin = async () => {
    setLoading(true);
    setStatus("Verifying biometrics...");
    
    try {
      // 1. Biometric verification
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: "Verify identity to birth your digital twin",
          fallbackLabel: "Use PIN/Passcode"
        });
        
        if (!auth.success) {
          Alert.alert("Biometric Failed", "Authentication was canceled or failed.");
          setLoading(false);
          setStatus("");
          return;
        }
      }
      
      setStatus("Generating cryptographic identity in enclave...");
      
      // 2. Call Wasm core to generate Ed25519 key pair
      const publicKeyHex = await ArchonBridge.generateKeys();
      setIdentity(publicKeyHex);
      
      // Save biometric preferences and complete onboarding
      await SecureStoreService.setBiometricPreference(true);
      
      setStatus("Initializing encrypted memory vault...");
      // Simulate small entropy seed storage
      const mockMasterSeed = Math.random().toString(36).substring(2, 34);
      await SecureStoreService.setMasterSeed(mockMasterSeed);
      
      setStatus("Twin born successfully!");
      
      setTimeout(() => {
        setLoading(false);
        // Navigate to dashboard
        navigation.replace("Dashboard");
      }, 1000);
      
    } catch (error: any) {
      Alert.alert("Birth Failure", error.message || "An unexpected error occurred during setup.");
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>ARCHON</Text>
        <Text style={styles.subtitle}>Self-Evolving Personal Digital Twin</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Zero-Trust Foundation</Text>
        <Text style={styles.infoText}>
          Your twin runs locally using WebAssembly. All memory blocks are encrypted with AES-256-GCM. 
          Identity verification keys never leave this device.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.btnBirth} onPress={handleBirthTwin}>
          <Text style={styles.btnText}>Birth My Twin</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.btnRecovery}
        onPress={() => navigation.navigate("RecoverySetup")}
        disabled={loading}
      >
        <Text style={styles.btnRecoveryText}>Configure Key Recovery</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
    padding: 24,
    justifyContent: "space-between",
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 64,
  },
  title: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 4,
  },
  subtitle: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 16,
    padding: 20,
    marginVertical: 40,
  },
  infoTitle: {
    color: "#f3f4f6",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoText: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 22,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  statusText: {
    color: "#60a5fa",
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  },
  btnBirth: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  btnRecovery: {
    alignItems: "center",
    marginVertical: 20,
  },
  btnRecoveryText: {
    color: "#9ca3af",
    fontSize: 14,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
});
