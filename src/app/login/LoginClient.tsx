"use client";

import { useState } from "react";
import { signIn, signUp, toggleDemoMode } from "@/actions/auth";
import { Dumbbell, Sparkles, Lock, Mail, Building, ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginClient() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gymName, setGymName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    if (isSignUp) formData.append("gym_name", gymName);

    const res = isSignUp ? await signUp(formData) : await signIn(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleEnterDemo() {
    setLoading(true);
    await toggleDemoMode(true);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-950/50 mx-auto mb-3">
          <Dumbbell className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">GymOS Cloud Edition</h1>
        <p className="text-xs text-gray-400 mt-1">Multi-Tenant Gym Management Platform</p>
      </div>

      {/* Demo Bypass Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 border border-amber-800/60 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-amber-950 border border-amber-700 text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-amber-200">Instant Live Demo Mode</h3>
            <p className="text-[11px] text-amber-300/80 mt-0.5">
              Explore the full system immediately with a seeded gym tenant ("Anytime Fitness Gym"), 4 plans, members, floor check-ins, and payments.
            </p>
            <button
              onClick={handleEnterDemo}
              disabled={loading}
              className="mt-2.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center shadow"
            >
              Enter Live Demo Tenant <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Auth Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-white flex items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" />
            {isSignUp ? "Create Gym Owner Account" : "Gym Owner / Staff Login"}
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-emerald-400 hover:underline"
          >
            {isSignUp ? "Sign In instead" : "Register new gym"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Gym / Fitness Center Name *</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Iron Forge Fitness"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="email"
                required
                placeholder="owner@yourgym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition shadow disabled:opacity-50"
          >
            {loading
              ? "Authenticating..."
              : isSignUp
              ? "Create Account & Auto-provision Gym"
              : "Sign In to GymOS"}
          </button>
        </form>
      </div>
    </div>
  );
}
