"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  kioskToggleCheckInOut,
  getMemberActiveKioskSession,
  type KioskCheckInResult,
} from "@/actions/kiosk";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import type { AttendanceLog, Gym } from "@/types/database";
import {
  QrCode,
  LogOut,
  AlertTriangle,
  Clock,
  ArrowRight,
  Flame,
  UserPlus,
  Timer,
  Square,
  Play,
  ExternalLink,
  Users,
  Smartphone,
} from "lucide-react";

interface KioskClientProps {
  gym: Gym;
  initialActiveSessions: AttendanceLog[];
  initialMode?: "desk" | "self";
}

function formatStopwatch(startIso: string, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((nowMs - new Date(startIso).getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
}

export function KioskClient({
  gym,
  initialActiveSessions,
  initialMode = "desk",
}: KioskClientProps) {
  const gymSlug = gym.slug || "fitness-planet-sikandrabad";
  const storageKey = `gymos_kiosk_active_${gymSlug}`;

  const [viewMode, setViewMode] = useState<"desk" | "self">(initialMode);
  const [memberCode, setMemberCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KioskCheckInResult | null>(null);
  const [activeSessions, setActiveSessions] = useState<AttendanceLog[]>(initialActiveSessions);
  const [personalActiveSession, setPersonalActiveSession] = useState<AttendanceLog | null>(null);

  // Live clock & stopwatch tick (1s)
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [currentTime, setCurrentTime] = useState("");
  const [enrollQrUrl, setEnrollQrUrl] = useState<string | null>(null);
  const [checkInQrUrl, setCheckInQrUrl] = useState<string | null>(null);

  // Update ticking 1s clock for live stopwatch timers
  useEffect(() => {
    function tick() {
      const now = new Date();
      setNowMs(now.getTime());
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate Both Scannable QR Codes (Self-Enrollment + Self Check-In)
  useEffect(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://gym-automation-two.vercel.app";
    const enrollTargetUrl = `${origin}/join/${gymSlug}`;
    const checkInTargetUrl = `${origin}/checkin/${gymSlug}?mode=self`;

    QRCode.toDataURL(enrollTargetUrl, {
      width: 260,
      margin: 2,
      color: { dark: "#111214", light: "#ffffff" },
    })
      .then(setEnrollQrUrl)
      .catch(() => {});

    QRCode.toDataURL(checkInTargetUrl, {
      width: 260,
      margin: 2,
      color: { dark: "#111214", light: "#ffffff" },
    })
      .then(setCheckInQrUrl)
      .catch(() => {});
  }, [gymSlug]);

  // On mobile self check-in mode, restore any active timer for the member from localStorage + DB
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCode = localStorage.getItem(storageKey);
    if (!savedCode) return;

    getMemberActiveKioskSession(gymSlug, savedCode).then((res) => {
      if (res.activeSession) {
        setPersonalActiveSession(res.activeSession);
        setMemberCode(res.memberCode || savedCode);
      } else {
        localStorage.removeItem(storageKey);
      }
    });
  }, [gymSlug, storageKey]);

  const executeToggle = useCallback(
    async (codeToUse: string) => {
      if (!codeToUse.trim()) return;
      setLoading(true);
      const res = await kioskToggleCheckInOut(gymSlug, codeToUse);
      setLoading(false);
      setResult(res);

      if (res.success && res.session) {
        if (res.action === "CHECKED_IN") {
          setActiveSessions((prev) => {
            const filtered = prev.filter((s) => s.id !== res.session!.id);
            return [res.session!, ...filtered];
          });
          if (viewMode === "self") {
            setPersonalActiveSession(res.session);
            if (typeof window !== "undefined" && res.member?.member_code) {
              localStorage.setItem(storageKey, res.member.member_code);
            }
          }
          setMemberCode("");
        } else if (res.action === "CHECKED_OUT") {
          setActiveSessions((prev) => prev.filter((s) => s.id !== res.session!.id));
          setPersonalActiveSession(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(storageKey);
          }
          setMemberCode("");
        }
      }
    },
    [gymSlug, storageKey, viewMode]
  );

  // Auto-reset confirmation card ONLY in Desk Kiosk mode after check-out or if user prefers
  useEffect(() => {
    if (!result?.success || viewMode === "self") return;
    const timer = setTimeout(() => {
      setResult(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [result, viewMode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeToggle(memberCode);
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
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 pb-16">
      {/* Kiosk Branding Header */}
      <div className="bg-white dark:bg-[#14161A] border border-theme rounded-[22px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(17,18,20,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-xl bg-app border border-theme shadow-xs">
              <FitnessPlanetLogo size="sm" src={gym.logo_url} />
            </div>
            <div>
              <h1 className="text-lg font-black text-main leading-tight uppercase font-display">
                {gym.name || "Fitness Planet Unisex Gym"}
              </h1>
              <span className="text-xs text-muted-theme font-medium">
                Self-Service Reception Kiosk • Sikandrabad
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 dark:text-emerald-400 font-bold font-display tabular-nums">
                {activeSessions.length} On Floor
              </span>
            </div>

            <div className="text-right">
              <span className="font-mono text-sm font-bold text-main block tabular-nums">
                {currentTime || "--:--:--"}
              </span>
              <span className="text-[11px] text-muted-theme">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="mt-4 pt-4 border-t border-subtle-theme flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-xl bg-app border border-theme">
            <button
              type="button"
              onClick={() => setViewMode("desk")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "desk"
                  ? "bg-[#111214] text-white dark:bg-[#C6F459] dark:text-[#111214] shadow-xs"
                  : "text-muted-theme hover:text-main"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Dual-QR Desk Display</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("self")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "self"
                  ? "bg-[#111214] text-white dark:bg-[#C6F459] dark:text-[#111214] shadow-xs"
                  : "text-muted-theme hover:text-main"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Self Check-In &amp; Timer</span>
            </button>
          </div>

          <Link
            href={`/join/${gymSlug}`}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Open Self-Enrollment Form</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* SECTION 1: TWO QR CODES (Self-Enrollment QR + Self Check-In QR) */}
      {viewMode === "desk" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* QR 1: Self-Enrollment QR Code */}
          <div className="bg-white dark:bg-[#14161A] border border-theme rounded-[22px] p-5 shadow-sm flex flex-col items-center text-center justify-between space-y-4">
            <div className="space-y-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                QR 1 • New Member
              </span>
              <h2 className="text-lg font-extrabold text-main font-display">
                Self-Enrollment Registration
              </h2>
              <p className="text-xs text-muted-theme">
                Naye members is QR ko scan karke apna registration form khud fill kar sakte hain.
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-[#111214] shadow-sm">
              {enrollQrUrl ? (
                <img src={enrollQrUrl} alt="Self Enrollment QR Code" className="w-44 h-44" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <Link
              href={`/join/${gymSlug}`}
              className="w-full py-2.5 px-4 rounded-xl bg-[#C6F459] hover:bg-[#B8E946] text-[#111214] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Open Registration Window</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* QR 2: Self Check-In & Check-Out Timer QR Code */}
          <div className="bg-white dark:bg-[#14161A] border border-theme rounded-[22px] p-5 shadow-sm flex flex-col items-center text-center justify-between space-y-4">
            <div className="space-y-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                QR 2 • Existing Member
              </span>
              <h2 className="text-lg font-extrabold text-main font-display">
                Self Check-In &amp; Workout Timer
              </h2>
              <p className="text-xs text-muted-theme">
                Scan karne par check-in time start ho jayega, aur check-out par timer stop hoga.
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-[#111214] shadow-sm">
              {checkInQrUrl ? (
                <img src={checkInQrUrl} alt="Self Check-In QR Code" className="w-44 h-44" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewMode("self")}
              className="w-full py-2.5 px-4 rounded-xl bg-[#111214] dark:bg-slate-800 hover:opacity-90 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Timer className="w-4 h-4 text-[#C6F459]" />
              <span>Switch to Self Check-In Pad</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: PERSONAL LIVE STOPWATCH CARD (When checked in on mobile self mode) */}
      {personalActiveSession && (
        <div className="bg-[#111214] text-white rounded-[24px] p-6 sm:p-8 shadow-2xl border border-emerald-500/40 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#C6F459] animate-ping" />
            <span>WORKOUT TIMER RUNNING</span>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-semibold">
              {personalActiveSession.members?.member_code} • {personalActiveSession.members?.full_name}
            </div>
            <div className="text-5xl sm:text-6xl font-black font-display tracking-tight tabular-nums text-[#C6F459] mt-2">
              {formatStopwatch(personalActiveSession.check_in_at, nowMs)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Started at <strong className="text-white">{formatTime(personalActiveSession.check_in_at)}</strong>
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              executeToggle(
                personalActiveSession.members?.member_code || memberCode
              )
            }
            className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>{loading ? "Stopping Timer..." : "Check Out & Stop Timer"}</span>
          </button>
        </div>
      )}

      {/* SECTION 3: RESULT SCREEN (CHECKED_IN or CHECKED_OUT summary) */}
      {result?.success && !personalActiveSession && (
        <div className="bg-white dark:bg-[#14161A] border-2 border-emerald-500/60 rounded-[24px] p-7 text-center shadow-xl space-y-4">
          {result.action === "CHECKED_IN" ? (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <Play className="w-7 h-7 fill-current ml-0.5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Check-In Confirmed • Timer Started
                </span>
                <h2 className="text-2xl font-black text-main mt-1 font-display">
                  Welcome, {result.member?.full_name}!
                </h2>
                <p className="text-xs text-muted-theme mt-1">
                  Started at <strong>{result.session ? formatTime(result.session.check_in_at) : "Now"}</strong> • Session #{result.member?.total_sessions}
                </p>
              </div>

              {result.session && (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#111214] text-[#C6F459] font-display font-black text-3xl tabular-nums">
                  <Timer className="w-6 h-6" />
                  <span>{formatStopwatch(result.session.check_in_at, nowMs)}</span>
                </div>
              )}

              <div className="max-w-sm mx-auto p-3.5 rounded-2xl bg-app border border-theme text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-theme">Member Code:</span>
                  <span className="mono-pill">{result.member?.member_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-theme">Membership Plan:</span>
                  <span className="font-bold text-main">{result.member?.plan_name || "Active Plan"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-theme">Valid Till:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatDate(result.member?.expiry_date)}
                  </span>
                </div>
                {result.member && result.member.pending_dues > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 pt-1.5 border-t border-theme font-bold">
                    <span>Pending Dues Reminder:</span>
                    <span className="font-mono">{formatCurrency(result.member.pending_dues)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-blue-500/15 border-2 border-blue-500 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                <LogOut className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Checked Out • Timer Stopped
                </span>
                <h2 className="text-2xl font-black text-main mt-1 font-display">
                  Great Workout, {result.member?.full_name}!
                </h2>
              </div>

              <div className="max-w-sm mx-auto p-4 rounded-2xl bg-app border border-theme text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-theme">Workout Duration:</span>
                  <span className="font-display font-extrabold text-emerald-600 dark:text-emerald-400 text-base tabular-nums">
                    {result.durationText}
                  </span>
                </div>
                {result.session && (
                  <div className="flex justify-between text-muted-theme">
                    <span>In / Out Time:</span>
                    <span className="font-mono font-semibold text-main">
                      {formatTime(result.session.check_in_at)} - {formatTime(result.session.check_out_at)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-muted-theme">
                  <span>Total Sessions:</span>
                  <span className="font-mono font-bold text-main">{result.member?.total_sessions}</span>
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setMemberCode("");
            }}
            className="px-5 py-2 rounded-xl bg-app hover:bg-surface border border-theme text-xs font-bold text-main transition"
          >
            Check In Another Member
          </button>
        </div>
      )}

      {/* SECTION 4: INSTANT CHECK-IN / CHECK-OUT KEYPAD */}
      {!personalActiveSession && (
        <div className="bg-white dark:bg-[#14161A] border border-theme rounded-[24px] p-6 sm:p-7 shadow-sm">
          <div className="text-center mb-5">
            <div className="w-11 h-11 rounded-2xl bg-[#C6F459] text-[#111214] flex items-center justify-center mx-auto mb-2.5 shadow-xs">
              <Timer className="w-5 h-5 stroke-[2.25]" />
            </div>
            <h2 className="text-xl font-black text-main font-display">
              Check In (Start Timer) / Check Out (Stop Timer)
            </h2>
            <p className="text-xs text-muted-theme mt-1">
              Enter Member Code (<strong className="mono-pill">FP-93</strong> or <strong className="mono-pill">93</strong>) or 10-digit Mobile Number.
            </p>
          </div>

          {result?.error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center space-x-2 font-semibold max-w-md mx-auto">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{result.error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
            <input
              type="text"
              autoFocus={viewMode === "self"}
              placeholder="FP-93 or Mobile No."
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              className="w-full text-center py-3.5 bg-app border-2 border-[#E5E7EB] dark:border-[#262932] rounded-2xl text-xl font-mono font-black tracking-wider text-main placeholder-dim-theme focus:outline-none focus:border-[#111214] dark:focus:border-[#C6F459] transition"
            />

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "FP-", "0", "⌫"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === "⌫") handleBackspace();
                    else handleQuickKey(key);
                  }}
                  className="py-3 bg-app hover:bg-surface active:scale-95 text-main font-mono font-bold rounded-xl text-base transition border border-theme"
                >
                  {key}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2.5 pt-1">
              <button
                type="button"
                onClick={handleClear}
                className="w-1/3 py-3.5 bg-app hover:bg-surface text-muted-theme hover:text-main rounded-xl text-xs font-bold transition border border-theme"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || !memberCode.trim()}
                className="w-2/3 py-3.5 bg-[#111214] hover:opacity-90 dark:bg-[#C6F459] dark:text-[#111214] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-extrabold transition shadow-md flex items-center justify-center space-x-2"
              >
                <Flame className="w-4 h-4 text-[#C6F459] dark:text-[#111214]" />
                <span>{loading ? "Processing..." : "Check In / Out Now"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 5: LIVE FLOOR TIMERS (Everyone currently checked in) */}
      <div className="bg-white dark:bg-[#14161A] border border-theme rounded-[22px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-subtle-theme pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-extrabold text-main font-display">
              Live Active Workout Timers ({activeSessions.length})
            </h3>
          </div>
          <span className="text-[11px] text-muted-theme font-medium">
            Tap Check Out to stop timer
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-theme">
            Abhi koi member floor par checked-in nahi hai. Upar code daal kar check-in start karein.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 rounded-2xl bg-app border border-theme flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="mono-pill text-[10px]">
                      {session.members?.member_code || "MEMBER"}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  </div>
                  <div className="font-bold text-xs text-main truncate mt-1">
                    {session.members?.full_name || "Gym Member"}
                  </div>
                  <div className="text-[11px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatStopwatch(session.check_in_at, nowMs)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => executeToggle(session.members?.member_code || "")}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white border border-red-500/25 text-[11px] font-bold transition shrink-0"
                >
                  Stop
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
