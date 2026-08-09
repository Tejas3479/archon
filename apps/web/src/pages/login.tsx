import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@company.com");
  const [password, setPassword] = useState("password");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl">🛡️</span>
          <h1 className="text-2xl font-bold mt-4">Archon Enterprise Portal</h1>
          <p className="text-sm text-slate-400 mt-2">Sign in using Single Sign-On (SSO)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Company Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">SSO Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg text-sm transition-colors duration-200 mt-6"
          >
            {loading ? "Verifying Session..." : "Secure SSO Login"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <button
            onClick={() => signIn("credentials", { email: "viewer@company.com", password: "password", callbackUrl: "/dashboard" })}
            className="text-xs text-slate-400 hover:text-slate-300"
          >
            Or sign in as read-only Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
