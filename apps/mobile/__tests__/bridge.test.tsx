import { ArchonBridge } from "../src/services/ArchonBridge";

describe("ArchonBridge WebView Message Broker", () => {
  let mockPostMessage: any;
  let mockWebView: any;

  beforeEach(() => {
    mockPostMessage = jest.fn();
    mockWebView = {
      postMessage: mockPostMessage
    };
    ArchonBridge.setWebViewRef(mockWebView);
  });

  it("queues actions and resolves promises when Wasm responds", async () => {
    // 1. Trigger ready event so bridge stops blocking on waitForReady()
    ArchonBridge.handleMessage(JSON.stringify({ event: "ready" }));

    // 2. Trigger generateKeys call
    const keyPromise = ArchonBridge.generateKeys();

    // Yield to the microtask queue to allow the async generateKeys function to advance past waitForReady()
    await Promise.resolve();

    // 3. Verify postMessage was executed on WebView
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    
    const sentData = JSON.parse(mockPostMessage.mock.calls[0][0]);
    expect(sentData.action).toBe("generateKeys");
    expect(sentData.id).toBeDefined();

    // 4. Simulate response from Wasm running inside WebView
    const mockPubKeyHex = "a".repeat(64);
    ArchonBridge.handleMessage(JSON.stringify({
      id: sentData.id,
      event: "response",
      result: mockPubKeyHex
    }));

    // 5. Verify the promise resolves with the correct result
    const result = await keyPromise;
    expect(result).toBe(mockPubKeyHex);
  });

  it("rejects promises if Wasm responds with an error", async () => {
    ArchonBridge.handleMessage(JSON.stringify({ event: "ready" }));

    const encryptPromise = ArchonBridge.encrypt("secret");

    // Yield to the microtask queue to allow encrypt to advance to postMessage
    await Promise.resolve();

    const sentData = JSON.parse(mockPostMessage.mock.calls[0][0]);
    
    // Simulate error response from Wasm
    ArchonBridge.handleMessage(JSON.stringify({
      id: sentData.id,
      event: "error",
      error: "Cryptographic failure"
    }));

    await expect(encryptPromise).rejects.toThrow("Cryptographic failure");
  });
});
