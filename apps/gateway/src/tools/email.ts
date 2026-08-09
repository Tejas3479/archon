// WHY: Mock MCP email tool definitions and handlers to support UC2 (flight delay refund) in Phase 1.
export const emailTools = {
  manifest: [
    {
      name: "email.search",
      description: "Search email messages based on a query",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" }
        },
        required: ["query"]
      }
    },
    {
      name: "email.read",
      description: "Read details of a specific email message by ID",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "email.draft",
      description: "Draft a new email message",
      inputSchema: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" }
        },
        required: ["to", "subject", "body"]
      }
    },
    {
      name: "email.send",
      description: "Send a draft or new email message",
      inputSchema: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" }
        },
        required: ["to", "subject", "body"]
      }
    }
  ],

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "email.search":
        return {
          messages: [
            {
              id: "msg_12345",
              subject: "Urgent: Your Flight AA234 is Delayed",
              snippet: "We regret to inform you that your flight is delayed by 3 hours. Booking ref: GJKD8S."
            }
          ]
        };

      case "email.read":
        if (args.id === "msg_12345") {
          return {
            id: "msg_12345",
            from: "notifications@airline.com",
            to: "user@archon.me",
            subject: "Urgent: Your Flight AA234 is Delayed",
            body: "Dear Passenger, we regret to inform you that your flight AA234 from JFK to LAX is delayed by 3 hours. Booking ref: GJKD8S. We apologize for the inconvenience.",
            timestamp: Date.now() - 3600000
          };
        }
        return { error: "Message not found" };

      case "email.draft":
        return {
          id: "draft_67890",
          to: args.to,
          subject: args.subject,
          body: args.body,
          status: "drafted"
        };

      case "email.send":
        return {
          success: true,
          messageId: "msg_sent_9999",
          status: "sent"
        };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
};
