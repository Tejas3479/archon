// WHY: CRUD helper for organizations, members, and role allocations.
// Employs a simulated memory store suitable for Worker environments.

export interface Organization {
  id: string;
  name: string;
  plan: string;
}

export interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
}

// Memory database mock for gateway instances
export const orgDb = new Map<string, Organization>();
export const memberDb = new Map<string, TeamMember[]>();

// Seed default data for test cases
orgDb.set("org_123", { id: "org_123", name: "Archon Enterprise", plan: "enterprise" });
memberDb.set("org_123", [
  { userId: "user_admin", role: "admin" },
  { userId: "user_member_1", role: "member" }
]);

export const orgManagementTools = {
  manifest: [
    {
      name: "org.create",
      description: "Create a new organization",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          plan: { type: "string", enum: ["free", "team", "enterprise"] }
        },
        required: ["name"]
      }
    }
  ],

  createOrg(name: string, plan: string = "free"): Organization {
    const id = "org_" + Math.random().toString(36).substring(2, 9);
    const org = { id, name, plan };
    orgDb.set(id, org);
    memberDb.set(id, []);
    return org;
  },

  inviteMember(orgId: string, userId: string, role: "owner" | "admin" | "member" | "viewer"): boolean {
    if (!orgDb.has(orgId)) return false;
    const members = memberDb.get(orgId) || [];
    // Remove if exists to prevent duplicate
    const filtered = members.filter(m => m.userId !== userId);
    filtered.push({ userId, role });
    memberDb.set(orgId, filtered);
    return true;
  },

  removeMember(orgId: string, userId: string): boolean {
    if (!orgDb.has(orgId)) return false;
    const members = memberDb.get(orgId) || [];
    const filtered = members.filter(m => m.userId !== userId);
    memberDb.set(orgId, filtered);
    return true;
  },

  getMembers(orgId: string): TeamMember[] {
    return memberDb.get(orgId) || [];
  },

  getStats(orgId: string) {
    return {
      totalActions: 320,
      totalCost: 1540, // $15.40 in cents
      activeAgents: 4
    };
  },

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "org.create":
        return this.createOrg(args.name, args.plan);
      default:
        throw new Error(`Unknown org management tool: ${toolName}`);
    }
  }
};
