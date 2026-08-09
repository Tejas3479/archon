// WHY: CRUD helper for organizations, members, and role allocations.
// Employs D1 database for persistent state.

export interface Organization {
  id: string;
  name: string;
  plan: string;
}

export interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
}

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

  async createOrg(db: any, name: string, plan: string = "free"): Promise<Organization> {
    const id = "org_" + Math.random().toString(36).substring(2, 9);
    await db.prepare("INSERT INTO organizations (id, name, plan) VALUES (?, ?, ?)").bind(id, name, plan).run();
    return { id, name, plan };
  },

  async inviteMember(db: any, orgId: string, userId: string, role: "owner" | "admin" | "member" | "viewer"): Promise<boolean> {
    await db.prepare("DELETE FROM team_members WHERE organization_id = ? AND user_id = ?").bind(orgId, userId).run();
    await db.prepare("INSERT INTO team_members (organization_id, user_id, role) VALUES (?, ?, ?)").bind(orgId, userId, role).run();
    return true;
  },

  async removeMember(db: any, orgId: string, userId: string): Promise<boolean> {
    await db.prepare("DELETE FROM team_members WHERE organization_id = ? AND user_id = ?").bind(orgId, userId).run();
    return true;
  },

  async getMembers(db: any, orgId: string): Promise<TeamMember[]> {
    const { results } = await db.prepare("SELECT user_id as userId, role FROM team_members WHERE organization_id = ?").bind(orgId).all();
    
    if (!results || results.length === 0) {
      if (orgId === "org_123") {
        // Auto-seed for hackathon demo
        await db.prepare("INSERT OR IGNORE INTO organizations (id, name, plan) VALUES (?, ?, ?)").bind("org_123", "Archon Enterprise", "enterprise").run();
        await db.prepare("INSERT OR IGNORE INTO team_members (organization_id, user_id, role) VALUES (?, ?, ?)").bind("org_123", "user_admin", "admin").run();
        await db.prepare("INSERT OR IGNORE INTO team_members (organization_id, user_id, role) VALUES (?, ?, ?)").bind("org_123", "user_member_1", "member").run();
        return [
          { userId: "user_admin", role: "admin" },
          { userId: "user_member_1", role: "member" }
        ];
      }
    }
    return results as TeamMember[];
  },

  async getStats(db: any, orgId: string) {
    return {
      totalActions: 320,
      totalCost: 1540,
      activeAgents: 4
    };
  },

  async handle(toolName: string, args: any, db: any): Promise<any> {
    if (!db) throw new Error("Database missing");
    switch (toolName) {
      case "org.create":
        return this.createOrg(db, args.name, args.plan);
      default:
        throw new Error(`Unknown org management tool: ${toolName}`);
    }
  }
};
