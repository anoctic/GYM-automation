"use client";

import { useState } from "react";
import { signIn, signUp, toggleDemoMode } from "@/actions/auth";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sparkles,
  Lock,
  Mail,
  Building,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginClient() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="max-w-md mx-auto py-8 px-4 relative">
      {/* Top Controls: Theme Switcher */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-surface border border-theme text-muted-theme hover:text-main transition shadow-xs flex items-center gap-1.5 text-xs font-semibold"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Brand Header with Custom SVG Logo */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="p-2 rounded-2xl bg-surface/80 border border-theme shadow-md shadow-emerald-950/20">
            <FitnessPlanetLogo size="md" />
          </div>
        </div>
        <h1 className="text-xl font-black text-main tracking-tight uppercase">
          Fitness Planet Unisex Gym
        </h1>
        <p className="text-xs text-muted-theme mt-0.5">
          Sikandrabad • Owner: Kapil Rajput • GymOS Cloud Edition
        </p>
      </div>

      {/* Instant Demo Bypass Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 shadow-xs">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-main">Instant Live Demo Mode</h3>
            <p className="text-[11px] text-muted-theme mt-0.5 leading-relaxed">
              Explore Kapil Rajput's active gym dashboard with 120 members, plans, attendance, WhatsApp outreach & dynamic UPI QR codes.
            </p>
            <button
              onClick={handleEnterDemo}
              disabled={loading}
              className="mt-3 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs transition flex items-center shadow-xs"
            >
              Enter Live Demo as Kapil Rajput <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Auth Form */}
      <div className="bg-surface border border-theme rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-theme">
          <h2 className="text-xs font-bold text-main flex items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mr-2" />
            {isSignUp ? "Create Gym Owner Account" : "Gym Owner / Staff Sign In"}
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-emerald-500 font-semibold hover:underline"
          >
            {isSignUp ? "Sign In instead" : "Register new gym"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-main mb-1">
                Gym / Fitness Center Name *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-2.5 text-muted-theme" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Fitness Planet Unisex Gym"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-main mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-theme" />
              <input
                type="email"
                required
                placeholder="kapilrajput.fitnessplanet@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-main mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-theme" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-theme hover:text-main"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/40 disabled:opacity-50"
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
