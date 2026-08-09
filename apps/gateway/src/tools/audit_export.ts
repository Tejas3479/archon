// WHY: Formats compliance audit logs into standard downloadable CSV sheets.

export interface AuditRecord {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export const mockAuditLogs: AuditRecord[] = [
  {
    id: "log_1",
    userId: "user_admin",
    action: "approve_swap",
    details: "Approved swap of 1.5 ETH to USDC",
    createdAt: "2026-06-07T14:20:00.000Z"
  },
  {
    id: "log_2",
    userId: "user_member_1",
    action: "trigger_reflection",
    details: "Executed weekly self-reflection audit",
    createdAt: "2026-06-07T15:32:00.000Z"
  },
  {
    id: "log_3",
    userId: "user_admin",
    action: "invite_member",
    details: "Invited user_member_2 with role 'member'",
    createdAt: "2026-06-07T16:05:00.000Z"
  }
];

export const auditExportTools = {
  manifest: [
    {
      name: "audit.get_logs",
      description: "Retrieve audit logs for an organization",
      inputSchema: {
        type: "object",
        properties: {
          orgId: { type: "string" }
        },
        required: ["orgId"]
      }
    }
  ],

  generateCSV(orgId: string): string {
    const headers = ["ID", "User ID", "Action", "Details", "Created At"];
    const rows = mockAuditLogs.map(log => [
      log.id,
      log.userId,
      log.action,
      `"${log.details.replace(/"/g, '""')}"`,
      log.createdAt
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    return csvContent;
  },

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "audit.get_logs":
        return mockAuditLogs;
      default:
        throw new Error(`Unknown audit export tool: ${toolName}`);
    }
  }
};
