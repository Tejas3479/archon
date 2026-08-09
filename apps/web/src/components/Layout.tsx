import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Users, ShieldCheck, Shield, Menu, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Team Members", path: "/team", icon: <Users size={18} /> },
    { label: "Audit Compliance", path: "/audit", icon: <ShieldCheck size={18} /> },
  ];

  const SidebarContent = () => (
    <>
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="p-1.5 rounded-lg bg-accent-glow border border-accent-primary/20">
            <Shield className="text-accent-primary" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-text-primary tracking-tight">Archon Admin</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider text-accent-secondary">Enterprise Suite</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = router.pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-accent-primary/10 text-accent-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-accent-primary/20"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-white/10 mt-6">
        <div className="bg-bg-elevated border border-white/5 p-3 rounded-xl mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Active Session
          </div>
          <div className="text-xs font-mono text-text-primary truncate">
            {session?.user?.email || "admin@archon.app"}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-error/10 text-text-secondary hover:text-error border border-white/10 hover:border-error/20 text-xs font-bold py-2.5 rounded-xl transition-all duration-200"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-bg-secondary/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Shield className="text-accent-primary" size={20} />
          <span className="font-bold text-sm">Archon</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary focus:outline-none"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Off-canvas Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-bg-secondary border-r border-white/10 p-6 flex flex-col justify-between z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
            >
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-bg-secondary border-r border-white/10 p-6 flex-col justify-between sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto w-full max-w-[1200px] mx-auto">
        {children}
      </main>
    </div>
  );
}
