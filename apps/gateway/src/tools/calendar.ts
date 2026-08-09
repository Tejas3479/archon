// WHY: Mock Google Calendar MCP tools for scheduling checkups.
export const calendarTools = {
  manifest: [
    {
      name: "calendar.list_events",
      description: "List calendar events for a specific time range",
      inputSchema: {
        type: "object",
        properties: {
          timeMin: { type: "string", description: "ISO format start time" },
          timeMax: { type: "string", description: "ISO format end time" }
        },
        required: ["timeMin", "timeMax"]
      }
    },
    {
      name: "calendar.create_event",
      description: "Create a new event on the user's calendar",
      inputSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          startTime: { type: "string", description: "ISO format start time" },
          endTime: { type: "string", description: "ISO format end time" },
          description: { type: "string" }
        },
        required: ["summary", "startTime", "endTime"]
      }
    },
    {
      name: "calendar.read",
      description: "Read details of a specific calendar event by ID",
      inputSchema: {
        type: "object",
        properties: {
          eventId: { type: "string", description: "The unique event ID" }
        },
        required: ["eventId"]
      }
    },
    {
      name: "calendar.delete",
      description: "Delete an event from the calendar by ID",
      inputSchema: {
        type: "object",
        properties: {
          eventId: { type: "string", description: "The unique event ID to delete" }
        },
        required: ["eventId"]
      }
    }
  ],

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "calendar.list_events":
        return {
          events: [
            {
              id: "evt_1001",
              summary: "Flight AA234 (JFK to LAX)",
              start: args.timeMin,
              end: args.timeMax,
              description: "Boarding flight home"
            }
          ]
        };

      case "calendar.create_event":
        return {
          success: true,
          eventId: "evt_2002",
          summary: args.summary,
          startTime: args.startTime,
          endTime: args.endTime,
          status: "confirmed"
        };

      case "calendar.read":
        return {
          id: args.eventId,
          summary: "Flight AA234 (JFK to LAX)",
          description: "Boarding flight home",
          start: "2026-06-07T10:00:00Z",
          end: "2026-06-07T16:00:00Z"
        };

      case "calendar.delete":
        return {
          success: true,
          deletedEventId: args.eventId
        };

      default:
        throw new Error(`Unknown calendar tool: ${toolName}`);
    }
  }
};
