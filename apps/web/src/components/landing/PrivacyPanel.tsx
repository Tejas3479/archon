import React from "react";
import { motion } from "framer-motion";
import { LockKeyhole, FileCode2 } from "lucide-react";

export function PrivacyPanel() {
  const codeSnippet = `// archon-core/src/vault.rs
pub struct Vault {
    key: [u8; 32], // Derived from Ed25519 identity seed
    nonce_seq: AtomicU64,
}

impl Vault {
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, CryptoError> {
        let nonce = self.generate_nonce();
        let cipher = Aes256Gcm::new(self.key.into());
        
        // Zero-knowledge encryption: data is sealed locally 
        // before any network transmission occurs.
        cipher.encrypt(&nonce, plaintext)
    }
}`;

  return (
    <section className="py-24 relative overflow-hidden bg-bg-secondary/50 border-t border-white/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs font-mono mb-4">
            <LockKeyhole size={14} /> Open Source Cryptography
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-text-primary">
            Math, Not Promises.
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            We don't ask you to trust our privacy policy. We ask you to trust mathematics. 
            Every intent, log, and piece of data is encrypted on-device using AES-256-GCM. 
            The decryption key never leaves your local hardware.
          </p>
          <ul className="space-y-4 mt-8">
            <li className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-bg-elevated border border-white/10 flex items-center justify-center text-accent-secondary">
                <span className="text-[10px]">1</span>
              </div>
              <div>
                <strong className="block text-text-primary">Ed25519 Identity</strong>
                <span className="text-sm text-text-muted">Generated locally on first boot.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-bg-elevated border border-white/10 flex items-center justify-center text-accent-secondary">
                <span className="text-[10px]">2</span>
              </div>
              <div>
                <strong className="block text-text-primary">WASM Memory Isolation</strong>
                <span className="text-sm text-text-muted">Engine runs in a sandboxed V8 context.</span>
              </div>
            </li>
          </ul>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl bg-bg-primary border border-white/10 p-1 overflow-hidden"
          style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}
        >
          <div className="flex items-center gap-2 px-4 py-3 bg-bg-elevated/50 border-b border-white/10">
            <FileCode2 size={16} className="text-text-muted" />
            <span className="font-mono text-xs text-text-muted">src/vault.rs</span>
          </div>
          <pre className="p-6 overflow-x-auto text-sm font-mono text-text-secondary leading-relaxed">
            <code>{codeSnippet}</code>
          </pre>
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
