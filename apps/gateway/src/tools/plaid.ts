// WHY: Mock Plaid financial integration for tracking transaction histories and account balances.
export const plaidTools = {
  manifest: [
    {
      name: "plaid.get_transactions",
      description: "Retrieve transaction logs for an account",
      inputSchema: {
        type: "object",
        properties: {
          accountId: { type: "string" },
          startDate: { type: "string", description: "YYYY-MM-DD format" },
          endDate: { type: "string", description: "YYYY-MM-DD format" }
        },
        required: ["accountId", "startDate", "endDate"]
      }
    },
    {
      name: "plaid.get_balance",
      description: "Retrieve the current balance of an account",
      inputSchema: {
        type: "object",
        properties: {
          accountId: { type: "string" }
        },
        required: ["accountId"]
      }
    }
  ],

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "plaid.get_transactions":
        return {
          transactions: [
            {
              transaction_id: "tx_9876",
              account_id: args.accountId,
              amount: 450.00,
              merchant: "American Airlines",
              date: args.startDate,
              category: ["Travel", "Airlines"]
            }
          ]
        };

      case "plaid.get_balance":
        return {
          account_id: args.accountId,
          balances: {
            available: 2450.50,
            current: 2500.00,
            iso_currency_code: "USD"
          }
        };

      default:
        throw new Error(`Unknown plaid tool: ${toolName}`);
    }
  }
};
