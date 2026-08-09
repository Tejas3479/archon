import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, FlatList, Alert } from "react-native";
import { useAtom } from "jotai";
import { verifiableCredentialsAtom, VCRecord } from "../store";
import { ArchonBridge } from "../services/ArchonBridge";

export function CredentialManagerScreen() {
  const [claimKey, setClaimKey] = useState<string>("");
  const [claimValue, setClaimValue] = useState<string>("");
  const [vcs, setVcs] = useAtom(verifiableCredentialsAtom);

  const issueVC = async () => {
    if (!claimKey || !claimValue) {
      Alert.alert("Validation", "Please input both claim key and claim value");
      return;
    }

    try {
      const myPubkey = await ArchonBridge.swarmGetPublicKey();
      const claims = { [claimKey]: claimValue };

      // Issue credential signed by our own local identity
      const vcStr = await ArchonBridge.issueCredential(
        `vc_${Math.random().toString(36).substring(7)}`,
        myPubkey,
        JSON.stringify(claims)
      );

      const parsedVC = JSON.parse(vcStr);
      
      const record: VCRecord = {
        id: parsedVC.id,
        issuer: parsedVC.issuer,
        credential_subject: parsedVC.credential_subject,
        proof: parsedVC.proof
      };

      setVcs([...vcs, record]);
      setClaimKey("");
      setClaimValue("");
      Alert.alert("Success", "Issued new signed Verifiable Credential!");
    } catch (err: any) {
      Alert.alert("Issuance Failed", err.message || "Could not generate signature");
    }
  };

  const verifyVC = async (record: VCRecord) => {
    try {
      const issuerPrefix = "did:key:";
      if (!record.issuer.startsWith(issuerPrefix)) {
        Alert.alert("Verification Failed", "Issuer does not have did:key prefix");
        return;
      }
      const issuerPub = record.issuer.slice(issuerPrefix.length);

      const isValid = await ArchonBridge.verifyCredential(
        JSON.stringify(record),
        issuerPub
      );

      if (isValid) {
        Alert.alert("Verification Success", "Signature checks verified: VC is mathematically valid and untampered.");
      } else {
        Alert.alert("Verification Failed", "Signature check failed. This VC has been altered or tampered with!");
      }
    } catch (err: any) {
      Alert.alert("Verification Error", err.message || "Failed to execute signature verify");
    }
  };

  const createPresentation = async (record: VCRecord) => {
    try {
      const myPubkey = await ArchonBridge.swarmGetPublicKey();

      // Creates a signed Verifiable Presentation wrapper containing this VC
      const vpStr = await ArchonBridge.createPresentation(
        JSON.stringify([record]),
        myPubkey
      );

      Alert.alert(
        "Verifiable Presentation Generated",
        `VP is signed by your DID:\n\n${vpStr.substring(0, 250)}...`,
        [{ text: "Copy to Clipboard", onPress: () => {} }]
      );
    } catch (err: any) {
      Alert.alert("Failed to create Presentation wrapper", err.message || "Unable to package credential");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifiable Trust Center</Text>

      {/* Claim Issuance */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Issue Self-Signed Credential</Text>
        <TextInput
          placeholder="Claim Key (e.g. tone_casual)"
          placeholderTextColor="#9ca3af"
          value={claimKey}
          onChangeText={setClaimKey}
          style={styles.input}
        />
        <TextInput
          placeholder="Claim Value (e.g. true)"
          placeholderTextColor="#9ca3af"
          value={claimValue}
          onChangeText={setClaimValue}
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={issueVC}>
          <Text style={styles.buttonText}>Issue & Sign VC</Text>
        </TouchableOpacity>
      </View>

      {/* VC Wallet List */}
      <Text style={styles.sectionHeader}>Credential Wallet</Text>
      <FlatList
        data={vcs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.vcCard}>
            <Text style={styles.vcId}>ID: {item.id}</Text>
            <Text numberOfLines={1} style={styles.vcIssuer}>Issuer: {item.issuer}</Text>
            
            <View style={styles.claimsBox}>
              <Text style={styles.claimsTitle}>Subject Claims:</Text>
              <Text style={styles.claimsBody}>
                {JSON.stringify(item.credential_subject?.claims || {}, null, 2)}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.btnVerify]} onPress={() => verifyVC(item)}>
                <Text style={styles.btnText}>Verify Signature</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.btnPresent]} onPress={() => createPresentation(item)}>
                <Text style={styles.btnText}>Create Presentation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No credentials in wallet yet.</Text>
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
    marginBottom: 20
  },
  formCard: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 20
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold"
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15
  },
  vcCard: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 15
  },
  vcId: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "bold"
  },
  vcIssuer: {
    color: "#9ca3af",
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 4,
    marginBottom: 12
  },
  claimsBox: {
    backgroundColor: "#1f2937",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151"
  },
  claimsTitle: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4
  },
  claimsBody: {
    color: "#ffffff",
    fontFamily: "monospace",
    fontSize: 12
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4
  },
  btnVerify: {
    backgroundColor: "#10b981"
  },
  btnPresent: {
    backgroundColor: "#4f46e5"
  },
  btnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold"
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic"
  }
});
