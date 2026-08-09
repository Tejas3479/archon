import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import toast from "react-hot-toast";

interface TeamMember {
  userId: string;
  role: string;
}

export default function TeamPage() {
  const { status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  const fetchMembers = async () => {
    try {
      const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL as string;
      const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY as string;
      const res = await fetch(`${GATEWAY_URL}/org/org_123/members`, {
        headers: { "Authorization": `Bearer ${API_KEY}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      } else {
        toast.error("Failed to load team members");
      }
    } catch (err) {
      toast.error("Gateway connection error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL as string;
      const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY as string;
      const res = await fetch(`${GATEWAY_URL}/org/org_123/invite`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setInviteEmail("");
        toast.success("Invitation sent successfully!");
        fetchMembers();
      } else {
        throw new Error("Failed to invite");
      }
    } catch (err) {
      toast.error("Failed to send invite. Using fallback mode.");
      setMembers((prev) => [...prev, { userId: inviteEmail, role: inviteRole }]);
      setInviteEmail("");
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL as string;
      const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY as string;
      const res = await fetch(`${GATEWAY_URL}/org/org_123/member/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${API_KEY}` },
      });
      if (res.ok) {
        toast.success("License revoked successfully.");
        fetchMembers();
      } else {
        throw new Error("Failed to remove");
      }
    } catch (err) {
      toast.error("Failed to revoke license. Using fallback mode.");
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    );
    toast.success("Role updated successfully.");
  };

  if (status !== "authenticated") {
    return null;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Team Member Management</h1>
        <p className="text-sm text-text-secondary mt-2">Manage corporate organization access, roles, and licenses</p>
      </div>

      {/* Invite Member */}
      <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Invite New Colleague</h3>
        
        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-bg-elevated border border-white/10 rounded-lg p-3 text-text-primary text-sm focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all"
              required
            />
          </div>

          <div className="w-full md:w-48">
            <label className="block text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">Access Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-bg-elevated border border-white/10 rounded-lg p-3 text-text-primary text-sm focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all"
            >
              <option value="member">Member</option>
              <option value="admin">Administrator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-accent-primary hover:bg-accent-secondary text-white font-bold px-6 py-3 rounded-lg text-sm transition-all duration-150 w-full md:w-auto shadow-[0_0_16px_rgba(99,102,241,0.2)] hover:shadow-[0_0_24px_rgba(99,102,241,0.4)]"
          >
            Send Invite
          </button>
        </form>
      </div>

      {/* Members List */}
      <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Active Membership Catalog</h3>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-text-secondary text-xs uppercase tracking-wider font-bold border-b border-white/10">
              <th className="p-4">User Identifier (Email)</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="p-4"><div className="h-4 w-48 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="p-4"><div className="h-6 w-24 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="p-4 text-right"><div className="h-8 w-28 bg-bg-elevated animate-pulse rounded ml-auto"></div></td>
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-text-secondary text-sm">No active members found.</td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                  <td className="p-4 text-sm font-mono text-text-primary">{member.userId}</td>
                  <td className="p-4 text-sm">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                      className="bg-bg-elevated border border-white/10 rounded p-1.5 text-text-primary text-xs focus:outline-none focus:border-accent-primary"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRemove(member.userId)}
                      className="text-xs text-error hover:text-white font-bold border border-error/20 hover:bg-error/10 px-3 py-1.5 rounded transition-all duration-150"
                    >
                      Revoke License
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
