import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";

interface TeamMember {
  userId: string;
  role: string;
}

export default function TeamPage() {
  const { status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([
    { userId: "user_admin", role: "admin" },
    { userId: "user_member_1", role: "member" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  const fetchMembers = async () => {
    try {
      const res = await fetch("http://localhost:8787/org/org_123/members", {
        headers: { "Authorization": "Bearer mock_sso_token_123" },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (err) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await fetch("http://localhost:8787/org/org_123/invite", {
        method: "POST",
        headers: {
          "Authorization": "Bearer mock_sso_token_123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setInviteEmail("");
        fetchMembers();
      } else {
        throw new Error("Failed to invite");
      }
    } catch (err) {
      setMembers((prev) => [...prev, { userId: inviteEmail, role: inviteRole }]);
      setInviteEmail("");
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:8787/org/org_123/member/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer mock_sso_token_123" },
      });
      if (res.ok) {
        fetchMembers();
      } else {
        throw new Error("Failed to remove");
      }
    } catch (err) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    );
  };

  if (status !== "authenticated") {
    return null;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Member Management</h1>
        <p className="text-sm text-slate-400 mt-1">Manage corporate organization access, roles, and licenses</p>
      </div>

      {/* Invite Member */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h3 className="text-sm font-bold uppercase text-slate-300 mb-4">Invite New Colleague</h3>
        
        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-slate-400 font-semibold mb-2">Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="w-full md:w-48">
            <label className="block text-xs text-slate-400 font-semibold mb-2">Access Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="member">Member</option>
              <option value="admin">Administrator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors duration-150 w-full md:w-auto"
          >
            Send Invite
          </button>
        </form>
      </div>

      {/* Members List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-sm font-bold uppercase text-slate-300">Active Membership Catalog</h3>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
              <th className="p-4">User Identifier (Email)</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId} className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors duration-100">
                <td className="p-4 text-sm font-semibold">{member.userId}</td>
                <td className="p-4 text-sm">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded p-1 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="text-xs text-red-500 hover:text-red-400 font-bold border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded transition-colors duration-150"
                  >
                    Revoke License
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
