import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Provider, useAtom } from "jotai";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { RecoverySetupScreen } from "./src/screens/RecoverySetupScreen";
import { PreferencesScreen } from "./src/screens/PreferencesScreen";
import { ActivityLogScreen } from "./src/screens/ActivityLogScreen";
import { FamilyScreen } from "./src/screens/FamilyScreen";
import { FinanceDashboardScreen } from "./src/screens/FinanceDashboardScreen";
import { HealthDashboardScreen } from "./src/screens/HealthDashboardScreen";
import { HomeAutomationScreen } from "./src/screens/HomeAutomationScreen";
import { SocialDashboardScreen } from "./src/screens/SocialDashboardScreen";
import { CredentialManagerScreen } from "./src/screens/CredentialManagerScreen";
import VoiceScreen from "./src/screens/VoiceScreen";
import SpatialViewScreen from "./src/screens/SpatialViewScreen";
import TravelDashboardScreen from "./src/screens/TravelDashboardScreen";
import ReflectionReportScreen from "./src/screens/ReflectionReportScreen";
import SkillMarketplaceScreen from "./src/screens/SkillMarketplaceScreen";
import RSIReviewScreen from "./src/screens/RSIReviewScreen";
import DeFiDashboardScreen from "./src/screens/DeFiDashboardScreen";
import DeepfakeAlertsScreen from "./src/screens/DeepfakeAlertsScreen";
import GDPRSettingsScreen from "./src/screens/GDPRSettingsScreen";
import TeamManagementScreen from "./src/screens/TeamManagementScreen";
import AdminDashboardScreen from "./src/screens/AdminDashboardScreen";
import SSOLoginScreen from "./src/screens/SSOLoginScreen";

import { ArchonBridge } from "./src/services/ArchonBridge";

import { SecureStoreService } from "./src/services/SecureStore";
import { identityAtom } from "./src/store";

const Stack = createNativeStackNavigator();

function AppContent() {
  const webViewRef = useRef<WebView>(null);
  const [, setIdentity] = useAtom(identityAtom);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  // WHY: Bind the WebView instance to the ArchonBridge service
  useEffect(() => {
    if (webViewRef.current) {
      ArchonBridge.setWebViewRef(webViewRef.current);
    }
  }, [webViewRef]);

  // WHY: Initialize the Attention Model weights once the Wasm bridge is ready
  useEffect(() => {
    async function initAttention() {
      try {
        await ArchonBridge.waitForReady();
        const { AttentionModelLoader } = require("./src/services/AttentionModelLoader");
        await AttentionModelLoader.loadModel();
      } catch (err) {
        // console.error("Failed to load attention model weights:", err);
      }
    }
    initAttention();
  }, []);

  // WHY: Determines if the user has already onboarded by looking for key materials
  useEffect(() => {
    async function checkIdentity() {
      try {
        const seed = await SecureStoreService.getMasterSeed();
        if (seed) {
          // In Phase 1, if onboarding seed exists, navigate directly to Dashboard.
          // In a real run, Wasm will boot and we will generate keys.
          setInitialRoute("Dashboard");
        } else {
          setInitialRoute("Onboarding");
        }
      } catch (err) {
        setInitialRoute("Onboarding");
      }
    }
    checkIdentity();
  }, []);

  if (initialRoute === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: "#111827" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontWeight: "bold" },
            contentStyle: { backgroundColor: "#0b0f19" }
          }}
        >
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ title: "Twin Dashboard", headerLeft: () => null }}
          />
          <Stack.Screen 
            name="RecoverySetup" 
            component={RecoverySetupScreen} 
            options={{ title: "Identity Recovery" }}
          />
          <Stack.Screen 
            name="Preferences" 
            component={PreferencesScreen} 
            options={{ title: "Style Preferences" }}
          />
          <Stack.Screen 
            name="ActivityLog" 
            component={ActivityLogScreen} 
            options={{ title: "Activity Log" }}
          />
          <Stack.Screen 
            name="Family" 
            component={FamilyScreen} 
            options={{ title: "Family Swarm" }}
          />
          <Stack.Screen 
            name="FinanceDashboard" 
            component={FinanceDashboardScreen} 
            options={{ title: "Finance Dashboard" }}
          />
          <Stack.Screen 
            name="HealthDashboard" 
            component={HealthDashboardScreen} 
            options={{ title: "Health Dashboard" }}
          />
          <Stack.Screen 
            name="HomeAutomation" 
            component={HomeAutomationScreen} 
            options={{ title: "Smart Home" }}
          />
          <Stack.Screen 
            name="SocialDashboard" 
            component={SocialDashboardScreen} 
            options={{ title: "Social Dashboard" }}
          />
          <Stack.Screen 
            name="CredentialManager" 
            component={CredentialManagerScreen} 
            options={{ title: "Credentials Manager" }}
          />
          <Stack.Screen 
            name="Voice" 
            component={VoiceScreen} 
            options={{ title: "Voice Assistant" }}
          />
          <Stack.Screen 
            name="SpatialView" 
            component={SpatialViewScreen} 
            options={{ title: "Spatial 3D View" }}
          />
          <Stack.Screen 
            name="TravelDashboard" 
            component={TravelDashboardScreen} 
            options={{ title: "Travel Concierge" }}
          />
          <Stack.Screen 
            name="ReflectionReport" 
            component={ReflectionReportScreen} 
            options={{ title: "Reflection Analytics" }}
          />
          <Stack.Screen 
            name="SkillMarketplace" 
            component={SkillMarketplaceScreen} 
            options={{ title: "Skill Marketplace" }}
          />
          <Stack.Screen 
            name="RSIReview" 
            component={RSIReviewScreen} 
            options={{ title: "RSI Self-Healing Review" }}
          />
          <Stack.Screen 
            name="DeFiDashboard" 
            component={DeFiDashboardScreen} 
            options={{ title: "DeFi Investment Portfolios" }}
          />
          <Stack.Screen 
            name="DeepfakeAlerts" 
            component={DeepfakeAlertsScreen} 
            options={{ title: "Deepfake Forensics Alerts" }}
          />
          <Stack.Screen 
            name="GDPRSettings" 
            component={GDPRSettingsScreen} 
            options={{ title: "Privacy & GDPR Wiper" }}
          />
          <Stack.Screen 
            name="TeamManagement" 
            component={TeamManagementScreen} 
            options={{ title: "Team Management" }}
          />
          <Stack.Screen 
            name="AdminDashboard" 
            component={AdminDashboardScreen} 
            options={{ title: "Admin Dashboard" }}
          />
          <Stack.Screen 
            name="SSOLogin" 
            component={SSOLoginScreen} 
            options={{ title: "SSO Login", headerShown: false }}
          />

        </Stack.Navigator>
      </NavigationContainer>

      {/* Invisible WebView carrying out the Rust Wasm tasks */}
      <View style={styles.hidden}>
        <WebView
          ref={webViewRef}
          source={require("./assets/wasm_sandbox.html")}
          onMessage={(e) => ArchonBridge.handleMessage(e.nativeEvent.data)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          originWhitelist={["*"]}
        />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <Provider>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  loader: {
    flex: 1,
    backgroundColor: "#0b0f19",
    alignItems: "center",
    justifyContent: "center",
  },
  hidden: {
    width: 0,
    height: 0,
    opacity: 0,
    position: "absolute",
  }
});
