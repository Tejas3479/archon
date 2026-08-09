import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Users, ShieldCheck, Shield } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Team Members", path: "/team", icon: <Users size={18} /> },
    { label: "Audit Compliance", path: "/audit", icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-bg-secondary border-r border-white/5 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-accent-primary" size={28} />
            <div>
              <h2 className="font-bold text-sm text-text-primary">Archon Admin</h2>
              <span className="text-xs text-accent-secondary">Enterprise Suite</span>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = router.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    active
                      ? "bg-accent-glow text-accent-secondary border-l-2 border-accent-primary"
                      : "text-text-secondary hover:bg-white/5 hover:text-text-primary border-l-2 border-transparent"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 mt-6">
          <div className="text-xs text-text-muted mb-3 truncate">
            Signed in as: <br />
            <span className="font-mono text-text-secondary">{session?.user?.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 text-xs font-bold py-2.5 rounded-lg transition-colors duration-150"
          >
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
