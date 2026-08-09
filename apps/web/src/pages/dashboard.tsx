import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const chartData = [
  { day: "Mon", cost: 2.10, actions: 42 },
  { day: "Tue", cost: 3.50, actions: 70 },
  { day: "Wed", cost: 1.80, actions: 36 },
  { day: "Thu", cost: 4.20, actions: 84 },
  { day: "Fri", cost: 3.80, actions: 76 },
  { day: "Sat", cost: 0.50, actions: 10 },
  { day: "Sun", cost: 1.54, actions: 22 },
];

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalActions: 320,
    totalCost: 1540,
    activeAgents: 4,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  useEffect(() => {
    async function getGatewayStats() {
      try {
        const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8787";
        const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || "archon_demo_secret_2026";
        const res = await fetch(`${GATEWAY_URL}/org/org_123/stats`, {
          headers: { "Authorization": `Bearer ${API_KEY}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        // Fallback to local default stats if gateway is offline
      }
    }
    getGatewayStats();
  }, []);

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-secondary animate-pulse">Loading Secure Session...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Organization Overview</h1>
        <p className="text-sm text-secondary mt-2">Aggregated statistics across all active twin enclaves</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow">
          <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Active Twins</span>
          <h2 className="text-4xl font-extrabold text-accent-primary mt-3">{stats.activeAgents}</h2>
          <p className="text-xs text-muted mt-2 font-mono">Running workspaces</p>
        </div>

        <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow">
          <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Total Executions</span>
          <h2 className="text-4xl font-extrabold text-accent-primary mt-3">{stats.totalActions}</h2>
          <p className="text-xs text-muted mt-2 font-mono">API and Tool runs computed</p>
        </div>

        <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow">
          <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Cycle Billing Cost</span>
          <h2 className="text-4xl font-extrabold text-success mt-3">${(stats.totalCost / 100).toFixed(2)}</h2>
          <p className="text-xs text-muted mt-2 font-mono">Daily Budget: $50.00</p>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-6">Daily Activity & Spending</h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f1f5f9" }} />
              <Area type="monotone" dataKey="cost" name="Spending ($)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
