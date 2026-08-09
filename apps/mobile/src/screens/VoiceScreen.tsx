import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useAtom } from "jotai";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { ArchonBridge } from "../services/ArchonBridge";
import { voiceLogsAtom, awaitingVoiceParamAtom, travelStateAtom, preferencesAtom } from "../store";

export default function VoiceScreen() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const [logs, setLogs] = useAtom(voiceLogsAtom);
  const [awaitingParam, setAwaitingParam] = useAtom(awaitingVoiceParamAtom);
  const [, setTravelState] = useAtom(travelStateAtom);
  const [, setPreferences] = useAtom(preferencesAtom);

  // Bind speech recognition events
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    if (event.results && event.results[0]) {
      setTranscript(event.results[0].transcript);
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    console.warn("Speech Recognition Error:", event.error, event.message);
    setIsListening(false);
  });

  const checkPermissionsAndStart = async () => {
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission Denied", "Microphone access is required for speech recognition. Falling back to text-only mode.");
        return;
      }
      setTranscript("");
      setIsListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
      });
    } catch (err) {
      console.warn("Speech init failed:", err);
      // Fallback
      setIsListening(false);
    }
  };

  const stopListeningAndProcess = async () => {
    try {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      if (transcript.trim()) {
        await handleProcessText(transcript);
      }
    } catch (err) {
      console.warn("Speech stop failed:", err);
    }
  };

  const handleProcessText = async (text: string) => {
    if (!text.trim()) return;

    // Append User Log
    setLogs((prev) => [...prev, { speaker: "user", text }]);
    setInputText("");
    setTranscript("");

    try {
      // Invoke Wasm Voice Processor
      const resStr = await ArchonBridge.processVoice(text);
      const res = JSON.parse(resStr);

      // Append Archon Log
      setLogs((prev) => [...prev, { speaker: "archon", text: res.message }]);

      if (res.clarification_needed) {
        setAwaitingParam(res.awaiting_parameter);
      } else {
        setAwaitingParam(null);
        if (res.intent_detected && res.intent) {
          const intentObj = res.intent;
          
          // Execute/Mock local actions depending on domain
          if (intentObj.domain === "travel") {
            if (intentObj.action === "search_flights") {
              const vars = JSON.stringify({ action: "search_flights", destination: intentObj.parameters.destination });
              const travelResStr = await ArchonBridge.travelProcessIntent(vars);
              const travelRes = JSON.parse(travelResStr);
              setTravelState((prev) => ({
                ...prev,
                flights: travelRes.flights || [],
              }));
              
              // Automatically trigger monitoring / price-drop demo
              setTimeout(async () => {
                const monitorVars = JSON.stringify({ action: "monitor_price_drop", destination: intentObj.parameters.destination, original_price: 350.0 });
                const monitorResStr = await ArchonBridge.travelProcessIntent(monitorVars);
                const monitorRes = JSON.parse(monitorResStr);
                if (monitorRes.price_drop_detected) {
                  setTravelState((prev) => ({
                    ...prev,
                    priceAlerts: [...prev.priceAlerts, monitorRes.message],
                  }));
                  setLogs((prev) => [...prev, { speaker: "archon", text: monitorRes.message }]);
                }
              }, 1500);
            }
          } else if (intentObj.domain === "home") {
            // Update preferences/status if thermostat/lights modified
            if (intentObj.parameters.device === "thermostat") {
              setPreferences((prev) => ({ ...prev, risk_averse: 0.8 }));
            }
          }
        }
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, { speaker: "archon", text: `Error: ${err.message}` }]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Voice Enclave Assistant</Text>
        <Text style={styles.subtitle}>Native Audio Processing & NLP Dialogue</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tap the mic button and say something like:</Text>
            <Text style={styles.suggestionText}>"I want to book a flight to Paris"</Text>
            <Text style={styles.suggestionText}>"Order dinner"</Text>
            <Text style={styles.suggestionText}>"Check my heart rate"</Text>
          </View>
        ) : (
          logs.map((log, index) => (
            <View
              key={index}
              style={[
                styles.bubble,
                log.speaker === "user" ? styles.userBubble : styles.archonBubble,
              ]}
            >
              <Text style={styles.bubbleSpeaker}>
                {log.speaker === "user" ? "You" : "Archon"}
              </Text>
              <Text style={styles.bubbleText}>{log.text}</Text>
            </View>
          ))
        )}

        {transcript ? (
          <View style={[styles.bubble, styles.userBubble, styles.transcribingBubble]}>
            <Text style={styles.bubbleSpeaker}>Listening...</Text>
            <Text style={styles.bubbleText}>{transcript}</Text>
          </View>
        ) : null}
      </ScrollView>

      {awaitingParam && (
        <View style={styles.clarificationAlert}>
          <Text style={styles.clarificationAlertText}>
            Awaiting parameter: <Text style={styles.bold}>{awaitingParam}</Text>
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            placeholder={
              awaitingParam ? `Clarify ${awaitingParam}...` : "Type commands or talk..."
            }
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleProcessText(inputText)}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleProcessText(inputText)}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={isListening ? stopListeningAndProcess : checkPermissionsAndStart}
        >
          <Text style={styles.micButtonText}>
            {isListening ? "🛑 STOP & PARSE" : "🎙️ START SPEECH"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  header: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    alignItems: "center",
  },
  title: {
    color: "#f3f4f6",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
    paddingVertical: 50,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  suggestionText: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "500",
    marginVertical: 4,
    fontStyle: "italic",
  },
  bubble: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
  },
  archonBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  transcribingBubble: {
    opacity: 0.7,
  },
  bubbleSpeaker: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bubbleText: {
    color: "#f3f4f6",
    fontSize: 14,
    lineHeight: 20,
  },
  clarificationAlert: {
    backgroundColor: "#7c2d12",
    padding: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#9a3412",
  },
  clarificationAlertText: {
    color: "#ffedd5",
    fontSize: 12,
  },
  bold: {
    fontWeight: "700",
  },
  inputContainer: {
    backgroundColor: "#111827",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  textInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f3f4f6",
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  micButton: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  micButtonActive: {
    backgroundColor: "#ef4444",
  },
  micButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
