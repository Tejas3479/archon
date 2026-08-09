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
        const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL as string;
        const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY as string;
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
      <div className="min-h-screen bg-bg-primary flex flex-col p-8">
        <div className="w-64 h-8 bg-bg-elevated animate-pulse rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-bg-elevated animate-pulse rounded-2xl border border-white/5"></div>
          ))}
        </div>
        <div className="h-64 bg-bg-elevated animate-pulse rounded-2xl border border-white/5"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Organization Overview</h1>
        <p className="text-sm text-text-secondary mt-2">Aggregated statistics across all active twin enclaves</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Active Twins</span>
          <h2 className="text-4xl font-extrabold text-accent-primary mt-3">{stats.activeAgents}</h2>
          <p className="text-xs text-text-muted mt-2 font-mono">Running workspaces</p>
        </div>

        <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Total Executions</span>
          <h2 className="text-4xl font-extrabold text-accent-primary mt-3">{stats.totalActions}</h2>
          <p className="text-xs text-text-muted mt-2 font-mono">API and Tool runs computed</p>
        </div>

        <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Cycle Billing Cost</span>
          <h2 className="text-4xl font-extrabold text-success mt-3">${(stats.totalCost / 100).toFixed(2)}</h2>
          <p className="text-xs text-text-muted mt-2 font-mono">Daily Budget: $50.00</p>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6">Daily Activity & Spending</h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#8494a8" fontSize={11} fontFamily="var(--font-mono)" />
              <YAxis stroke="#8494a8" fontSize={11} fontFamily="var(--font-mono)" />
              <Tooltip contentStyle={{ backgroundColor: "rgba(14,22,35,0.9)", borderColor: "rgba(255,255,255,0.1)", color: "#e8edf5", backdropFilter: "blur(8px)" }} itemStyle={{ fontFamily: "var(--font-mono)" }} />
              <Area type="monotone" dataKey="cost" name="Spending ($)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
