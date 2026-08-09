import * as SecureStore from "expo-secure-store";

const SEED_KEY = "archon_master_seed_entropy";
const BIOMETRIC_PREF_KEY = "archon_biometric_enabled";

// WHY: SecureStore guarantees cryptographic safety for identity keys by leveraging OS Secure Enclaves/StrongBox
export const SecureStoreService = {
  // WHY: Saves the generated private entropy seed in the secure enclave
  async setMasterSeed(seedHex: string): Promise<void> {
    await SecureStore.setItemAsync(SEED_KEY, seedHex, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
  },

  // WHY: Loads the master key seed to initialize cryptographic operations
  async getMasterSeed(): Promise<string | null> {
    return await SecureStore.getItemAsync(SEED_KEY);
  },

  // WHY: Revoke security keys (e.g. factory reset digital twin)
  async deleteMasterSeed(): Promise<void> {
    await SecureStore.deleteItemAsync(SEED_KEY);
  },

  // WHY: Save user preference for biometric logins
  async setBiometricPreference(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, enabled ? "true" : "false");
  },

  // WHY: Check if biometric authentication should be forced on startup
  async getBiometricPreference(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(BIOMETRIC_PREF_KEY);
    return val === "true";
  }
};
