import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useAtom } from "jotai";
import { ssoTokenAtom, organizationAtom } from "../store";

export default function SSOLoginScreen({ navigation }: any) {
  const [, setSsoToken] = useAtom(ssoTokenAtom);
  const [, setOrg] = useAtom(organizationAtom);
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartSSO = () => {
    setShowWebView(true);
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    // Detect redirect back to our redirect URI (e.g. callback endpoint) containing authentication tokens
    if (navState.url.includes("callback") || navState.url.includes("token=")) {
      setShowWebView(false);
      completeLogin("sso_token_google_workspace_98765");
    }
  };

  const completeLogin = (token: string) => {
    setLoading(true);
    setSsoToken(token);
    setOrg({
      id: "org_123",
      name: "Archon Enterprise",
      plan: "enterprise"
    });
    
    setTimeout(() => {
      setLoading(false);
      Alert.alert("SSO Login Success", "Federated OIDC identity verified successfully.");
      navigation.replace("Dashboard");
    }, 1000);
  };

  // Mock SSO flow bypass for instant testing
  const handleBypassSSO = () => {
    completeLogin("sso_token_okta_simulated_777");
  };

  if (showWebView) {
    return (
      <View style={styles.container}>
        <View style={styles.webHeader}>
          <Text style={styles.webHeaderTitle}>Identity SSO Provider</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowWebView(false)}>
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: "https://auth.archon.me/auth?client_id=archon-mobile&redirect_uri=archon://callback&response_type=token" }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          style={{ flex: 1 }}
          // In React Native WebView, we can inject a mock trigger to simulate a redirect after 2 seconds
          injectedJavaScript={`
            setTimeout(() => {
              window.location.href = "archon://callback?token=sso_token_google_workspace_98765";
            }, 2000);
            true;
          `}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🛡️</Text>
        <Text style={styles.title}>Archon Enterprise SSO</Text>
        <Text style={styles.subtitle}>Sign in with Google Workspace, Okta, or Active Directory</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#60a5fa" style={styles.loader} />
        ) : (
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.loginBtn} onPress={handleStartSSO}>
              <Text style={styles.loginBtnText}>Secure SSO Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.loginBtn, styles.secondaryBtn]} onPress={handleBypassSSO}>
              <Text style={styles.secondaryBtnText}>Simulate Google Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: "#f3f4f6",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 32,
  },
  loader: {
    marginTop: 20,
  },
  btnGroup: {
    width: "100%",
    gap: 12,
  },
  loginBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  loginBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  secondaryBtnText: {
    color: "#d1d5db",
    fontWeight: "700",
    fontSize: 14,
  },
  webHeader: {
    height: 50,
    backgroundColor: "#111827",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  webHeaderTitle: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  closeBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  closeBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 11,
  },
});
