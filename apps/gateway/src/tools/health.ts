// WHY: Mock Google Fit / Apple Health simulator for heart rate logs.
export const healthTools = {
  manifest: [
    {
      name: "health.get_heart_rate_logs",
      description: "Retrieve simulated heart rate data logs for an account",
      inputSchema: {
        type: "object",
        properties: {
          accountId: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" }
        },
        required: ["accountId"]
      }
    }
  ],

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "health.get_heart_rate_logs":
        return {
          heart_rates: [72.0, 75.0, 71.0, 125.0, 73.0]
        };
      default:
        throw new Error(`Unknown health tool: ${toolName}`);
    }
  }
};
