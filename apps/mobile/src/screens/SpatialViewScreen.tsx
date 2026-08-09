import React, { useRef, useEffect } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useAtom } from "jotai";
import { ArchonBridge } from "../services/ArchonBridge";
import { spatialSceneAtom } from "../store";

export default function SpatialViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [scene, setScene] = useAtom(spatialSceneAtom);

  // Fetch initial spatial scene on mount
  useEffect(() => {
    async function loadInitialScene() {
      try {
        const sceneStr = await ArchonBridge.getSpatialScene();
        const parsed = JSON.parse(sceneStr);
        setScene(parsed);
      } catch (err) {
        console.warn("Failed to load initial spatial scene:", err);
      }
    }
    loadInitialScene();
  }, []);

  // Sync Jotai atom scene changes down into Three.js web view
  useEffect(() => {
    if (webViewRef.current && scene) {
      const msg = JSON.stringify({
        action: "update_scene",
        scene: scene,
      });
      webViewRef.current.postMessage(msg);
    }
  }, [scene]);

  return (
    <View style={styles.container}>
      <View style={styles.overlayText}>
        <Text style={styles.overlayTitle}>Spatial 3D Enclave View</Text>
        <Text style={styles.overlayDesc}>
          Tilt device to rotate camera (Gyro). Automatically rotates if inactive.
        </Text>
      </View>

      <WebView
        ref={webViewRef}
        source={require("../../assets/spatial_renderer.html")}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={["*"]}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
  overlayText: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
    pointerEvents: "none",
  },
  overlayTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  overlayDesc: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#030712",
    justifyContent: "center",
    alignItems: "center",
  },
});
