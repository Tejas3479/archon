import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";

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

  const [logs, setLogs] = useState<AuditRecord[]>([
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
  ]);
  const [filterUser, setFilterUser] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  const handleDownloadCSV = () => {
    // Generate mock CSV on-device and trigger direct download
    const headers = ["ID", "User ID", "Action", "Details", "Created At"];
    const rows = logs.map(l => [l.id, l.userId, l.action, `"${l.details}"`, l.createdAt]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "audit_compliance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h1 className="text-2xl font-bold">Compliance Audit Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Exportable historical logs of all agent actions and operations</p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors duration-150 flex items-center gap-2"
        >
          📥 Download Audit Report (.CSV)
        </button>
      </div>

      {/* Filter and Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <h3 className="text-sm font-bold uppercase text-slate-300">Operations Feed</h3>
          <input
            type="text"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            placeholder="Filter by user or action..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 text-xs focus:outline-none focus:border-blue-500 w-full md:w-64"
          />
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
              <th className="p-4">Log ID</th>
              <th className="p-4">Operator</th>
              <th className="p-4">Action</th>
              <th className="p-4">Details</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/10 transition-colors duration-100">
                <td className="p-4 text-xs font-mono text-blue-400">{log.id}</td>
                <td className="p-4 text-sm font-semibold">{log.userId}</td>
                <td className="p-4 text-xs font-bold uppercase text-slate-300">{log.action}</td>
                <td className="p-4 text-sm text-slate-300">{log.details}</td>
                <td className="p-4 text-xs text-slate-400">{log.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
