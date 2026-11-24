"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/actions/auth";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import { useTheme } from "@/components/ThemeProvider";
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
  QrCode,
  UserPlus,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export function LoginClient() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("password", password);

    const res = await signIn(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-app flex flex-col justify-center py-8 px-4">
      <div className="max-w-md w-full mx-auto relative">
        {/* Top Controls: Theme Switcher */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-full bg-surface border border-theme text-muted-theme hover:text-main transition shadow-xs flex items-center gap-1.5 text-xs font-bold"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3 relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-75 pointer-events-none" />
            <div className="relative p-2.5 rounded-2xl bg-white dark:bg-[#14161A] border border-theme shadow-md">
              <FitnessPlanetLogo size="md" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-main tracking-tight uppercase font-display">
            Fitness Planet Unisex Gym
          </h1>
          <p className="text-xs text-muted-theme mt-1 font-medium">
            Sikandrabad • Owner: <strong className="text-main">Kapil Rajput</strong>
          </p>
        </div>

        {/* Admin Login Card */}
        <div className="bg-white dark:bg-[#14161A] border border-[#E5E7EB] dark:border-[#262932] rounded-[22px] p-6 sm:p-7 shadow-[0_10px_30px_rgba(17,18,20,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-theme">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#C6F459] text-[#111214] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 stroke-[2.25]" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-main font-display leading-tight">
                  Admin Control Login
                </h2>
                <p className="text-[11px] text-muted-theme">
                  Sign in with owner username or email
                </p>
              </div>
            </div>
            <span className="owner-pill font-display">Admin</span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-main mb-1.5">
                Username or Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-muted-theme" />
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="kapilrajput"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-app border border-theme rounded-xl text-xs text-main placeholder-dim-theme focus:outline-none focus:border-[#111214] dark:focus:border-[#C6F459] font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-main mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-muted-theme" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-app border border-theme rounded-xl text-xs text-main placeholder-dim-theme focus:outline-none focus:border-[#111214] dark:focus:border-[#C6F459] font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-theme hover:text-main p-0.5"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 bg-[#111214] hover:opacity-90 dark:bg-[#C6F459] dark:hover:bg-[#B8E946] text-white dark:text-[#111214] rounded-xl text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              <span>{loading ? "Verifying Credentials..." : "Sign In to Dashboard"}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-[11px] text-muted-theme text-center mt-4 pt-4 border-t border-subtle-theme">
            Credentials &amp; password can be changed anytime inside{" "}
            <strong className="text-main">Settings &rarr; Security &amp; Credentials</strong>.
          </p>
        </div>

        {/* Public Touchpoints Quick Links */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Link
            href="/checkin/fitness-planet-sikandrabad"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white dark:bg-[#14161A] border border-theme text-xs font-bold text-main hover:bg-surface-hover transition shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-500" />
            <span>Reception Kiosk</span>
          </Link>
          <Link
            href="/join/fitness-planet-sikandrabad"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white dark:bg-[#14161A] border border-theme text-xs font-bold text-main hover:bg-surface-hover transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Member Registration</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
