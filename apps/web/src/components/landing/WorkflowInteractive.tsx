import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Brain, Fingerprint, Zap, CheckCircle2 } from "lucide-react";

export function WorkflowInteractive() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  // Tighter animation steps
  const step1Opacity = useTransform(scrollYProgress, [0, 0.2, 0.35], [0, 1, 0]);
  const step2Opacity = useTransform(scrollYProgress, [0.25, 0.45, 0.6], [0, 1, 0]);
  const step3Opacity = useTransform(scrollYProgress, [0.5, 0.7, 0.85], [0, 1, 0]);
  const step4Opacity = useTransform(scrollYProgress, [0.75, 0.9, 1], [0, 1, 1]);

  return (
    <section ref={containerRef} className="py-24 relative max-w-6xl mx-auto px-6">
      
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="grid md:grid-cols-2 gap-16 relative">
        
        {/* Left Side: Sticky High-Fidelity Visuals */}
        <div className="h-[400px] md:h-[500px] sticky top-32 flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-square">
            
            {/* Step 1 Visual: Scanning Device */}
            <motion.div style={{ opacity: step1Opacity, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }} className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary border border-white/10 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-20" />
              <Search className="text-warning mb-6 relative z-10" size={40} />
              <div className="w-[80%] space-y-3 relative z-10">
                <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
                  <span>Scanning local mail.db</span>
                  <span className="text-warning">99%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-warning" animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                </div>
                {/* Fake logs */}
                <div className="mt-4 p-3 bg-bg-primary rounded-lg border border-white/5 font-mono text-[9px] text-text-muted space-y-1">
                  <div className="opacity-50">&gt; Indexing 4,021 emails...</div>
                  <div className="opacity-70">&gt; Cross-referencing Plaid txns...</div>
                  <div className="text-warning">&gt; Anomaly detected: Netflix.</div>
                </div>
              </div>
            </motion.div>

            {/* Step 2 Visual: ANNEAL Engine */}
            <motion.div style={{ opacity: step2Opacity, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }} className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary border border-white/10 rounded-3xl overflow-hidden">
              <Brain className="text-accent-primary mb-6" size={40} />
              <div className="w-[80%]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                  <span className="font-mono text-xs text-text-primary">Reasoning Path</span>
                </div>
                <div className="space-y-2 font-mono text-[10px]">
                  <div className="p-2 rounded bg-bg-primary border border-white/5 text-text-secondary flex justify-between">
                    <span>Usage check:</span> <span className="text-error">0 hrs (47d)</span>
                  </div>
                  <div className="p-2 rounded bg-bg-primary border border-white/5 text-text-secondary flex justify-between">
                    <span>Monthly cost:</span> <span className="text-text-primary">$12.99</span>
                  </div>
                  <div className="p-2 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-secondary flex justify-between items-center">
                    <span>Synthesize Intent:</span> 
                    <span className="bg-accent-primary text-white px-1.5 py-0.5 rounded text-[8px]">CANCEL</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 3 Visual: Biometric Auth */}
            <motion.div style={{ opacity: step3Opacity, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }} className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary border border-white/10 rounded-3xl overflow-hidden">
              <div className="text-center mb-8">
                <p className="text-sm font-bold text-text-primary mb-1">Approval Required</p>
                <p className="text-[10px] text-text-muted">Cancel Netflix Basic ($12.99/mo)</p>
              </div>
              <motion.div 
                animate={{ boxShadow: ["0 0 0 0 rgba(16, 185, 129, 0)", "0 0 0 20px rgba(16, 185, 129, 0.1)", "0 0 0 0 rgba(16, 185, 129, 0)"] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 rounded-full border border-success/30 flex items-center justify-center bg-success/5"
              >
                <Fingerprint size={48} className="text-success" />
              </motion.div>
            </motion.div>

            {/* Step 4 Visual: Zero-Knowledge Exec */}
            <motion.div style={{ opacity: step4Opacity, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }} className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary border border-white/10 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-success/5" />
              <CheckCircle2 className="text-success mb-6 relative z-10" size={48} />
              <div className="w-[80%] relative z-10 space-y-4">
                <p className="font-mono text-sm text-text-primary text-center">Intent Executed</p>
                <div className="p-3 bg-bg-primary rounded-lg border border-success/20 font-mono text-[9px] text-success/80">
                  <div className="opacity-50">{"// ZK Proof Sent"}</div>
                  <div>{"proof: 0x8f2a...91bc"}</div>
                  <div>{"status: success"}</div>
                  <div>{"cost: 0.10 Credits"}</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Right Side: Scroll Content (Tighter Spacing) */}
        <div className="py-24 space-y-48">
          
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">1. Constant Vigilance</h3>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed">
              Archon lives on your device, constantly indexing your local data (emails, bank statements, messages) without ever sending a single byte to the cloud. It silently looks for inefficiencies, risks, and opportunities.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">2. Local Intelligence</h3>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed">
              When an opportunity is found, the built-in ANNEAL engine synthesizes a plan of action. No OpenAI API calls. No third-party servers. Pure local reasoning executed inside the WASM sandbox.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">3. You Keep the Keys</h3>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed">
              Archon cannot act without your explicit consent. Intents are queued in your local vault, waiting for your cryptographic signature. You are the final arbiter of every action.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">4. Zero-Knowledge Execution</h3>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed">
              Once approved, a zero-knowledge proof is generated and sent to the Archon Edge Gateway to execute the API call, ensuring even we don't know the contents of your intent.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
