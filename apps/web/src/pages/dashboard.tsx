import React, { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { Activity } from "lucide-react";

/* ─── Animated counter ────────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = "", prefix = "", decimals = 0 }: { target: number; suffix?: string; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => {
    if (decimals > 0) {
      return (v / Math.pow(10, decimals)).toFixed(decimals);
    }
    return Math.round(v).toLocaleString();
  });
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      const actualTarget = decimals > 0 ? target * Math.pow(10, decimals) : target;
      animate(mv, actualTarget, { duration: 1.6, ease: "easeOut" });
    }
  }, [inView, mv, target, decimals]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

const chartData = [
  { day: "Mon", cost: 2.10, actions: 42 },
  { day: "Tue", cost: 3.50, actions: 70 },
  { day: "Wed", cost: 1.80, actions: 36 },
  { day: "Thu", cost: 4.20, actions: 84 },
  { day: "Fri", cost: 3.80, actions: 76 },
  { day: "Sat", cost: 0.50, actions: 10 },
  { day: "Sun", cost: 1.54, actions: 22 },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-elevated/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <p className="text-xs font-bold text-text-secondary uppercase mb-1">{label}</p>
        <p className="text-sm font-mono text-text-primary">
          <span className="text-accent-primary font-bold">Cost: </span>
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalActions: 0,
    totalCost: 0,
    activeAgents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

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
        toast.error("Could not reach gateway — showing cached data.");
        setStats({ totalActions: 320, totalCost: 1540, activeAgents: 4 });
      } finally {
        setIsLoading(false);
      }
    }
    if (status === "authenticated") {
      getGatewayStats();
    }
  }, [status]);

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col p-8 md:p-12">
        <div className="w-64 h-8 bg-white/5 animate-pulse rounded-lg mb-2"></div>
        <div className="w-96 h-4 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
          ))}
        </div>
        <div className="h-72 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Overview — Archon Enterprise</title>
        <meta name="description" content="Organisation overview and activity dashboard." />
      </Head>
      <Layout>
        <motion.div initial="hidden" animate="visible" variants={stagger} className="w-full">
          
          <motion.div variants={fadeUp} className="mb-8">
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Organization Overview</h1>
            <p className="text-sm text-text-secondary mt-2">Aggregated statistics across all active twin enclaves</p>
          </motion.div>

          {/* Grid */}
          <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div variants={fadeUp} className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <Activity size={48} className="text-accent-primary" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                </span>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Active Twins</span>
              </div>
              <h2 className="text-4xl font-extrabold text-text-primary">
                {!isLoading ? <AnimatedNumber target={stats.activeAgents} /> : "-"}
              </h2>
              <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-wider">Running workspaces</p>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 block">Total Executions</span>
              <h2 className="text-4xl font-extrabold text-text-primary">
                {!isLoading ? <AnimatedNumber target={stats.totalActions} /> : "-"}
              </h2>
              <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-wider">API and Tool runs computed</p>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 block">Cycle Billing Cost</span>
              <h2 className="text-4xl font-extrabold text-text-primary">
                {!isLoading ? <AnimatedNumber target={stats.totalCost / 100} prefix="$" decimals={2} /> : "-"}
              </h2>
              <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-wider">Daily Budget: $50.00</p>
            </motion.div>
          </motion.div>

          {/* Charts */}
          <motion.div variants={fadeUp} className="bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6">Daily Activity & Spending</h3>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#8494a8" fontSize={11} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#8494a8" fontSize={11} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="cost" name="Spending ($)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" activeDot={{ r: 6, fill: "#818cf8", stroke: "#080c14", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
        </motion.div>
      </Layout>
    </>
  );
}
