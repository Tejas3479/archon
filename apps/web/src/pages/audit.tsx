import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { Download, Search, ShieldAlert, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface AuditRecord {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AuditPage() {
  const { status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUser, setFilterUser] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL as string;
        const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY as string;
        const res = await fetch(`${GATEWAY_URL}/org/org_123/audit?format=json`, {
          headers: { "Authorization": `Bearer ${API_KEY}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.audit_logs || []);
        } else {
          toast.error("Failed to load audit logs");
        }
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
        toast.error("Gateway connection error");
      } finally {
        setIsLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchLogs();
    }
  }, [status]);

  const handleDownloadCSV = async () => {
    try {
      const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL as string;
      const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY as string;
      const res = await fetch(`${GATEWAY_URL}/org/org_123/audit?format=csv`, {
        headers: { "Authorization": `Bearer ${API_KEY}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "audit_compliance_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Audit report downloaded successfully.");
      } else {
        toast.error("Failed to generate CSV report");
      }
    } catch (err) {
      console.error("Failed to download CSV", err);
      toast.error("Failed to download report");
    }
  };

  const filteredLogs = logs.filter(
    (l) => l.userId.toLowerCase().includes(filterUser.toLowerCase()) || l.action.toLowerCase().includes(filterUser.toLowerCase())
  );

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col p-8 md:p-12">
         <div className="w-64 h-8 bg-white/5 animate-pulse rounded-lg mb-2"></div>
         <div className="w-96 h-4 bg-white/5 animate-pulse rounded-lg mb-8"></div>
         <div className="h-[600px] bg-white/5 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <Layout>
      <motion.div initial="hidden" animate="visible" variants={stagger} className="w-full">
        
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <motion.div variants={fadeUp}>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Compliance Audit</h1>
            <p className="text-sm text-text-secondary mt-2">Exportable historical logs of all agent actions and operations</p>
          </motion.div>

          <motion.button
            variants={fadeUp}
            onClick={handleDownloadCSV}
            className="bg-accent-primary hover:bg-accent-secondary text-white font-bold px-6 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 w-full md:w-auto shadow-[0_0_16px_rgba(99,102,241,0.2)] hover:shadow-[0_0_24px_rgba(99,102,241,0.4)]"
          >
            <Download size={16} /> Export CSV
          </motion.button>
        </div>

        {/* Filter and Table */}
        <motion.div variants={fadeUp} className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-text-secondary" />
              <h3 className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Operations Feed</h3>
            </div>
            
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-text-muted" />
              </div>
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Filter by user or action..."
                className="bg-bg-elevated/50 backdrop-blur border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-text-primary text-xs font-mono focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary w-full transition-all placeholder-text-muted"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white/[0.02] text-text-secondary text-[10px] uppercase font-bold border-b border-white/10 tracking-widest">
                  <th className="p-4 pl-6">Log ID</th>
                  <th className="p-4">Operator</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 pr-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6"><div className="h-4 w-20 bg-bg-elevated animate-pulse rounded"></div></td>
                      <td className="p-4"><div className="h-4 w-32 bg-bg-elevated animate-pulse rounded"></div></td>
                      <td className="p-4"><div className="h-5 w-24 bg-bg-elevated animate-pulse rounded-full"></div></td>
                      <td className="p-4"><div className="h-4 w-64 bg-bg-elevated animate-pulse rounded"></div></td>
                      <td className="p-4 pr-6"><div className="h-4 w-32 bg-bg-elevated animate-pulse rounded"></div></td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Activity size={48} className="text-white/10 mb-4" />
                        <p className="text-sm font-bold text-text-primary">No audit logs found</p>
                        <p className="text-xs text-text-muted mt-1">Adjust your filters or check back later.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors duration-150 group">
                      <td className="p-4 pl-6 text-xs font-mono text-text-muted group-hover:text-accent-secondary transition-colors">{log.id}</td>
                      <td className="p-4 text-sm font-bold font-mono text-text-primary">{log.userId}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 text-text-secondary border border-white/10 group-hover:bg-accent-primary/10 group-hover:text-accent-primary group-hover:border-accent-primary/20 transition-all">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-text-secondary truncate max-w-xs md:max-w-md lg:max-w-lg">{log.details}</td>
                      <td className="p-4 pr-6 text-[10px] text-text-muted font-mono uppercase tracking-wider">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
