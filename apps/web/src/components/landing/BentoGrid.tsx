import React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Activity, Plane, Home, Code2, MessageSquare, DollarSign } from "lucide-react";

const BENTO_ITEMS = [
  {
    title: "Autonomous Finance",
    desc: "Auto-cancels unused subscriptions, rebalances portfolios, and negotiates bills.",
    icon: <DollarSign size={20} className="text-warning" />,
    colSpan: "md:col-span-2",
    visual: () => (
      <div className="flex items-end gap-1.5 h-12 mt-4 px-2">
        {[40, 70, 45, 90, 60].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: "0%" }}
            whileInView={{ height: `${h}%` }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            className="flex-1 bg-warning/20 rounded-t-sm border-t border-warning/50"
          />
        ))}
      </div>
    ),
  },
  {
    title: "Health & Longevity",
    desc: "Syncs with Apple Health to optimize sleep schedules and book medical checkups.",
    icon: <Activity size={20} className="text-accent-secondary" />,
    colSpan: "md:col-span-1",
    visual: () => (
      <div className="h-12 mt-4 flex items-center justify-center">
        <svg viewBox="0 0 100 30" className="w-full overflow-visible">
          <motion.path
            d="M 0 15 L 30 15 L 40 5 L 50 25 L 60 15 L 100 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-accent-secondary"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      </div>
    ),
  },
  {
    title: "Encrypted Comms",
    desc: "Drafts replies to emails and filters noise based on your local communication patterns.",
    icon: <MessageSquare size={20} className="text-info" />,
    colSpan: "md:col-span-1",
    visual: () => (
      <div className="space-y-2 h-16 mt-4">
        <div className="w-[80%] h-4 bg-white/5 rounded-full ml-auto" />
        <div className="w-[60%] h-4 bg-info/20 border border-info/30 rounded-full" />
        <div className="w-[70%] h-4 bg-white/5 rounded-full ml-auto" />
      </div>
    ),
  },
  {
    title: "DevOps & Code",
    desc: "Reviews PRs locally and suggests refactors using the built-in LLM engine.",
    icon: <Code2 size={20} className="text-success" />,
    colSpan: "md:col-span-2",
    visual: () => (
      <div className="h-16 mt-4 p-2 bg-black/40 rounded border border-white/5 font-mono text-[8px] text-text-muted overflow-hidden">
        <div className="text-error">- function slowSearch(arr) {'{'}</div>
        <div className="text-success">+ function fastSearch(arr) {'{'}</div>
        <div className="pl-4 opacity-50">return new Set(arr);</div>
        <div className="opacity-50">{'}'}</div>
      </div>
    ),
  },
  {
    title: "Logistics & Travel",
    desc: "Monitors flight prices and auto-books accommodations based on calendar events.",
    icon: <Plane size={20} className="text-purple-400" />,
    colSpan: "md:col-span-2",
    visual: () => (
      <div className="h-12 mt-4 relative flex items-center">
        <div className="absolute left-0 w-2 h-2 rounded-full border border-purple-400" />
        <div className="absolute right-0 w-2 h-2 rounded-full border border-purple-400" />
        <svg viewBox="0 0 100 20" className="w-full absolute inset-0">
          <motion.path
            d="M 5 10 Q 50 -10 95 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="text-purple-400/50"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 1.5 }}
          />
        </svg>
      </div>
    ),
  },
  {
    title: "Smart Home",
    desc: "Locally orchestrates IoT devices to optimize energy usage without external APIs.",
    icon: <Home size={20} className="text-orange-400" />,
    colSpan: "md:col-span-1",
    visual: () => (
      <div className="h-12 mt-4 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 rounded-full border-2 border-orange-400/50 flex items-center justify-center shadow-[0_0_12px_rgba(251,146,60,0.3)]"
        >
          <span className="text-[8px] font-bold text-orange-400">72°</span>
        </motion.div>
      </div>
    ),
  },
];

function BentoCard({ item }: { item: typeof BENTO_ITEMS[0] }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-bg-secondary border border-white/10 p-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${item.colSpan}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              300px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.06),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          {item.icon}
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2 tracking-tight">{item.title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">{item.desc}</p>
        
        <div className="mt-auto">
          {item.visual()}
        </div>
      </div>
    </div>
  );
}

export function BentoGrid() {
  return (
    <section className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-4">
          Your Life. Fully Decoupled.
        </h2>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Archon manages 6 core domains natively on your device. It interacts with external APIs securely via our Zero-Knowledge edge gateway.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BENTO_ITEMS.map((item, idx) => (
          <BentoCard key={idx} item={item} />
        ))}
      </div>
    </section>
  );
}
