// WHY: ArchonBridge routes calls between React Native JavaScript thread and Rust Wasm running in the Webview.
// It maps request IDs to promises and resolves them once the Wasm Webview sends postMessage events.

let webViewRef: any = null;
const pendingPromises = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
let isWasmReady = false;
let wasmInitPromise: { resolve: () => void; reject: (err: any) => void } | null = null;

const initWasmWaiter = new Promise<void>((resolve, reject) => {
  wasmInitPromise = { resolve, reject };
});

export const ArchonBridge = {
  // WHY: Binds the React Native WebView instance ref to the bridge service
  setWebViewRef(ref: any) {
    webViewRef = ref;
  },

  // WHY: Handles incoming postMessage string events from the Webview and resolves corresponding promises
  handleMessage(eventDataStr: string) {
    try {
      const data = JSON.parse(eventDataStr);
      const { event, id, result, error } = data;

      if (event === "ready") {
        isWasmReady = true;
        if (wasmInitPromise) {
          wasmInitPromise.resolve();
        }
        return;
      }

      if (event === "error" && !id) {
        if (wasmInitPromise) {
          wasmInitPromise.reject(new Error(error));
        }
        return;
      }

      const pending = pendingPromises.get(id);
      if (!pending) return;

      pendingPromises.delete(id);

      if (event === "response") {
        pending.resolve(result);
      } else {
        pending.reject(new Error(error || "Unknown bridge execution error"));
      }
    } catch (err) {
      // JSON parsing or state errors are caught here
    }
  },

  // WHY: Yields only when the Wasm core has completed loading and is ready for commands
  async waitForReady(): Promise<void> {
    if (isWasmReady) return;
    return initWasmWaiter;
  },

  // WHY: Request new Ed25519 identity keys inside the enclave
  async generateKeys(): Promise<string> {
    await this.waitForReady();
    return this.send("generateKeys");
  },

  // WHY: Invokes the AES-256-GCM encryption in Rust
  async encrypt(plaintext: string): Promise<number[]> {
    await this.waitForReady();
    return this.send("encrypt", plaintext);
  },

  // WHY: Invokes the AES-256-GCM decryption in Rust
  async decrypt(ciphertextBytes: number[]): Promise<string> {
    await this.waitForReady();
    return this.send("decrypt", ciphertextBytes);
  },

  // WHY: Feeds sensor events to the Rust detector
  async processEvent(eventJson: string): Promise<string> {
    await this.waitForReady();
    return this.send("processEvent", eventJson);
  },

  // WHY: Invokes ANNEAL self-healing failure analysis in Rust
  async annealAnalyze(jsonFailures: string): Promise<string> {
    await this.waitForReady();
    return this.send("annealAnalyze", jsonFailures);
  },

  // WHY: Applies verified GraphDelta update to workflow graph
  async applyDelta(jsonDelta: string): Promise<boolean> {
    await this.waitForReady();
    return this.send("applyDelta", jsonDelta);
  },

  // WHY: Reads active user style preference weight
  async getPreference(key: string): Promise<number> {
    await this.waitForReady();
    return this.send("getPreference", key);
  },

  // WHY: Updates user style preference weight with propagates
  async updatePreference(key: string, delta: number): Promise<boolean> {
    await this.waitForReady();
    return this.send("updatePreference", { key, delta });
  },

  // WHY: Initializes pre-trained weights for feedforward attention model
  async initAttentionModel(jsonWeights: string): Promise<boolean> {
    await this.waitForReady();
    return this.send("initAttentionModel", jsonWeights);
  },

  // WHY: Runs attention budget interrupt estimation on-device
  async predictAttention(jsonInput: string): Promise<number> {
    await this.waitForReady();
    return this.send("predictAttention", jsonInput);
  },

  // WHY: Executes sandboxed untrusted Wasm module with resource limits
  async sandboxRun(wasmBytes: number[], inputJson: string): Promise<string> {
    await this.waitForReady();
    return this.send("sandboxRun", { wasm_bytes: wasmBytes, input_json: inputJson });
  },

  async swarmSendMessage(peerPubkeyHex: string, payloadJson: string): Promise<string> {
    await this.waitForReady();
    return this.send("swarmSendMessage", { peerPubkeyHex, payloadJson });
  },

  async swarmReceiveMessage(peerPubkeyHex: string, ciphertextHex: string): Promise<string> {
    await this.waitForReady();
    return this.send("swarmReceiveMessage", { peerPubkeyHex, ciphertextHex });
  },

  async swarmAuthorizePeer(peerPubkeyHex: string, scope: string): Promise<void> {
    await this.waitForReady();
    return this.send("swarmAuthorizePeer", { peerPubkeyHex, scope });
  },

  async swarmCheckPeerAuthorized(peerPubkeyHex: string, scope: string): Promise<boolean> {
    await this.waitForReady();
    return this.send("swarmCheckPeerAuthorized", { peerPubkeyHex, scope });
  },

  async swarmGetPublicKey(): Promise<string> {
    await this.waitForReady();
    return this.send("swarmGetPublicKey");
  },

  async issueCredential(id: string, subjectPubkeyHex: string, claimsJson: string): Promise<string> {
    await this.waitForReady();
    return this.send("issueCredential", { id, subjectPubkeyHex, claimsJson });
  },

  async verifyCredential(credentialJson: string, issuerPubkeyHex: string): Promise<boolean> {
    await this.waitForReady();
    return this.send("verifyCredential", { credentialJson, issuerPubkeyHex });
  },

  async createPresentation(credentialsJson: string, subjectPubkeyHex: string): Promise<string> {
    await this.waitForReady();
    return this.send("createPresentation", { credentialsJson, subjectPubkeyHex });
  },

  async verifyPresentation(presentationJson: string, subjectPubkeyHex: string): Promise<boolean> {
    await this.waitForReady();
    return this.send("verifyPresentation", { presentationJson, subjectPubkeyHex });
  },

  async processDomainIntent(domain: string, action: string, jsonVariables: string): Promise<string> {
    await this.waitForReady();
    return this.send("processDomainIntent", { domain, action, jsonVariables });
  },

  async processVoice(text: string): Promise<string> {
    await this.waitForReady();
    return this.send("processVoice", text);
  },

  async getSpatialScene(): Promise<string> {
    await this.waitForReady();
    return this.send("getSpatialScene");
  },

  async triggerReflection(): Promise<string> {
    await this.waitForReady();
    return this.send("triggerReflection");
  },

  async travelProcessIntent(jsonVariables: string): Promise<string> {
    await this.waitForReady();
    return this.send("travelProcessIntent", jsonVariables);
  },

  async rsiRun(jsonFailures: string, wasmBytes: number[]): Promise<string> {
    await this.waitForReady();
    return this.send("rsiRun", { jsonFailures, wasmBytes });
  },

  async defiGetBalance(): Promise<string> {
    await this.waitForReady();
    return this.send("defiGetBalance");
  },

  async defiSuggestSwap(from: string, to: string, amount: number): Promise<string> {
    await this.waitForReady();
    return this.send("defiSuggestSwap", { from, to, amount });
  },

  async deepfakeCheck(mediaHash: string): Promise<number> {
    await this.waitForReady();
    return this.send("deepfakeCheck", mediaHash);
  },

  async gdprWipe(userId: string): Promise<string> {
    await this.waitForReady();
    return this.send("gdprWipe", userId);
  },

  async fheEncryptEmbedding(plain: number[]): Promise<number[]> {
    await this.waitForReady();
    return this.send("fheEncryptEmbedding", plain);
  },

  async fheDecryptResult(encrypted: number[]): Promise<number[]> {
    await this.waitForReady();
    return this.send("fheDecryptResult", encrypted);
  },

  async devAgentRequest(targetLanguage: string, description: string, failureContext: string): Promise<any> {
    await this.waitForReady();
    return this.send("devAgentRequest", { targetLanguage, description, failureContext });
  },




  // Helper method to format request payloads and register pending promise handlers
  send(action: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!webViewRef) {
        return reject(new Error("WebView reference not set in ArchonBridge"));
      }

      const id = Math.random().toString(36).substring(2, 11);
      pendingPromises.set(id, { resolve, reject });

      const msg = JSON.stringify({ id, action, payload });
      webViewRef.postMessage(msg);
    });
  }
};
