import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

interface AuditRecord {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function AuditPage() {
  const { status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const [filterUser, setFilterUser] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
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

  if (status !== "authenticated") {
    return null;
  }

  const filteredLogs = logs.filter(
    (l) => l.userId.toLowerCase().includes(filterUser.toLowerCase()) || l.action.toLowerCase().includes(filterUser.toLowerCase())
  );

  return (
    <Layout>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Compliance Audit Logs</h1>
          <p className="text-sm text-text-secondary mt-1">Exportable historical logs of all agent actions and operations</p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="bg-accent-primary hover:bg-accent-secondary text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center gap-2 shadow-[0_0_16px_rgba(99,102,241,0.2)] hover:shadow-[0_0_24px_rgba(99,102,241,0.4)]"
        >
          <Download size={16} /> Download Audit Report (.CSV)
        </button>
      </div>

      {/* Filter and Table */}
      <div className="bg-glass backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
          <h3 className="text-sm font-bold uppercase text-text-secondary tracking-widest">Operations Feed</h3>
          <input
            type="text"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            placeholder="Filter by user or action..."
            className="bg-bg-elevated border border-white/10 rounded-lg px-4 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow w-full md:w-64 transition-all"
          />
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-text-secondary text-xs uppercase font-bold border-b border-white/10 tracking-wider">
              <th className="p-4">Log ID</th>
              <th className="p-4">Operator</th>
              <th className="p-4">Action</th>
              <th className="p-4">Details</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="p-4"><div className="h-4 w-20 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-32 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-16 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-64 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-32 bg-bg-elevated animate-pulse rounded"></div></td>
                </tr>
              ))
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary text-sm font-mono">No audit logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                  <td className="p-4 text-xs font-mono text-accent-secondary">{log.id}</td>
                  <td className="p-4 text-sm font-semibold font-mono text-text-primary">{log.userId}</td>
                  <td className="p-4 text-xs font-bold uppercase text-text-secondary">{log.action}</td>
                  <td className="p-4 text-sm text-text-secondary">{log.details}</td>
                  <td className="p-4 text-xs text-text-muted font-mono">{log.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
