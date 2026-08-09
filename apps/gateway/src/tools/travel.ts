// WHY: Simulated flight searches, boarding pass auto check-ins, and price drop alerts.
export const travelTools = {
  manifest: [
    {
      name: "travel.search_flights",
      description: "Search for available flights to a specific destination",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string" },
          departureDate: { type: "string" }
        },
        required: ["destination"]
      }
    },
    {
      name: "travel.auto_checkin",
      description: "Trigger auto check-in inside the 24-hour departure window",
      inputSchema: {
        type: "object",
        properties: {
          bookingReference: { type: "string" }
        },
        required: ["bookingReference"]
      }
    },
    {
      name: "travel.monitor_price_drop",
      description: "Checks if a booked flight price has dropped",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string" },
          originalPrice: { type: "number" }
        },
        required: ["destination", "originalPrice"]
      }
    }
  ],

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "travel.search_flights":
        return {
          flights: [
            { flight_no: "AA234", airline: "American Airlines", price: 350.00, destination: args.destination },
            { flight_no: "DL892", airline: "Delta Airlines", price: 380.00, destination: args.destination }
          ]
        };
      case "travel.auto_checkin":
        return {
          checkin_successful: true,
          booking_reference: args.bookingReference,
          seat: "14B",
          boarding_pass_url: "https://archon-gateway.dev/passes/boarding_pass_AA234.pdf",
          message: `Auto Check-in Successful for Booking ${args.bookingReference}. Assigned Seat: 14B.`
        };
      case "travel.monitor_price_drop":
        const originalPrice = args.originalPrice || 350.00;
        if (originalPrice > 300.0) {
          const newPrice = 280.00;
          return {
            price_drop_detected: true,
            new_price: newPrice,
            savings: originalPrice - newPrice,
            flight_no: "AA234",
            message: `Price Drop Alert: Flight AA234 is now available for $280.00 (saving you $70.00).`
          };
        } else {
          return {
            price_drop_detected: false,
            message: "Flight prices are currently stable."
          };
        }
      default:
        throw new Error(`Unknown travel tool: ${toolName}`);
    }
  }
};
