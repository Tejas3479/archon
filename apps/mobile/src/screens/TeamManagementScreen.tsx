import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { useAtom } from "jotai";
import { teamMembersAtom, ssoTokenAtom, organizationAtom } from "../store";

export default function TeamManagementScreen() {
  const [teamMembers, setTeamMembers] = useAtom(teamMembersAtom);
  const [ssoToken] = useAtom(ssoTokenAtom);
  const [org] = useAtom(organizationAtom);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "viewer">("member");

  const handleInvite = async () => {
    if (!inviteEmail) {
      Alert.alert("Error", "Please provide a valid email");
      return;
    }

    try {
      // Invite via simulated gateway API
      const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || "http://localhost:8787";
      const res = await fetch(`${GATEWAY_URL}/org/${org?.id}/invite`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ssoToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (res.ok) {
        setTeamMembers((prev) => [...prev, { userId: inviteEmail, role: inviteRole }]);
        Alert.alert("Success", `Invitation sent to ${inviteEmail} as ${inviteRole}`);
        setInviteEmail("");
      } else {
        throw new Error("Failed to send invite");
      }
    } catch (err) {
      // Fallback local update if gateway offline
      setTeamMembers((prev) => [...prev, { userId: inviteEmail, role: inviteRole }]);
      Alert.alert("Offline Success", `Added ${inviteEmail} locally.`);
      setInviteEmail("");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || "http://localhost:8787";
      const res = await fetch(`${GATEWAY_URL}/org/${org?.id}/member/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${ssoToken}`,
        },
      });

      if (res.ok) {
        setTeamMembers((prev) => prev.filter((m) => m.userId !== userId));
        Alert.alert("Success", `Removed member ${userId}`);
      } else {
        throw new Error("Failed to delete member");
      }
    } catch (err) {
      setTeamMembers((prev) => prev.filter((m) => m.userId !== userId));
      Alert.alert("Offline Success", `Removed ${userId} locally.`);
    }
  };

  const handleChangeRole = (userId: string, newRole: "owner" | "admin" | "member" | "viewer") => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    );
    Alert.alert("Success", `Updated role for ${userId} to ${newRole}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Management</Text>
        <Text style={styles.subtitle}>Manage Organization roles and permissions for {org?.name}</Text>
      </View>

      {/* Invite member form */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Invite New Team Member</Text>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#9ca3af"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.rolePickerRow}>
          {(["member", "admin", "viewer"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, inviteRole === r && styles.roleBtnActive]}
              onPress={() => setInviteRole(r)}
            >
              <Text style={[styles.roleBtnText, inviteRole === r && styles.roleBtnTextActive]}>
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
          <Text style={styles.inviteBtnText}>Send Team Invitation</Text>
        </TouchableOpacity>
      </View>

      {/* Members List */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Active Team Members ({teamMembers.length})</Text>

        {teamMembers.map((member) => (
          <View key={member.userId} style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberEmail}>{member.userId}</Text>
              <Text style={styles.memberRoleLabel}>Role: {member.role.toUpperCase()}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  handleChangeRole(member.userId, member.role === "admin" ? "member" : "admin")
                }
              >
                <Text style={styles.actionBtnText}>Toggle Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn]}
                onPress={() => handleRemoveMember(member.userId)}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
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
  input: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    color: "#ffffff",
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  rolePickerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  roleBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  roleBtnText: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
  },
  roleBtnTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  inviteBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  inviteBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    paddingVertical: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberEmail: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  memberRoleLabel: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionBtnText: {
    color: "#3b82f6",
    fontSize: 11,
    fontWeight: "700",
  },
  removeBtn: {
    borderColor: "#ef4444",
  },
  removeBtnText: {
    color: "#ef4444",
    fontSize: 11,
    fontWeight: "700",
  },
});
