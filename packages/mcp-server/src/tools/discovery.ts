// WHY: Holds the list of authorized tools for dynamic discovery by third-party agents
export const authorizedTools = [
  {
    name: "email.read",
    description: "Read details of a specific email message by ID",
    scope: "email"
  },
  {
    name: "calendar.list_events",
    description: "List calendar events for a specific time range",
    scope: "calendar"
  },
  {
    name: "defi.get_balance",
    description: "Retrieve token balance of the wallet",
    scope: "defi:read"
  },
  {
    name: "defi.suggest_swap",
    description: "Suggest a token swap based on price drop/rules",
    scope: "defi:write"
  },
  {
    name: "deepfake.check",
    description: "Verify if a media asset has synthetic content",
    scope: "deepfake"
  }
];
