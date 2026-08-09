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
  Lock,
  Globe,
  CheckCircle,
  ChevronDown,
  Key,
  ArrowRight,
} from "lucide-react";

import { HeroVisual } from "../components/landing/HeroVisual";
import { WorkflowInteractive } from "../components/landing/WorkflowInteractive";
import { BentoGrid } from "../components/landing/BentoGrid";
import { PrivacyPanel } from "../components/landing/PrivacyPanel";

/* ─── Motion variants ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any },
  },
};

const stagger = (delay = 0.09) => ({
  visible: { transition: { staggerChildren: delay } },
});

/* ─── Animated counter ────────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) animate(mv, target, { duration: 1.6, ease: "easeOut" });
  }, [inView, mv, target]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

/* ─── Scroll-reveal section ───────────────────────────────────────── */
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

/* ─── Glass card ──────────────────────────────────────────────────── */
function GlassCard({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      whileHover={
        hover
          ? {
              boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 28px rgba(99,102,241,0.18)",
              y: -3,
            }
          : {}
      }
      transition={{ duration: 0.22 }}
      className={`bg-glass backdrop-blur-md border border-white/10 rounded-2xl ${className}`}
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset" }}
    >
      {children}
    </motion.div>
  );
}

/* ─── CTA button ──────────────────────────────────────────────────── */
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
  const base =
    "inline-flex items-center gap-2 font-bold rounded-xl px-7 py-3.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";
  const styles = {
    primary: "bg-accent-primary hover:bg-accent-secondary text-white",
    outline: "border border-white/20 text-text-primary hover:bg-white/5 hover:border-white/30",
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

/* ─── FAQ item ────────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-5 text-left text-text-primary font-semibold text-sm hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-lg px-1"
      >
        {q}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronDown size={16} className="text-text-secondary" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-text-secondary leading-relaxed pb-5 px-1">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const faqs = [
    {
      q: "Does Archon send my data to the cloud?",
      a: "Never. Archon's intelligence runs entirely inside a Rust WebAssembly enclave on your device. All AI inference, memory, and decision-making happens locally. The Cloudflare gateway handles billing and routing only — no personal data, no prompts, no context leaves your device.",
    },
    {
      q: "What happens if my device is compromised?",
      a: "Your cryptographic identity is sealed with Ed25519 keys generated on-device and stored in your OS secure enclave. A biometric-confirmed GDPR wipe permanently destroys all local state with a cryptographic proof of deletion.",
    },
    {
      q: "How does autonomous action work?",
      a: "Archon proposes Intents based on locally observed data. Every high-value action requires your explicit approval before execution. You configure risk thresholds per domain, and DeFi transactions above your limit always require biometric sign-off.",
    },
    {
      q: "What is the billing model?",
      a: "Archon uses just-in-time crypto-native billing. Each API tool call costs a micro-amount (default $0.10). You set a daily budget cap — when reached, all executions pause until the next day. Enterprise teams get per-seat controls and audit export.",
    },
    {
      q: "Is this available for Android?",
      a: "The current release targets iOS. Android support is in development. The WASM core is platform-agnostic — the primary blocker is completing Android Keystore integration for the secure enclave binding.",
    },
  ];

  return (
    <>
      <Head>
        <title>Archon — Zero-Cloud AI Twin</title>
        <meta name="description" content="Archon is an on-device AI twin that autonomously manages your life with military-grade encryption." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden selection:bg-accent-primary/30 selection:text-white">
        
        {/* ── BACKGROUND ────────────────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          
          {/* Breathing Ambient Glow 1 */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
              x: ["0%", "5%", "0%"],
              y: ["0%", "10%", "0%"]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-accent-primary/20 blur-[150px]"
          />
          
          {/* Breathing Ambient Glow 2 */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
              x: ["0%", "-5%", "0%"],
              y: ["0%", "-10%", "0%"]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-accent-secondary/20 blur-[150px]"
          />
        </div>

        {/* ── NAV ───────────────────────────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-bg-primary/80 backdrop-blur-xl"
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md overflow-hidden border border-accent-primary/20 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                <img src="/favicon.jpg" alt="Archon" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-text-primary tracking-tight">Archon</span>
            </Link>

            <div className="hidden md:flex items-center gap-7 text-sm text-text-secondary">
              {["#features", "#domains", "#privacy", "#faq"].map((href) => (
                <a key={href} href={href} className="hover:text-text-primary transition-colors capitalize">
                  {href.replace("#", "")}
                </a>
              ))}
            </div>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="text-sm font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </motion.nav>

        <main>
          {/* ── HERO ───────────────────────────────────────────── */}
          <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 px-6 overflow-hidden">
            <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 text-xs font-mono text-accent-secondary bg-accent-primary/10 border border-accent-primary/20 px-4 py-2 rounded-full mb-8"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                V1.0.4 Rust Enclave Live
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl sm:text-7xl lg:text-[5rem] font-extrabold tracking-tight text-text-primary leading-[1.05] mb-6"
              >
                Your AI Twin Acts.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-text-primary via-text-secondary to-accent-primary">
                  Your Data Never Leaves.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
              >
                Archon is an autonomous AI agent sealed inside a local WebAssembly enclave. It manages your life directly on your hardware, with zero cloud dependency.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              >
                <CTAButton href="/login" variant="primary">
                  Initialize Enclave <ArrowRight size={16} />
                </CTAButton>
                <CTAButton href="#features" variant="outline">
                  View Architecture
                </CTAButton>
              </motion.div>

              {/* Dynamic Visual Component */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <HeroVisual />
              </motion.div>
            </div>
          </section>

          {/* ── TRUST BAR ─────────────────────────────────────── */}
          <Section className="py-12 border-y border-white/5 bg-bg-secondary/40 backdrop-blur-md relative z-10">
            <div className="max-w-5xl mx-auto px-6">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center">
                {[
                  { label: "Rust + WASM", icon: <Cpu size={18} className="text-warning" /> },
                  { label: "Ed25519", icon: <Key size={18} className="text-accent-secondary" /> },
                  { label: "AES-256-GCM", icon: <Lock size={18} className="text-success" /> },
                  { label: "Cloudflare Edge", icon: <Globe size={18} className="text-info" /> },
                  { label: "X25519 DH", icon: <Shield size={18} className="text-pqc" /> },
                  { label: "W3C DID:key", icon: <CheckCircle size={18} className="text-crypto" /> },
                ].map((t) => (
                  <div key={t.label} className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-200">
                    {t.icon}
                    <span className="text-[10px] font-mono text-text-secondary text-center leading-tight">
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── STATS ─────────────────────────────────────────── */}
          <Section className="py-24 px-6 relative z-10">
            <div className="max-w-5xl mx-auto">
              <motion.div
                variants={stagger(0.12)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {[
                  { stat: 0,   suffix: " bytes", label: "Data sent to cloud",  color: "text-success",          note: "Zero. Ever." },
                  { stat: 256, suffix: "-bit",   label: "AES encryption",      color: "text-accent-secondary", note: "Military grade" },
                  { stat: 6,   suffix: " hubs",  label: "Life domains",        color: "text-pqc",              note: "Finance to travel" },
                  { stat: 5,   suffix: " min",   label: "JIT token lifetime",  color: "text-crypto",           note: "Minimal exposure" },
                ].map((s) => (
                  <motion.div key={s.label} variants={fadeUp}>
                    <GlassCard className="p-6 text-center" hover={false}>
                      <div className={`text-4xl font-mono mb-2 ${s.color}`}>
                        <AnimatedNumber target={s.stat} suffix={s.suffix} />
                      </div>
                      <div className="text-xs font-bold text-text-primary uppercase tracking-wide mb-1">
                        {s.label}
                      </div>
                      <div className="text-[10px] text-text-muted">{s.note}</div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </Section>

          {/* ── WORKFLOW INTERACTIVE ──────────────────────────── */}
          <div id="features" className="relative z-10">
            <WorkflowInteractive />
          </div>

          {/* ── BENTO GRID ────────────────────────────────────── */}
          <div id="domains" className="relative z-10">
            <BentoGrid />
          </div>

          {/* ── PRIVACY PANEL ─────────────────────────────────── */}
          <div id="privacy" className="relative z-10">
            <PrivacyPanel />
          </div>

          {/* ── FAQ ───────────────────────────────────────────── */}
          <Section id="faq" className="py-32 px-6 relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-text-primary mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-text-secondary text-lg">
                  Deep technical details on how Archon keeps you safe.
                </p>
              </div>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          </Section>

          {/* ── BOTTOM CTA ────────────────────────────────────── */}
          <Section className="py-32 px-6 border-t border-white/5 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-6">
                Reclaim your autonomy.
              </h2>
              <p className="text-text-secondary text-lg mb-10 max-w-2xl mx-auto">
                Join the beta today. Deploy your own local enclave and let Archon manage the noise while you focus on the signal.
              </p>
              <CTAButton href="/login" variant="primary" className="scale-110">
                Initialize Enclave
              </CTAButton>
            </div>
          </Section>
        </main>
        
        <footer className="py-10 border-t border-white/5 text-center relative z-10">
          <p className="text-text-muted text-xs font-mono">
            © {new Date().getFullYear()} Archon Intelligence. 
            <br />
            Math {'>'} Promises.
          </p>
        </footer>
      </div>
    </>
  );
}
