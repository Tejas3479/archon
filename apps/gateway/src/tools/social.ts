// WHY: Regex-based natural language parser mock tools for social messages.
export const socialTools = {
  manifest: [
    {
      name: "social.get_recent_messages",
      description: "Retrieve recent communication history logs for event analysis",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number" }
        }
      }
    }
  ],

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "social.get_recent_messages":
        return {
          messages: [
            { sender: "Mom", text: "Happy birthday to you, hope it's great!" },
            { sender: "John", text: "Congrats on the new job promotion!" },
            { sender: "Alice", text: "Can't wait for the wedding next week!" },
            { sender: "Bob", text: "What are you doing today?" }
          ]
        };
      default:
        throw new Error(`Unknown social tool: ${toolName}`);
    }
  }
};
