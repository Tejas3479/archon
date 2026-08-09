import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useAtom } from "jotai";
import { annealLogsAtom, lastAnnealDeltaAtom } from "../store";
import { ArchonBridge } from "../services/ArchonBridge";

// WHY: ActivityLogScreen displays tracing for ANNEAL healing events, delta verification, and Wasm sandbox execution.
// It also provides manual controls to run mock self-healing simulations.
export const ActivityLogScreen = () => {
  const [logs, setLogs] = useAtom(annealLogsAtom);
  const [, setLastAnnealDelta] = useAtom(lastAnnealDeltaAtom);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // WHY: Simulates the ANNEAL engine repair cycle for tool parameter renaming
  const runParameterRenameSimulation = async () => {
    try {
      addLog("Starting ANNEAL self-healing simulation for parameter renaming...");
      
      const failures = [
        {
          error_msg: "Tool call failed: parameter 'id' renamed to 'message_id'",
          timestamp: Date.now(),
        }
      ];

      addLog("Analyzing failure records in Wasm core...");
      const deltaJson = await ArchonBridge.annealAnalyze(JSON.stringify(failures));
      setLastAnnealDelta(JSON.parse(deltaJson));
      addLog(`ANNEAL delta generated: ${deltaJson}`);

      addLog("Verifying delta invariants and applying to orchestration graph...");
      const success = await ArchonBridge.applyDelta(deltaJson);
      
      if (success) {
        addLog("✓ Graph delta applied successfully. Invariant checks passed!");
        Alert.alert("Simulation Success", "Parameter renamed delta applied successfully!");
      } else {
        addLog("✗ Delta failed verification checks.");
      }
    } catch (err: any) {
      addLog(`✗ Error during simulation: ${err.message}`);
      Alert.alert("Simulation Failed", err.message);
    }
  };

  // WHY: Simulates the ANNEAL engine repair cycle for tool deprecation (modifies nodes and edges)
  const runToolDeprecationSimulation = async () => {
    try {
      addLog("Starting ANNEAL self-healing simulation for tool deprecation...");
      
      const failures = [
        {
          error_msg: "tool 'email.read' is deprecated, use 'new_email.read'",
          timestamp: Date.now(),
        }
      ];

      addLog("Analyzing failure records in Wasm core...");
      const deltaJson = await ArchonBridge.annealAnalyze(JSON.stringify(failures));
      setLastAnnealDelta(JSON.parse(deltaJson));
      addLog(`ANNEAL delta generated: ${deltaJson}`);

      addLog("Verifying delta invariants and applying to orchestration graph...");
      const success = await ArchonBridge.applyDelta(deltaJson);
      
      if (success) {
        addLog("✓ Graph delta applied successfully. Invariant checks passed!");
        Alert.alert("Simulation Success", "Tool deprecation delta applied successfully!");
      } else {
        addLog("✗ Delta failed verification checks.");
      }
    } catch (err: any) {
      addLog(`✗ Error during simulation: ${err.message}`);
      Alert.alert("Simulation Failed", err.message);
    }
  };

  // WHY: Simulates Wasm sandbox boundary checks (runs safe module vs resource exhausting module)
  const runSandboxSimulation = async () => {
    try {
      addLog("Booting recursive Wasm self-improvement sandbox...");
      
      // Minimal safe Wasm bytes (equivalent to returning 50)
      const safeWasmBytes = [
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 127, 3, 2, 1, 0, 7, 7, 1, 3, 114, 117, 110, 0, 0, 10, 9, 1, 7, 0, 65, 50, 11,
      ];
      
      addLog("Executing Wasm module under memory (100MB) and fuel (10M) limits...");
      const result = await ArchonBridge.sandboxRun(safeWasmBytes, "{}");
      addLog(`Sandbox execution result: ${result}`);
      Alert.alert("Sandbox Run Complete", result);
    } catch (err: any) {
      addLog(`✗ Sandbox violation: ${err.message}`);
      Alert.alert("Sandbox Error", err.message);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={runParameterRenameSimulation}>
          <Text style={styles.actionBtnText}>Rename Repair</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={runToolDeprecationSimulation}>
          <Text style={styles.actionBtnText}>Deprecate Repair</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={runSandboxSimulation}>
          <Text style={styles.actionBtnText}>Run Wasm</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>System Execution Logs</Text>
        <TouchableOpacity onPress={clearLogs}>
          <Text style={styles.clearBtnText}>CLEAR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs generated. Tap one of the actions above to run simulations.</Text>
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
    padding: 20,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  clearBtnText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
  },
  logContainer: {
    flex: 1,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
  },
  logText: {
    color: "#a7f3d0",
    fontFamily: "Courier",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
