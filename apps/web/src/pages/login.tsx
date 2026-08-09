import React, { useState } from "react";
import Head from "next/head";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials. Please enter a valid email.");
      setLoading(false);
    }
  };

  return (
    <>
    <Head>
      <title>Sign In — Archon Enterprise Portal</title>
      <meta name="description" content="Sign in to the Archon Enterprise Dashboard." />
    </Head>
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.3)] shadow-accent-glow">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-accent-glow p-4 rounded-full text-accent-primary mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold mt-2 text-text-primary">Archon Enterprise Portal</h1>
          <p className="text-sm text-text-secondary mt-2">Sign in using Single Sign-On (SSO)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-2 tracking-wide">Company Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              aria-label="Company email address"
              className="w-full bg-bg-elevated border border-white/10 rounded-lg p-3 text-text-primary text-sm focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-2 tracking-wide">SSO Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-label="SSO password"
              className="w-full bg-bg-elevated border border-white/10 rounded-lg p-3 text-text-primary text-sm focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-secondary text-white font-bold p-3 rounded-lg text-sm transition-all duration-150 mt-6 shadow-[0_0_16px_rgba(99,102,241,0.2)] hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Verifying Session..." : "Secure SSO Login"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button
            onClick={() => signIn("credentials", { email: "viewer@company.com", password: "password", callbackUrl: "/dashboard" })}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Or sign in as read-only Viewer
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
