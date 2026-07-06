"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LineChart, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // LOGIN EMAIL
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-4 text-white">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* HEADER */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-teal-500 text-white p-4 rounded-2xl shadow-lg">
            <LineChart size={36} />
          </div>

          <h1 className="text-2xl font-bold mt-3">ChurnGuard Admin</h1>

          <p className="text-gray-400 text-sm mt-1 text-center">
            Masuk untuk mengakses dashboard prediksi churn
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label className="block text-sm text-gray-300">Email</label>
            <input
              type="email"
              className="mt-1 w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
              placeholder="admin@churnguard.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="mt-1 w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:ring-2 focus:ring-teal-500 outline-none text-sm pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {/* LOGIN EMAIL BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 py-3 rounded-lg font-semibold transition disabled:opacity-70"
          >
            {loading ? "Memproses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © 2026 ChurnGuard DSS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
