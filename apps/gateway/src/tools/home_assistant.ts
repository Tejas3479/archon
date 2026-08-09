// WHY: Home Assistant device state simulator tools.
export const homeAssistantTools = {
  manifest: [
    {
      name: "home_assistant.get_temperature_logs",
      description: "Retrieve historical temperature adjustment logs from smart thermostat",
      inputSchema: {
        type: "object",
        properties: {
          deviceId: { type: "string" }
        },
        required: ["deviceId"]
      }
    }
  ],

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "home_assistant.get_temperature_logs":
        return {
          temperature_adjustments: [
            { temp: 72.0, time: "10:00" },
            { temp: 72.0, time: "12:00" },
            { temp: 68.0, time: "14:00" },
            { temp: 72.0, time: "16:00" }
          ]
        };
      default:
        throw new Error(`Unknown home assistant tool: ${toolName}`);
    }
  }
};
