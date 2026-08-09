import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { UserPlus, Shield, X, Users as UsersIcon } from "lucide-react";

interface TeamMember {
  userId: string;
  role: string;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function TeamPage() {
  const { status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);

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
    if (status === "authenticated") {
      fetchMembers();
    }
  }, [status]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);

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
      setMembers((prev) => [...prev.filter(m => m.userId !== inviteEmail), { userId: inviteEmail, role: inviteRole }]);
      setInviteEmail("");
    } finally {
      setIsInviting(false);
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Optimistic update
    setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)));
    
    try {
      const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL as string;
      const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY as string;
      const res = await fetch(`${GATEWAY_URL}/org/org_123/member/${userId}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        throw new Error("Failed to update role");
      }
      toast.success("Role updated successfully.");
    } catch (err) {
      toast.error("Failed to update role in backend.");
      // Revert optimistic update
      fetchMembers();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role.toLowerCase()) {
      case 'owner': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'admin': return 'text-accent-primary bg-accent-primary/10 border-accent-primary/20';
      case 'viewer': return 'text-text-muted bg-white/5 border-white/10';
      default: return 'text-success bg-success/10 border-success/20'; // member
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col p-8 md:p-12">
         <div className="w-64 h-8 bg-white/5 animate-pulse rounded-lg mb-2"></div>
         <div className="w-96 h-4 bg-white/5 animate-pulse rounded-lg mb-8"></div>
         <div className="h-48 bg-white/5 animate-pulse rounded-2xl mb-8"></div>
         <div className="h-96 bg-white/5 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <Layout>
      <motion.div initial="hidden" animate="visible" variants={stagger} className="w-full">
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Team Management</h1>
          <p className="text-sm text-text-secondary mt-2">Manage corporate organization access, roles, and licenses</p>
        </motion.div>

        {/* Invite Member */}
        <motion.div variants={fadeUp} className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 mb-8 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow relative overflow-hidden">
          <div className="absolute -top-12 -right-12 p-8 opacity-10 pointer-events-none">
            <UserPlus size={120} className="text-accent-primary" />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Provision Access</h3>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Invite New Colleague</p>
            </div>
          </div>
          
          <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end relative z-10">
            <div className="flex-1 w-full relative">
              <label className="block text-[10px] text-text-secondary font-bold mb-2 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-bg-elevated/50 backdrop-blur border border-white/10 rounded-xl p-3.5 text-text-primary text-sm font-mono placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                required
              />
            </div>

            <div className="w-full md:w-56">
              <label className="block text-[10px] text-text-secondary font-bold mb-2 uppercase tracking-wider">Access Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-bg-elevated/50 backdrop-blur border border-white/10 rounded-xl p-3.5 text-text-primary text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none cursor-pointer"
              >
                <option value="owner">Owner (Full Access)</option>
                <option value="admin">Administrator</option>
                <option value="member">Standard Member</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isInviting}
              className="bg-accent-primary hover:bg-accent-secondary text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all duration-200 w-full md:w-auto shadow-[0_0_16px_rgba(99,102,241,0.2)] hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isInviting ? "Inviting..." : <><UserPlus size={16} /> Send Invite</>}
            </button>
          </form>
        </motion.div>

        {/* Members List */}
        <motion.div variants={fadeUp} className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Active Membership Catalog</h3>
            <span className="text-xs font-mono text-text-muted bg-white/5 px-2 py-1 rounded">{members.length} Total</span>
          </div>

          <div className="divide-y divide-white/5">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-bg-elevated animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-bg-elevated animate-pulse rounded"></div>
                      <div className="h-3 w-24 bg-bg-elevated animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-28 bg-bg-elevated animate-pulse rounded"></div>
                </div>
              ))
            ) : members.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <UsersIcon size={48} className="text-white/10 mb-4" />
                <p className="text-sm font-bold text-text-primary">No active members found</p>
                <p className="text-xs text-text-muted mt-1">Invite colleagues to start collaborating.</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.userId} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors duration-200 group">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-bg-elevated to-bg-secondary border border-white/10 flex items-center justify-center text-text-secondary group-hover:border-accent-primary/30 group-hover:text-accent-primary transition-colors">
                      <UsersIcon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-mono text-text-primary font-bold">{member.userId}</div>
                      <div className="text-xs text-text-muted mt-0.5">Joined recently</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <div className="relative flex-1 md:flex-initial">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        className={`w-full md:w-36 appearance-none border rounded-lg p-2 pr-8 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all cursor-pointer ${getRoleBadgeColor(member.role)}`}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {/* Custom select arrow */}
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(member.userId)}
                      className="flex-shrink-0 p-2 text-text-muted hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-lg transition-all duration-200"
                      title="Revoke License"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
