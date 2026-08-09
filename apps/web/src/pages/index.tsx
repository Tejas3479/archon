import React, { useRef, useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";
import {
  Shield,
  Cpu,
  Zap,
  Lock,
  Globe,
  DollarSign,
  Heart,
  Home,
  Users,
  Plane,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Eye,
  Key,
  Server,
  Activity,
  Code2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

/* ─── Motion variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

const stagger = (staggerDelay = 0.08) => ({
  visible: { transition: { staggerChildren: staggerDelay } },
});

/* ─── Animated counter ─────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v).toLocaleString());
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      animate(motionVal, target, { duration: 1.6, ease: "easeOut" });
    }
  }, [inView, motionVal, target]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

/* ─── Section wrapper with scroll reveal ───────────────────────── */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      id={id}
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Glass card ───────────────────────────────────────────────── */
function GlassCard({
  children,
  className = "",
  hoverGlow = true,
}: {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
}) {
  return (
    <motion.div
      whileHover={
        hoverGlow
          ? { boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 28px rgba(99,102,241,0.18)", y: -3 }
          : {}
      }
      transition={{ duration: 0.25 }}
      className={`bg-glass backdrop-blur-md border border-white/8 rounded-2xl shadow-card ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ─── Primary CTA button ───────────────────────────────────────── */
function CTAButton({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const base = "inline-flex items-center gap-2 font-bold rounded-xl px-7 py-3.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";
  const styles = {
    primary:
      "bg-accent-primary hover:bg-accent-secondary text-white shadow-glow-sm hover:shadow-glow-md",
    outline:
      "border border-white/15 text-text-primary hover:bg-white/5 hover:border-white/25",
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
        {children}
      </Link>
    </motion.div>
  );
}

/* ─── Feature hub card (bento) ─────────────────────────────────── */
interface HubCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  large?: boolean;
}

function HubCard({ icon, title, description, badge, badgeColor = "accent", large }: HubCardProps) {
  const badgeStyles: Record<string, string> = {
    accent: "bg-accent-primary/15 text-accent-secondary border-accent-primary/20",
    success: "bg-success/15 text-success border-success/20",
    warning: "bg-warning/15 text-warning border-warning/20",
    purple: "bg-pqc/15 text-pqc border-pqc/20",
    crypto: "bg-crypto/15 text-crypto border-crypto/20",
  };

  return (
    <GlassCard className={`p-6 flex flex-col gap-4 ${large ? "md:col-span-2 md:row-span-2" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-xl bg-white/5 border border-white/8">
          {icon}
        </div>
        {badge && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-bold text-text-primary text-base mb-1.5">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </GlassCard>
  );
}

/* ─── FAQ accordion ────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/6">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-5 text-left text-text-primary font-semibold text-sm hover:text-text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-lg px-1"
      >
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} className="text-text-secondary flex-shrink-0 ml-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-text-secondary leading-relaxed pb-5 px-1">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Terminal mockup ──────────────────────────────────────────── */
function TerminalMockup() {
  const lines = [
    { delay: 0,    text: "$ archon init --enclave wasm --crypto ed25519", color: "text-text-secondary" },
    { delay: 0.4,  text: "✓ Rust WASM enclave initialized (512KB)", color: "text-success" },
    { delay: 0.9,  text: "✓ Ed25519 keypair generated on-device", color: "text-success" },
    { delay: 1.4,  text: "✓ AES-256-GCM vault ready", color: "text-success" },
    { delay: 1.9,  text: "", color: "" },
    { delay: 2.0,  text: "$ archon agent.run --hub finance", color: "text-text-secondary" },
    { delay: 2.5,  text: "→ Detected: $12.99 subscription (unused 47 days)", color: "text-warning" },
    { delay: 3.0,  text: "→ Proposed: Cancel Netflix Basic", color: "text-accent-secondary" },
    { delay: 3.5,  text: "→ Awaiting approval [y/n]: y", color: "text-accent-secondary" },
    { delay: 4.0,  text: "✓ Action executed. $155.88/yr saved.", color: "text-success" },
    { delay: 4.5,  text: "✓ Audit log written. 0 bytes left device.", color: "text-success" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden shadow-card bg-bg-secondary font-mono text-xs">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 bg-bg-elevated">
        <div className="w-3 h-3 rounded-full bg-error/70" />
        <div className="w-3 h-3 rounded-full bg-warning/70" />
        <div className="w-3 h-3 rounded-full bg-success/70" />
        <span className="text-text-muted text-[10px] ml-2 font-sans">archon — twin shell</span>
      </div>
      {/* Lines */}
      <div className="p-5 space-y-1.5 min-h-[220px]">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: line.delay, duration: 0.3 }}
            className={line.color}
          >
            {line.text || <span className="opacity-0">—</span>}
          </motion.div>
        ))}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 4.8, repeat: Infinity, duration: 1 }}
          className="inline-block w-2 h-4 bg-accent-primary"
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/*  PAGE                                                            */
/* ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const faqs = [
    {
      q: "Does Archon send my data to the cloud?",
      a: "Never. Archon's intelligence layer runs entirely inside a Rust WebAssembly enclave on your device. All AI inference, memory, and decision-making happens locally. The Cloudflare gateway handles billing and routing only — no personal data, no prompts, no context leaves your device.",
    },
    {
      q: "What happens if my device is compromised?",
      a: "Your cryptographic identity is sealed with Ed25519 keys generated on-device and stored in your OS secure enclave (iOS Secure Enclave / Android Keystore). A GDPR-compliant data wipe with biometric confirmation permanently destroys all local state, verified by a cryptographic signature.",
    },
    {
      q: "How does the autonomous action work?",
      a: "Archon proposes actions (Intents) based on data it observes locally — calendar, health sensors, bank feeds. Every high-value action requires your explicit approval before execution. You can configure risk thresholds per domain, and DeFi transactions above your set limit always require biometric sign-off.",
    },
    {
      q: "What is the FinOps billing model?",
      a: "Archon uses just-in-time (JIT) crypto-native billing. Each API tool call costs a micro-amount (default: $0.10). You set a daily budget cap. When your budget is reached, all executions pause until the next day. Enterprise teams get per-seat controls and full audit export.",
    },
    {
      q: "What does 'post-quantum cryptography' mean for me?",
      a: "Current encryption (RSA, ECDH) will be vulnerable to quantum computers within the decade. Archon is building toward Dilithium (lattice-based) signatures and X25519 key exchanges that resist both classical and quantum attacks, future-proofing your identity.",
    },
    {
      q: "Is this available for Android?",
      a: "The current release targets iOS. Android support is in development. The WASM core is platform-agnostic — the primary blocker is completing Android Keystore integration for the secure enclave binding.",
    },
  ];

  return (
    <>
      <Head>
        <title>Archon — Your Autonomous AI Life Twin</title>
        <meta
          name="description"
          content="Archon is an on-device AI twin that autonomously manages your finances, health, home, and travel — with military-grade encryption. Zero data leaves your device."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Archon — Your Autonomous AI Life Twin" />
        <meta
          property="og:description"
          content="On-device AI. Zero cloud. Military-grade encryption. Your AI twin acts on your behalf while your data stays private."
        />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">

        {/* ── NAV ───────────────────────────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 border-b border-white/6 bg-bg-primary/80 backdrop-blur-xl"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="Archon home">
              <div className="p-1.5 rounded-lg bg-accent-glow group-hover:bg-accent-primary/20 transition-colors">
                <Shield size={20} className="text-accent-primary" />
              </div>
              <span className="font-bold text-text-primary tracking-tight">Archon</span>
              <span className="text-[10px] font-bold text-accent-secondary bg-accent-primary/10 border border-accent-primary/20 px-2 py-0.5 rounded-full ml-1">
                BETA
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
              <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
              <a href="#privacy" className="hover:text-text-primary transition-colors">Privacy</a>
              <a href="#enterprise" className="hover:text-text-primary transition-colors">Enterprise</a>
              <a href="#faq" className="hover:text-text-primary transition-colors">FAQ</a>
            </div>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="text-sm font-bold bg-accent-primary hover:bg-accent-secondary text-white px-5 py-2 rounded-lg transition-colors shadow-glow-sm"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </motion.nav>

        <main>

          {/* ── HERO ─────────────────────────────────────────────── */}
          <section
            className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden"
            aria-label="Hero"
          >
            {/* Background layers */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {/* Radial gradient */}
              <div className="absolute inset-0 bg-hero-radial opacity-100" />
              {/* Dot grid */}
              <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                  backgroundImage: "radial-gradient(circle, #818cf8 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              {/* Glow orbs */}
              <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-accent-primary/5 blur-[120px] animate-float-slow" />
              <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-pqc/5 blur-[100px] animate-float-slow [animation-delay:-3s]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto text-center">
              {/* Eyebrow */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-2 text-xs font-semibold text-accent-secondary bg-accent-primary/10 border border-accent-primary/20 px-4 py-2 rounded-full mb-8"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                On-device AI. Zero cloud. Zero compromise.
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-primary leading-[1.08] mb-6"
              >
                Your AI Twin Acts.
                <br />
                <span className="relative">
                  <span className="text-transparent bg-clip-text"
                    style={{ backgroundImage: "linear-gradient(135deg, #6366f1, #a78bfa, #818cf8)" }}>
                    Your Data Never Leaves.
                  </span>
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
              >
                Archon is an autonomous AI agent sealed inside a{" "}
                <span className="text-text-primary font-semibold">Rust WebAssembly enclave</span> on your device —
                managing your finances, health, home, and travel with{" "}
                <span className="text-text-primary font-semibold">military-grade encryption</span> and zero cloud dependency.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <CTAButton href="/login" variant="primary">
                  Get Started Free <ArrowRight size={16} />
                </CTAButton>
                <CTAButton href="#features" variant="outline">
                  Explore Features
                </CTAButton>
              </motion.div>

              {/* Terminal */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.45 }}
                className="max-w-2xl mx-auto"
              >
                <TerminalMockup />
              </motion.div>

              {/* Scroll hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5.5, duration: 1 }}
                className="mt-12 flex justify-center"
                aria-hidden="true"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                  <ChevronDown size={20} className="text-text-muted" />
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ── TRUST BAR ─────────────────────────────────────────── */}
          <Section className="py-12 border-y border-white/6 bg-bg-secondary/40">
            <div className="max-w-5xl mx-auto px-6">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-text-muted mb-8">
                Built on battle-tested open standards
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center">
                {[
                  { label: "Rust + WASM", icon: <Cpu size={18} className="text-warning" /> },
                  { label: "Ed25519", icon: <Key size={18} className="text-accent-secondary" /> },
                  { label: "AES-256-GCM", icon: <Lock size={18} className="text-success" /> },
                  { label: "Cloudflare Edge", icon: <Globe size={18} className="text-info" /> },
                  { label: "X25519 DH", icon: <Shield size={18} className="text-pqc" /> },
                  { label: "W3C DID:key", icon: <CheckCircle size={18} className="text-crypto" /> },
                ].map((t) => (
                  <div key={t.label} className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    {t.icon}
                    <span className="text-[10px] font-mono text-text-secondary text-center">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── STATS ─────────────────────────────────────────────── */}
          <Section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                variants={stagger(0.12)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
              >
                {[
                  { stat: 0,   suffix: " bytes",  label: "Data sent to cloud",   color: "text-success",          note: "Zero. Ever." },
                  { stat: 256, suffix: "-bit",     label: "AES encryption",       color: "text-accent-secondary", note: "Military grade" },
                  { stat: 6,   suffix: " domains", label: "Life hubs automated",  color: "text-pqc",              note: "Finance to travel" },
                  { stat: 5,   suffix: " min",     label: "JIT token lifetime",   color: "text-crypto",           note: "Minimal exposure" },
                ].map((s) => (
                  <motion.div key={s.label} variants={fadeUp}>
                    <GlassCard className="p-6 text-center" hoverGlow={false}>
                      <div className={`text-3xl font-extrabold mb-1 ${s.color}`}>
                        <AnimatedNumber target={s.stat} suffix={s.suffix} />
                      </div>
                      <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                        {s.label}
                      </div>
                      <div className="text-[11px] font-mono text-text-muted">{s.note}</div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </Section>

          {/* ── HOW IT WORKS ──────────────────────────────────────── */}
          <Section id="features" className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-secondary mb-3">
                  How it works
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                  Set up once. Let it work forever.
                </h2>
                <p className="text-text-secondary mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                  No accounts to share, no data to upload. Archon bootstraps a cryptographic identity on your device and starts working in minutes.
                </p>
              </div>

              <motion.div
                variants={stagger(0.15)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid md:grid-cols-3 gap-6 relative"
              >
                {/* Connecting line (desktop only) */}
                <div className="hidden md:block absolute top-12 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" aria-hidden="true" />

                {[
                  {
                    step: "01",
                    icon: <Key size={22} className="text-accent-primary" />,
                    title: "Generate your identity",
                    desc: "An Ed25519 keypair is created inside your device's secure enclave. Your seed phrase is the only backup — we have no copy.",
                  },
                  {
                    step: "02",
                    icon: <Sparkles size={22} className="text-pqc" />,
                    title: "Configure your domains",
                    desc: "Tell Archon which life domains to manage and set risk thresholds. Every high-risk action requires your approval before execution.",
                  },
                  {
                    step: "03",
                    icon: <Zap size={22} className="text-crypto" />,
                    title: "Watch it work",
                    desc: "Archon runs 24/7 inside the WASM enclave. It proposes intents, you approve or reject. Full audit log. Zero plaintext escapes.",
                  },
                ].map((s) => (
                  <motion.div key={s.step} variants={fadeUp}>
                    <GlassCard className="p-7 relative">
                      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-bg-elevated border border-white/10 flex items-center justify-center text-xs font-bold font-mono text-text-muted">
                        {s.step}
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/8 w-fit mb-5">
                        {s.icon}
                      </div>
                      <h3 className="font-bold text-text-primary mb-2">{s.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </Section>

          {/* ── FEATURES BENTO GRID ───────────────────────────────── */}
          <Section className="py-20 px-6 bg-bg-secondary/30">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-secondary mb-3">
                  Six life domains
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                  One twin. Every domain.
                </h2>
                <p className="text-text-secondary mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                  Archon manages the six domains that consume the most of your time and money — autonomously, privately, on your device.
                </p>
              </div>

              <motion.div
                variants={stagger(0.07)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                <motion.div variants={fadeUp}>
                  <HubCard
                    icon={<DollarSign size={20} className="text-success" />}
                    title="Finance Hub"
                    description="Detects unused subscriptions, flags anomalous charges, executes approved micro-payments, and summarises spending weekly."
                    badge="Live"
                    badgeColor="success"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <HubCard
                    icon={<Heart size={20} className="text-error" />}
                    title="Health Hub"
                    description="Monitors HRV and biosensor anomalies in real-time. Books GP appointments, flags irregular patterns, and logs all observations locally."
                    badge="Live"
                    badgeColor="success"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <HubCard
                    icon={<Home size={20} className="text-info" />}
                    title="Home Hub"
                    description="Learns your schedule and controls smart home devices automatically. Locks, adjusts thermostat, manages energy based on sleep patterns."
                    badge="Live"
                    badgeColor="success"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <HubCard
                    icon={<Users size={20} className="text-pqc" />}
                    title="Social Hub"
                    description="Extracts life events from messages (birthdays, anniversaries), drafts responses in your tone, and manages gift/reminder schedules."
                    badge="Live"
                    badgeColor="success"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <HubCard
                    icon={<Plane size={20} className="text-accent-secondary" />}
                    title="Travel Hub"
                    description="Monitors flight prices, triggers auto check-in, books upgrades within budget, and adjusts home automation when you depart."
                    badge="Live"
                    badgeColor="success"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <HubCard
                    icon={<TrendingUp size={20} className="text-crypto" />}
                    title="DeFi Hub"
                    description="Executes token swaps, monitors yield positions, and rebalances within your risk tolerance. All transactions require biometric sign-off."
                    badge="Beta"
                    badgeColor="warning"
                  />
                </motion.div>
              </motion.div>

              {/* ANNEAL callout */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-4"
              >
                <GlassCard className="p-6 md:flex items-center gap-6" hoverGlow={false}>
                  <div className="flex-shrink-0 p-4 rounded-xl bg-white/5 border border-white/8 mb-4 md:mb-0 w-fit">
                    <Activity size={24} className="text-accent-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-text-primary">ANNEAL Self-Healing Engine</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-secondary border border-accent-primary/20">
                        Unique
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Archon's workflow graph repairs itself using symbolic analysis. When a task fails, the ANNEAL engine generates a patch delta, sandboxes it, and — after your approval — self-applies the fix. 10% of all patches are randomly sampled for human review.
                    </p>
                  </div>
                  <div className="flex-shrink-0 mt-4 md:mt-0">
                    <a href="#faq" className="text-accent-secondary text-sm font-semibold hover:text-accent-primary transition-colors whitespace-nowrap">
                      Learn more →
                    </a>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </Section>

          {/* ── PRIVACY SECTION ───────────────────────────────────── */}
          <Section id="privacy" className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent-secondary mb-3">
                    Privacy by design
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-6">
                    The AI that works for you — and only you.
                  </h2>
                  <p className="text-text-secondary mb-8 leading-relaxed">
                    Every other AI assistant sends your conversations, habits, and data to a cloud server. Archon is different by design: the intelligence lives inside a WASM enclave on your hardware. We physically cannot read your data.
                  </p>

                  <div className="space-y-4">
                    {[
                      { icon: <Eye size={16} className="text-error" />, label: "Zero-knowledge gateway", desc: "Cloudflare only sees encrypted billing events — no content, no context, no queries." },
                      { icon: <Lock size={16} className="text-success" />, label: "AES-256-GCM encrypted vault", desc: "All local memory is encrypted at rest. Even if your device is seized, data is unreadable without your key." },
                      { icon: <AlertTriangle size={16} className="text-warning" />, label: "GDPR nuclear wipe", desc: "One biometric confirmation destroys all data with a cryptographic proof of deletion." },
                      { icon: <Code2 size={16} className="text-accent-secondary" />, label: "Open-source core", desc: "The Rust WASM enclave is publicly auditable. No black boxes, no obfuscated telemetry." },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/8 flex-shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary text-sm mb-0.5">{item.label}</div>
                          <div className="text-xs text-text-secondary leading-relaxed">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code panel */}
                <div>
                  <GlassCard className="overflow-hidden" hoverGlow={false}>
                    <div className="px-5 py-3 border-b border-white/6 flex items-center gap-2">
                      <Code2 size={14} className="text-accent-secondary" />
                      <span className="text-xs font-mono text-text-muted">vault.rs — AES-256-GCM encrypt</span>
                    </div>
                    <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto">
                      <div className="text-text-muted">{"// Zero plaintext. Ever."}</div>
                      <div className="mt-2">
                        <span className="text-pqc">pub fn </span>
                        <span className="text-accent-secondary">encrypt</span>
                        <span className="text-text-primary">{"(plaintext: &[u8], key: &[u8; 32]) -> "}</span>
                      </div>
                      <div className="pl-4">
                        <span className="text-accent-secondary">Result</span>
                        <span className="text-text-primary">{"<Vec<u8>, VaultError> {"}</span>
                      </div>
                      <div className="pl-8">
                        <span className="text-pqc">let </span>
                        <span className="text-text-primary">cipher = </span>
                        <span className="text-accent-secondary">Aes256Gcm</span>
                        <span className="text-text-primary">::new(key.into());</span>
                      </div>
                      <div className="pl-8">
                        <span className="text-pqc">let </span>
                        <span className="text-text-primary">nonce = </span>
                        <span className="text-accent-secondary">Aes256Gcm</span>
                        <span className="text-text-primary">::generate_nonce(</span>
                      </div>
                      <div className="pl-12">
                        <span className="text-text-primary">&mut OsRng);</span>
                      </div>
                      <div className="pl-8 mt-1">
                        <span className="text-text-secondary">{"// Nonce + ciphertext packed together"}</span>
                      </div>
                      <div className="pl-8">
                        <span className="text-pqc">let </span>
                        <span className="text-text-primary">ct = cipher.</span>
                        <span className="text-accent-secondary">encrypt</span>
                        <span className="text-text-primary">(&nonce, plaintext)?;</span>
                      </div>
                      <div className="pl-8 mt-1">
                        <span className="text-success">{"// ← sealed inside WASM enclave"}</span>
                      </div>
                      <div className="pl-4 text-text-primary">{"}"}</div>
                    </div>
                  </GlassCard>

                  {/* Trust badges */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                      { label: "On-device AI", sub: "No cloud inference" },
                      { label: "GDPR compliant", sub: "Right to erasure" },
                      { label: "Open source core", sub: "Auditable Rust/WASM" },
                      { label: "Post-quantum ready", sub: "Dilithium in progress" },
                    ].map((b) => (
                      <GlassCard key={b.label} className="p-4 text-center" hoverGlow={false}>
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <CheckCircle size={12} className="text-success" />
                          <span className="text-xs font-bold text-text-primary">{b.label}</span>
                        </div>
                        <div className="text-[10px] font-mono text-text-muted">{b.sub}</div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── ENTERPRISE ────────────────────────────────────────── */}
          <Section id="enterprise" className="py-20 px-6 bg-bg-secondary/30">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-secondary mb-3">
                  For teams
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                  Enterprise-grade control.
                </h2>
                <p className="text-text-secondary mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                  The Archon Enterprise Suite gives compliance teams full visibility and control over every autonomous action across your organisation.
                </p>
              </div>

              <motion.div
                variants={stagger(0.1)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid md:grid-cols-3 gap-4 mb-8"
              >
                {[
                  {
                    icon: <Server size={20} className="text-accent-secondary" />,
                    title: "Organisation Dashboard",
                    desc: "Unified view of active twins, daily execution costs, and spending trends across your entire team.",
                  },
                  {
                    icon: <Users size={20} className="text-pqc" />,
                    title: "RBAC Team Management",
                    desc: "Role-based access control with owner, admin, member, and viewer tiers. Revoke licenses instantly.",
                  },
                  {
                    icon: <CheckCircle size={20} className="text-success" />,
                    title: "Compliance Audit Export",
                    desc: "Full timestamped audit log of every agent action. Export to CSV for SOC 2, GDPR, or internal review.",
                  },
                ].map((f) => (
                  <motion.div key={f.title} variants={fadeUp}>
                    <GlassCard className="p-6">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/8 w-fit mb-4">
                        {f.icon}
                      </div>
                      <h3 className="font-bold text-text-primary mb-2">{f.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <CTAButton href="/login" variant="primary">
                  Access Enterprise Dashboard <ArrowRight size={16} />
                </CTAButton>
              </motion.div>
            </div>
          </Section>

          {/* ── FAQ ───────────────────────────────────────────────── */}
          <Section id="faq" className="py-20 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-secondary mb-3">
                  FAQ
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                  Common questions.
                </h2>
              </div>

              <GlassCard className="p-6 md:p-8" hoverGlow={false}>
                {faqs.map((f) => (
                  <FAQItem key={f.q} q={f.q} a={f.a} />
                ))}
              </GlassCard>
            </div>
          </Section>

          {/* ── FINAL CTA ─────────────────────────────────────────── */}
          <Section className="py-24 px-6">
            <div className="max-w-3xl mx-auto text-center">
              {/* Decorative glow */}
              <div className="relative inline-block mb-8" aria-hidden="true">
                <div className="absolute inset-0 rounded-full blur-3xl bg-accent-primary/20 scale-150" />
                <div className="relative p-5 rounded-2xl bg-bg-elevated border border-white/10">
                  <Shield size={36} className="text-accent-primary" />
                </div>
              </div>

              <h2 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-5">
                Ready to meet your AI twin?
              </h2>
              <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Join the private beta. Set up your WASM enclave in minutes. Your data stays yours — forever.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <CTAButton href="/login" variant="primary" className="text-base px-8 py-4">
                  Start for Free — No Card Required <ArrowRight size={16} />
                </CTAButton>
                <CTAButton href="#features" variant="outline" className="text-base">
                  See How It Works
                </CTAButton>
              </div>

              <p className="text-xs text-text-muted mt-6 font-mono">
                No cloud accounts. No data collection. Open-source Rust core.
              </p>
            </div>
          </Section>

        </main>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer className="border-t border-white/6 py-10 px-6" role="contentinfo">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Archon home">
              <Shield size={18} className="text-accent-primary" />
              <span className="font-bold text-sm text-text-primary">Archon</span>
            </Link>

            <nav aria-label="Footer navigation" className="flex items-center gap-6 text-xs text-text-muted">
              <a href="#features" className="hover:text-text-secondary transition-colors">Features</a>
              <a href="#privacy" className="hover:text-text-secondary transition-colors">Privacy</a>
              <a href="#enterprise" className="hover:text-text-secondary transition-colors">Enterprise</a>
              <a href="#faq" className="hover:text-text-secondary transition-colors">FAQ</a>
              <Link href="/login" className="hover:text-text-secondary transition-colors">Sign In</Link>
            </nav>

            <p className="text-xs text-text-muted font-mono">
              © 2026 Archon. MIT License.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
