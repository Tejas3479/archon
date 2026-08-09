// WHY: Loader service that imports the pre-trained weights from JSON and boots the model in Wasm.
import { ArchonBridge } from "./ArchonBridge";
import modelWeights from "../../assets/attention_model.json";

export const AttentionModelLoader = {
  async loadModel(): Promise<void> {
    try {
      const weightsStr = JSON.stringify(modelWeights);
      await ArchonBridge.initAttentionModel(weightsStr);
      // console.log("Attention model loaded successfully");
    } catch (err) {
      // console.error("Failed to load attention model weights:", err);
      throw err;
    }
  }
};
