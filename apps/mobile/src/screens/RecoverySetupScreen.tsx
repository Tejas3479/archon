import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";

// WHY: Displays warning and triggers placeholder callback for the key sharding backup flow (Phase 2)
export const RecoverySetupScreen = () => {
  const handleSetupRecovery = () => {
    Alert.alert(
      "Phase 2 Feature",
      "Shamir's Secret Sharing key backup (iCloud, Paper Shard, and Hardware Key) will be implemented in Phase 2."
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Identity Key Recovery</Text>
        <Text style={styles.warningTitle}>⚠️ CRITICAL WARNING</Text>
        <Text style={styles.warningText}>
          Your Archon private key represents your twin's cryptographic identity and secure memory keys. 
          Without a backup, if you lose this device, your twin will be permanently lost.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>How Key Recovery Works (Phase 2):</Text>
        <Text style={styles.cardListItem}>• Shamir's Secret Sharing splits key into 3 shards.</Text>
        <Text style={styles.cardListItem}>• Shard 1 is encrypted and saved to iCloud / Drive.</Text>
        <Text style={styles.cardListItem}>• Shard 2 is printed as a physical QR code.</Text>
        <Text style={styles.cardListItem}>• Shard 3 is stored on a hardware security key.</Text>
        <Text style={styles.cardListItem}>• Reconstructing the key requires any 2 of the 3 shards.</Text>
      </View>

      <TouchableOpacity style={styles.btnAction} onPress={handleSetupRecovery}>
        <Text style={styles.btnText}>Configure Key Recovery</Text>
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
  header: {
    marginTop: 40,
    alignItems: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
  },
  warningTitle: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  warningText: {
    color: "#f87171",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  cardTitle: {
    color: "#f3f4f6",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardListItem: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 20,
    marginVertical: 4,
  },
  btnAction: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
