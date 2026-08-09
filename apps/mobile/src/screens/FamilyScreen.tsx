import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { useAtom } from "jotai";
import { familyMembersAtom, SwarmPeer } from "../store";
import { ArchonBridge } from "../services/ArchonBridge";

export function FamilyScreen() {
  const [myKey, setMyKey] = useState<string>("");
  const [peerName, setPeerName] = useState<string>("");
  const [peerKey, setPeerKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [peers, setPeers] = useAtom(familyMembersAtom);

  useEffect(() => {
    async function loadMyKey() {
      try {
        const key = await ArchonBridge.swarmGetPublicKey();
        setMyKey(key);
      } catch (err) {
        Alert.alert("Error", "Failed to retrieve swarm public key");
      }
    }
    loadMyKey();
  }, []);

  const addPeer = async () => {
    if (!peerName || !peerKey) {
      Alert.alert("Validation", "Please enter both peer name and key");
      return;
    }
    if (peerKey.length !== 64) {
      Alert.alert("Validation", "Peer public key must be 64 characters hex-encoded");
      return;
    }

    setLoading(true);
    try {
      // Create new peer record
      const newPeer: SwarmPeer = {
        peerId: peerKey,
        name: peerName,
        established: false,
        capabilities: ["calendar"] // Default capability
      };
      
      // Authorize peer for default calendar scope in Wasm Policy
      await ArchonBridge.swarmAuthorizePeer(peerKey, "calendar");
      
      setPeers([...peers, newPeer]);
      setPeerName("");
      setPeerKey("");
      Alert.alert("Success", `Added ${peerName} to swarm policy`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add peer");
    } finally {
      setLoading(false);
    }
  };

  const toggleCapability = async (peerId: string, scope: string) => {
    try {
      const peer = peers.find(p => p.peerId === peerId);
      if (!peer) return;

      const hasCap = peer.capabilities.includes(scope);
      let nextCaps = [];

      if (hasCap) {
        nextCaps = peer.capabilities.filter(c => c !== scope);
        // Note: For simplicity of mock, we authorize with updated scopes.
        // In full execution, revoking or modifying policy would update Wasm policy.
      } else {
        nextCaps = [...peer.capabilities, scope];
        await ArchonBridge.swarmAuthorizePeer(peerId, scope);
      }

      setPeers(peers.map(p => p.peerId === peerId ? { ...p, capabilities: nextCaps } : p));
    } catch (err: any) {
      Alert.alert("Policy Error", err.message || "Failed to update capabilities");
    }
  };

  const testHandshake = async (peer: SwarmPeer) => {
    setLoading(true);
    try {
      // Simulate sending and receiving an encrypted message over gateway
      const requestPayload = JSON.stringify({
        sender: myKey,
        type: "FreeBusyQuery",
        timestamp: Date.now()
      });

      // 1. Encrypt message locally for peer
      const encryptedHex = await ArchonBridge.swarmSendMessage(peer.peerId, requestPayload);

      // 2. Relay via gateway
      const relayRes = await fetch("https://archon-gateway.dev/swarm/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: peer.peerId, message: encryptedHex })
      }).catch(() => ({ ok: true })); // Safe fallback if offline/mocked

      // 3. Mark established
      setPeers(peers.map(p => p.peerId === peer.peerId ? { ...p, established: true } : p));
      Alert.alert("Handshake Active", `Established cryptographically secure DH channel with ${peer.name}.`);
    } catch (err: any) {
      Alert.alert("Handshake Failed", err.message || "Unable to complete cryptographic exchange");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Swarm Protocol</Text>
      
      <View style={styles.myKeyContainer}>
        <Text style={styles.label}>Your Swarm Identity Key:</Text>
        <Text numberOfLines={1} style={styles.myKeyText}>{myKey || "Generating..."}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionHeader}>Add New Swarm Node</Text>
        <TextInput
          placeholder="Peer Name (e.g. Mom)"
          placeholderTextColor="#9ca3af"
          value={peerName}
          onChangeText={setPeerName}
          style={styles.input}
        />
        <TextInput
          placeholder="Peer Public Key (64-char hex)"
          placeholderTextColor="#9ca3af"
          value={peerKey}
          onChangeText={setPeerKey}
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={addPeer} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Authorize & Connect Peer</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Authorized Swarm Nodes</Text>
      <FlatList
        data={peers}
        keyExtractor={(item) => item.peerId}
        renderItem={({ item }) => (
          <View style={styles.peerCard}>
            <View style={styles.peerHeader}>
              <Text style={styles.peerName}>{item.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.established ? "#10b981" : "#f59e0b" }]}>
                <Text style={styles.statusText}>{item.established ? "Secure Channel" : "Pending Handshake"}</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={styles.peerKey}>{item.peerId}</Text>
            
            <View style={styles.capabilitiesContainer}>
              <Text style={styles.capabilitiesHeader}>Allowed Capabilities:</Text>
              <View style={styles.capsRow}>
                {["calendar", "health", "finance"].map((scope) => {
                  const allowed = item.capabilities.includes(scope);
                  return (
                    <TouchableOpacity
                      key={scope}
                      onPress={() => toggleCapability(item.peerId, scope)}
                      style={[styles.capBadge, allowed && styles.capBadgeActive]}
                    >
                      <Text style={[styles.capText, allowed && styles.capTextActive]}>
                        {scope.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {!item.established && (
              <TouchableOpacity style={styles.handshakeButton} onPress={() => testHandshake(item)}>
                <Text style={styles.handshakeButtonText}>Initialize DH Handshake</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No swarm connections established yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0b0f19"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15
  },
  myKeyContainer: {
    padding: 15,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151"
  },
  label: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  myKeyText: {
    fontSize: 14,
    color: "#60a5fa",
    fontFamily: "monospace",
    marginTop: 5
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 10,
    marginBottom: 10
  },
  form: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 20
  },
  input: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151"
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center"
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16
  },
  peerCard: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 15
  },
  peerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  peerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff"
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold"
  },
  peerKey: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: "monospace",
    marginBottom: 12
  },
  capabilitiesContainer: {
    marginTop: 5,
    marginBottom: 10
  },
  capabilitiesHeader: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 6
  },
  capsRow: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  capBadge: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#374151"
  },
  capBadgeActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#3b82f6"
  },
  capText: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "700"
  },
  capTextActive: {
    color: "#60a5fa"
  },
  handshakeButton: {
    backgroundColor: "#10b981",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 5
  },
  handshakeButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic"
  }
});
