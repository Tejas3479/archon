import React from "react";
import { motion } from "framer-motion";

export function HeroVisual() {
  const lines = [
    { d: 0.0, t: "$ archon init --enclave wasm --crypto ed25519", c: "text-text-secondary" },
    { d: 0.4, t: "✓ Rust WASM enclave initialized (512KB)", c: "text-success" },
    { d: 0.8, t: "✓ Ed25519 keypair generated on-device", c: "text-success" },
    { d: 1.2, t: "✓ AES-256-GCM vault ready", c: "text-success" },
    { d: 1.5, t: "", c: "" },
    { d: 1.8, t: "$ archon agent.run --hub finance", c: "text-text-secondary" },
    { d: 2.3, t: "→ Detected: $12.99 subscription (unused 47 days)", c: "text-warning" },
    { d: 2.8, t: "→ Proposed: Cancel Netflix Basic", c: "text-accent-secondary" },
    { d: 3.3, t: "→ Awaiting your approval... approved.", c: "text-accent-secondary" },
    { d: 3.8, t: "✓ Action executed. $155.88/yr saved.", c: "text-success" },
    { d: 4.3, t: "✓ Audit log written. 0 bytes left device.", c: "text-success" },
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-16 h-[320px] sm:h-[400px] flex items-center justify-center pointer-events-none">
      
      {/* Background Ambient Glow & Enclave Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Deep ambient glow */}
        <div className="absolute w-[80%] h-[80%] bg-accent-primary/20 blur-[100px] rounded-full" />
        
        {/* Rotating Enclave Ring 1 */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full border border-accent-primary/10 border-dashed"
        />
        {/* Rotating Enclave Ring 2 */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full border border-accent-secondary/20 border-dotted"
        />
      </div>

      {/* Floating Status Badges */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute z-10 left-0 top-1/4 hidden md:flex items-center gap-2 bg-bg-elevated/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        <span className="text-[10px] font-mono text-text-primary">Zero Cloud Tracking</span>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute z-10 right-0 bottom-1/4 hidden md:flex items-center gap-2 bg-bg-elevated/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
        <span className="text-[10px] font-mono text-text-primary">AES-256-GCM Locked</span>
      </motion.div>

      {/* The Core Terminal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden font-mono text-xs bg-[#05080f]/90 backdrop-blur-2xl"
        style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 40px rgba(99,102,241,0.15)" }}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error/70" />
            <div className="w-3 h-3 rounded-full bg-warning/70" />
            <div className="w-3 h-3 rounded-full bg-success/70" />
          </div>
          <span className="text-text-muted text-[10px] font-sans tracking-wide">
            archon — local_enclave
          </span>
          <div className="w-4" /> {/* Spacer for symmetry */}
        </div>

        {/* Terminal Body */}
        <div className="p-5 space-y-2 min-h-[260px] text-[11px] sm:text-xs">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: l.d, duration: 0.2 }}
              className={l.c}
            >
              {l.t || <span className="opacity-0">-</span>}
            </motion.div>
          ))}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 4.8, repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-3.5 bg-accent-primary align-middle ml-1"
          />
        </div>
      </motion.div>

    </div>
  );
}
