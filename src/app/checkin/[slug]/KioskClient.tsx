"use client";

import { useState, useEffect } from "react";
import { kioskToggleCheckInOut, type KioskCheckInResult } from "@/actions/kiosk";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import type { Gym } from "@/types/database";
import {
  QrCode,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
} from "lucide-react";

interface KioskClientProps {
  gym: Gym;
  activeFloorCount: number;
}

export function KioskClient({ gym, activeFloorCount }: KioskClientProps) {
  const [memberCode, setMemberCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KioskCheckInResult | null>(null);
  const [floorCount, setFloorCount] = useState(activeFloorCount);
  const [currentTime, setCurrentTime] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);

  // Live Clock
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-reset countdown after successful check-in/out
  useEffect(() => {
    if (!result?.success) return;
    setCountdown(4);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setResult(null);
          setMemberCode("");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [result]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!memberCode.trim()) return;

    setLoading(true);
    const res = await kioskToggleCheckInOut(gym.slug || gym.id, memberCode);
    setLoading(false);
    setResult(res);

    if (res.success) {
      if (res.action === "CHECKED_IN") {
        setFloorCount((prev) => prev + 1);
      } else if (res.action === "CHECKED_OUT") {
        setFloorCount((prev) => Math.max(0, prev - 1));
      }
    }
  }

  function handleQuickKey(digit: string) {
    setMemberCode((prev) => prev + digit);
  }

  function handleBackspace() {
    setMemberCode((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setMemberCode("");
    setResult(null);
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Kiosk Branding Header */}
      <div className="bg-surface border border-theme rounded-3xl p-6 shadow-xl text-center relative overflow-hidden mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-1 rounded-xl bg-app border border-theme shadow-xs">
              <FitnessPlanetLogo size="sm" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-black text-main leading-tight uppercase">
                {gym.name || "Fitness Planet Unisex Gym"}
              </h1>
              <span className="text-xs text-muted-theme">Self-Service Desk Kiosk • Sikandrabad</span>
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono text-sm font-bold text-emerald-500 block">{currentTime}</span>
            <span className="text-[11px] text-muted-theme">
              {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>

        {/* Live Occupancy Metric */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-app border border-theme text-xs shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-muted-theme">Currently Working Out on Floor:</span>
          <strong className="text-emerald-500 font-bold font-mono">{floorCount} Active Members</strong>
        </div>
      </div>

      {/* Main Kiosk Card */}
      {result?.success ? (
        <div className="bg-surface border border-emerald-500/50 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {result.action === "CHECKED_IN" ? (
            <div>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 text-emerald-500">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-500 block mb-1">
                Entry Approved
              </span>
              <h2 className="text-2xl font-black text-main">Welcome, {result.member?.full_name}!</h2>
              <p className="text-sm text-muted-theme mt-1">
                Have a powerhouse workout today! (Session #{result.member?.total_sessions})
              </p>

              <div className="mt-6 p-4 bg-app rounded-2xl text-xs max-w-sm mx-auto space-y-2 border border-theme">
                <div className="flex justify-between text-muted-theme">
                  <span>Membership Plan:</span>
                  <span className="font-bold text-main">{result.member?.plan_name || "Active Plan"}</span>
                </div>
                <div className="flex justify-between text-muted-theme">
                  <span>Valid Expiry:</span>
                  <span className="font-mono text-emerald-500 font-bold">{formatDate(result.member?.expiry_date)}</span>
                </div>
                {result.member && result.member.pending_dues > 0 && (
                  <div className="flex justify-between text-amber-500 pt-2 border-t border-theme font-bold">
                    <span>⚠️ Pending Dues Reminder:</span>
                    <span className="font-mono">{formatCurrency(result.member.pending_dues)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center mx-auto mb-4 text-blue-500">
                <LogOut className="w-10 h-10" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-blue-500 block mb-1">
                Checked Out
              </span>
              <h2 className="text-2xl font-black text-main">Goodbye, {result.member?.full_name}!</h2>
              <p className="text-sm text-muted-theme mt-1">
                Great workout session completed! Rest and recover well.
              </p>

              <div className="mt-6 p-4 bg-app rounded-2xl text-xs max-w-sm mx-auto space-y-2 border border-theme">
                <div className="flex justify-between text-muted-theme">
                  <span>Workout Duration:</span>
                  <span className="font-bold text-emerald-500 text-sm font-mono">{result.durationText}</span>
                </div>
                <div className="flex justify-between text-muted-theme">
                  <span>Total Completed Sessions:</span>
                  <span className="font-mono text-main font-bold">{result.member?.total_sessions}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-xs text-muted-theme flex items-center justify-center space-x-1">
            <span>Resetting screen in {countdown}s...</span>
            <button
              onClick={() => {
                setResult(null);
                setMemberCode("");
              }}
              className="text-emerald-500 hover:underline font-bold ml-2"
            >
              Next Member
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-theme rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-500">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-main">Enter Member Code or Scan QR</h2>
            <p className="text-xs text-muted-theme mt-1">
              Type your member code (e.g. <strong className="text-emerald-500 font-mono">FP-93</strong> or just <strong className="text-emerald-500 font-mono">93</strong>) to check in or out.
            </p>
          </div>

          {result?.error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{result.error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Input */}
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="e.g. FP-93"
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value)}
                className="w-full text-center py-4 bg-app border-2 border-emerald-500/50 rounded-2xl text-2xl font-mono font-black tracking-wider text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>

            {/* Quick Touch Keypad for Tablets & Touch Kiosks */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "FP-", "0", "⌫"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === "⌫") handleBackspace();
                    else handleQuickKey(key);
                  }}
                  className="py-3.5 bg-app hover:bg-surface active:scale-95 text-main font-mono font-bold rounded-2xl text-lg transition shadow-xs border border-theme"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={handleClear}
                className="w-1/3 py-3.5 bg-app hover:bg-surface text-muted-theme hover:text-main rounded-2xl text-xs font-bold transition border border-theme"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || !memberCode.trim()}
                className="w-2/3 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-sm font-black transition shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2"
              >
                <Flame className="w-4 h-4" />
                <span>{loading ? "Verifying..." : "Check In / Out Now"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
