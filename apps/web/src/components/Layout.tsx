import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();

  const navItems = [
    { label: "📊 Overview", path: "/dashboard" },
    { label: "👥 Team Members", path: "/team" },
    { label: "📜 Audit Compliance", path: "/audit" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl">🛡️</span>
            <div>
              <h2 className="font-bold text-sm">Archon Admin</h2>
              <span className="text-xs text-blue-400">Enterprise Suite</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = router.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 mt-6">
          <div className="text-xs text-slate-500 mb-3 truncate">
            Signed in as: <br />
            <span className="font-semibold text-slate-300">{session?.user?.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-lg transition-colors duration-150"
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
