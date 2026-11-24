"use client";

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import { formatTime, formatDate } from "@/lib/utils";
import {
  checkInMember,
  checkOutMember,
  bulkCheckOutAll,
  getAttendanceByDate,
} from "@/actions/attendance";
import type { AttendanceLog, Member, AttendanceMethod, Gym } from "@/types/database";
import {
  Activity,
  Users,
  Clock,
  Printer,
  CheckCircle2,
  X,
  Search,
  Plus,
  LogOut,
  Calendar,
  History,
  Timer,
  Square,
} from "lucide-react";

interface AttendanceClientProps {
  gym: Gym;
  initialActiveSessions: AttendanceLog[];
  allMembers: Member[];
  initialHistory: AttendanceLog[];
}

function getIstDateString(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  // Format YYYY-MM-DD in Asia/Kolkata IST
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function formatStopwatch(startIso: string, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((nowMs - new Date(startIso).getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
}

function formatSessionDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "Live";
  const diffSec = Math.max(1, Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function AttendanceClient({
  gym,
  initialActiveSessions,
  allMembers,
  initialHistory,
}: AttendanceClientProps) {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [activeSessions, setActiveSessions] = useState<AttendanceLog[]>(initialActiveSessions);
  const [history, setHistory] = useState<AttendanceLog[]>(initialHistory);

  // Live 1s clock for running floor timers
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // History Filters
  const todayStr = useMemo(() => getIstDateString(new Date()), []);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>("all");
  const [historySearch, setHistorySearch] = useState("");
  const [dateLogsCache, setDateLogsCache] = useState<Record<string, AttendanceLog[]>>({});
  const [fetchingDate, setFetchingDate] = useState(false);

  // Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Check In form
  const [selectedMemberId, setSelectedMemberId] = useState(allMembers[0]?.id || "");
  const [method, setMethod] = useState<AttendanceMethod>("FRONT_DESK");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dual Desk QR Code State
  const [checkInQrUrl, setCheckInQrUrl] = useState<string | null>(null);
  const [enrollQrUrl, setEnrollQrUrl] = useState<string | null>(null);
  const gymSlug = gym.slug || "fitness-planet-sikandrabad";

  useEffect(() => {
    if (!isPosterModalOpen) return;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://gym-automation-two.vercel.app";
    const kioskUrl = `${origin}/checkin/${gymSlug}?mode=self`;
    const enrollUrl = `${origin}/join/${gymSlug}`;

    Promise.all([
      QRCode.toDataURL(kioskUrl, {
        width: 280,
        margin: 1,
        color: { dark: "#111214", light: "#ffffff" },
      }),
      QRCode.toDataURL(enrollUrl, {
        width: 280,
        margin: 1,
        color: { dark: "#111214", light: "#ffffff" },
      }),
    ])
      .then(([ci, en]) => {
        setCheckInQrUrl(ci);
        setEnrollQrUrl(en);
      })
      .catch((err) => console.error("Error generating QR:", err));
  }, [isPosterModalOpen, gymSlug]);

  // Today's logs (in IST)
  const todayLogs = useMemo(() => {
    return history.filter((log) => getIstDateString(log.check_in_at) === todayStr);
  }, [history, todayStr]);

  // Past dates summary list (grouped by YYYY-MM-DD)
  const pastDateChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of history) {
      const dStr = getIstDateString(log.check_in_at);
      counts.set(dStr, (counts.get(dStr) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14);
  }, [history]);

  // Fetch exact date from server when user picks a specific calendar date
  async function handleSelectHistoryDate(dateStr: string) {
    setSelectedHistoryDate(dateStr);
    if (dateStr === "all") return;

    setFetchingDate(true);
    const res = await getAttendanceByDate(dateStr);
    setFetchingDate(false);

    if (!res.error && res.logs) {
      setDateLogsCache((prev) => ({ ...prev, [dateStr]: res.logs! }));
    }
  }

  // Filtered History rows
  const displayedHistoryLogs = useMemo(() => {
    const sourceLogs =
      selectedHistoryDate !== "all" && dateLogsCache[selectedHistoryDate]
        ? dateLogsCache[selectedHistoryDate]
        : selectedHistoryDate !== "all"
        ? history.filter((l) => getIstDateString(l.check_in_at) === selectedHistoryDate)
        : history;

    if (!historySearch.trim()) return sourceLogs;
    const term = historySearch.toLowerCase();
    return sourceLogs.filter(
      (l) =>
        (l.members?.full_name || "").toLowerCase().includes(term) ||
        (l.members?.member_code || "").toLowerCase().includes(term) ||
        (l.members?.phone || "").toLowerCase().includes(term)
    );
  }, [history, selectedHistoryDate, dateLogsCache, historySearch]);

  // Handle Manual Check In
  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMemberId) return;
    setLoading(true);
    const res = await checkInMember(selectedMemberId, method);
    setLoading(false);

    if (res.error) {
      alert(res.error);
      return;
    }

    if (res.success && res.log) {
      const memberObj = allMembers.find((m) => m.id === selectedMemberId);
      const newSession: AttendanceLog = {
        ...res.log,
        members: memberObj
          ? {
              id: memberObj.id,
              full_name: memberObj.full_name,
              member_code: memberObj.member_code,
              phone: memberObj.phone,
              status: memberObj.status,
              pending_dues: memberObj.pending_dues,
            }
          : null,
      };

      setActiveSessions((prev) => [newSession, ...prev]);
      setHistory((prev) => [newSession, ...prev]);
      setIsCheckInModalOpen(false);
      showToast(`${res.memberName} checked in! Workout timer started.`);
    }
  }

  // Handle Single Check Out
  async function handleCheckOut(sessionId: string, memberName?: string) {
    setLoading(true);
    const res = await checkOutMember(sessionId);
    setLoading(false);

    if (res.success && res.log) {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setHistory((prev) => {
        const exists = prev.some((item) => item.id === res.log!.id);
        if (exists) {
          return prev.map((item) => (item.id === res.log!.id ? res.log! : item));
        }
        return [res.log!, ...prev];
      });
      showToast(`Checked out ${memberName || "member"}. Timer stopped & workout saved!`);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // Handle Bulk Check Out All
  async function handleBulkCheckOut() {
    if (!confirm(`Are you sure you want to check out all ${activeSessions.length} members currently on floor?`)) {
      return;
    }
    setLoading(true);
    const res = await bulkCheckOutAll();
    setLoading(false);

    if (res.success) {
      const nowIso = new Date().toISOString();
      const activeIds = new Set(activeSessions.map((s) => s.id));
      setActiveSessions([]);
      setHistory((prev) =>
        prev.map((item) => (activeIds.has(item.id) ? { ...item, check_out_at: nowIso } : item))
      );
      showToast(`Bulk check-out complete! Stopped ${res.count} timers.`);
    } else if (res.error) {
      alert(res.error);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center space-x-2">
            <span>Floor Attendance &amp; History</span>
            <span className="flex items-center text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              {activeSessions.length} On Floor
            </span>
          </h1>
          <p className="text-xs text-muted-theme mt-1">
            Live workout timers, today&apos;s check-ins, and full date-by-date past attendance history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPosterModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition flex items-center shadow-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Dual-QR Poster
          </button>

          {activeSessions.length > 0 && (
            <button
              onClick={handleBulkCheckOut}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-surface hover:bg-red-500/10 text-muted-theme hover:text-red-500 border border-theme transition flex items-center"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Stop All ({activeSessions.length})
            </button>
          )}

          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="px-4 py-2 bg-[#C6F459] hover:bg-[#B8E946] text-[#111214] rounded-xl text-xs font-extrabold transition flex items-center shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            <span>Manual Check In</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher: Today & Live Floor vs Past History */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-theme w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
            activeTab === "today"
              ? "bg-[#111214] text-white dark:bg-[#C6F459] dark:text-[#111214] shadow-xs"
              : "text-muted-theme hover:text-main"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Today &amp; Live Floor ({todayLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-[#111214] text-white dark:bg-[#C6F459] dark:text-[#111214] shadow-xs"
              : "text-muted-theme hover:text-main"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History (Past Days • {history.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TODAY & LIVE WORKOUT FLOOR                                         */}
      {/* ========================================================================= */}
      {activeTab === "today" && (
        <div className="space-y-6">
          {/* LIVE ACTIVE FLOOR TIMERS */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-subtle-theme pb-3">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-main">Live Active Workout Timers</h2>
              </div>
              <span className="text-xs text-muted-theme">
                Shift Hours: <strong className="text-main">5-10 AM | 4-10 PM</strong>
              </span>
            </div>

            {activeSessions.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-12 h-12 rounded-full bg-app flex items-center justify-center mx-auto text-dim-theme">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-main">No members currently working out on floor.</p>
                <p className="text-[11px] text-muted-theme max-w-sm mx-auto">
                  Members scan the Kiosk Check-In QR to start their live workout timer, or tap Manual Check In above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-2xl bg-app border border-theme flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="mono-pill text-[11px]">
                          {session.members?.member_code}
                        </span>
                        <h3 className="font-bold text-main text-sm">{session.members?.full_name}</h3>
                        <p className="text-[11px] text-muted-theme">
                          Started at {formatTime(session.check_in_at)} • {session.members?.phone}
                        </p>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                        {session.method}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-subtle-theme text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-bold font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                        <span>{formatStopwatch(session.check_in_at, nowMs)}</span>
                      </span>

                      <button
                        onClick={() => handleCheckOut(session.id, session.members?.full_name)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#111214] dark:bg-red-500/20 text-white dark:text-red-400 hover:bg-red-600 hover:text-white border border-transparent dark:border-red-500/30 transition flex items-center gap-1"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Check Out</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TODAY'S CHECK-IN / CHECK-OUT LOGS */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-main flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Today&apos;s Check-In &amp; Workout Log ({formatDate(todayStr)})</span>
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View Past Days &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs responsive-table">
                <thead className="bg-app border-b border-subtle-theme text-[11px] font-bold text-muted-theme uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Check-In</th>
                    <th className="py-2.5 px-3">Check-Out</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-theme">
                  {todayLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-theme">
                        Aaj abhi tak koi check-in record nahi hua hai.
                      </td>
                    </tr>
                  ) : (
                    todayLogs.map((log) => (
                      <tr key={log.id} className="bg-surface-hover">
                        <td className="py-2.5 px-3" data-label="Member">
                          <span className="font-bold text-main">{log.members?.full_name || "Member"}</span>
                          {log.members?.member_code && (
                            <span className="mono-pill ml-2 text-[10px]">
                              {log.members.member_code}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-theme font-mono" data-label="Check-In">
                          {formatTime(log.check_in_at)}
                        </td>
                        <td className="py-2.5 px-3" data-label="Check-Out">
                          {log.check_out_at ? (
                            <span className="text-muted-theme font-mono">{formatTime(log.check_out_at)}</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                              ● On Floor
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-main tabular-nums" data-label="Duration">
                          {log.check_out_at
                            ? formatSessionDuration(log.check_in_at, log.check_out_at)
                            : formatStopwatch(log.check_in_at, nowMs)}
                        </td>
                        <td className="py-2.5 px-3" data-label="Method">
                          <span className="text-[11px] font-semibold text-dim-theme">{log.method}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAST DAYS ATTENDANCE HISTORY                                       */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Date Picker + Quick Past Day Chips + Member Search */}
          <div className="card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-dim-theme" />
                <input
                  type="text"
                  placeholder="Search member name, code (FP-93), or phone..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-dim-theme focus:outline-none focus:border-[#111214] dark:focus:border-[#C6F459]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-theme shrink-0" />
                <span className="text-xs font-bold text-muted-theme">Select Date:</span>
                <input
                  type="date"
                  value={selectedHistoryDate === "all" ? "" : selectedHistoryDate}
                  max={todayStr}
                  onChange={(e) => handleSelectHistoryDate(e.target.value || "all")}
                  className="px-3 py-1.5 bg-app border border-theme rounded-xl text-xs font-mono font-bold text-main focus:outline-none focus:border-[#111214] dark:focus:border-[#C6F459]"
                />
                {selectedHistoryDate !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryDate("all")}
                    className="px-2.5 py-1.5 rounded-xl bg-app border border-theme text-xs font-bold text-muted-theme hover:text-main"
                  >
                    All Dates
                  </button>
                )}
              </div>
            </div>

            {/* Quick Clickable Past Day Chips */}
            {pastDateChips.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedHistoryDate("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                    selectedHistoryDate === "all"
                      ? "bg-[#111214] text-white dark:bg-[#C6F459] dark:text-[#111214] border-transparent"
                      : "bg-app text-muted-theme border-theme hover:text-main"
                  }`}
                >
                  All History ({history.length})
                </button>

                {pastDateChips.map(([dateKey, count]) => {
                  const isToday = dateKey === todayStr;
                  const label = isToday
                    ? `Today (${formatDate(dateKey)})`
                    : formatDate(dateKey);
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => handleSelectHistoryDate(dateKey)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                        selectedHistoryDate === dateKey
                          ? "bg-[#111214] text-white dark:bg-[#C6F459] dark:text-[#111214] border-transparent"
                          : "bg-app text-muted-theme border-theme hover:text-main"
                      }`}
                    >
                      {label} • {count}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Full History Table */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-main flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-500" />
                <span>
                  {selectedHistoryDate === "all"
                    ? "All Recorded Attendance History"
                    : `Attendance History — ${formatDate(selectedHistoryDate)}`}
                </span>
              </h2>
              <span className="text-xs font-mono font-bold text-muted-theme">
                {fetchingDate ? "Loading..." : `${displayedHistoryLogs.length} Sessions`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs responsive-table">
                <thead className="bg-app border-b border-subtle-theme text-[11px] font-bold text-muted-theme uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Check-In</th>
                    <th className="py-2.5 px-3">Check-Out</th>
                    <th className="py-2.5 px-3">Workout Duration</th>
                    <th className="py-2.5 px-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-theme">
                  {displayedHistoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-theme">
                        Is date ke liye koi check-in record nahi mila.
                      </td>
                    </tr>
                  ) : (
                    displayedHistoryLogs.map((log) => (
                      <tr key={log.id} className="bg-surface-hover">
                        <td className="py-2.5 px-3 font-medium text-main whitespace-nowrap" data-label="Date">
                          {formatDate(log.check_in_at)}
                        </td>
                        <td className="py-2.5 px-3" data-label="Member">
                          <span className="font-bold text-main">{log.members?.full_name || "Member"}</span>
                          {log.members?.member_code && (
                            <span className="mono-pill ml-2 text-[10px]">
                              {log.members.member_code}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-theme font-mono" data-label="Check-In">
                          {formatTime(log.check_in_at)}
                        </td>
                        <td className="py-2.5 px-3" data-label="Check-Out">
                          {log.check_out_at ? (
                            <span className="text-muted-theme font-mono">{formatTime(log.check_out_at)}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCheckOut(log.id, log.members?.full_name)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-red-500 hover:text-white transition"
                            >
                              Active • Tap to Stop
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums" data-label="Duration">
                          {log.check_out_at
                            ? formatSessionDuration(log.check_in_at, log.check_out_at)
                            : formatStopwatch(log.check_in_at, nowMs)}
                        </td>
                        <td className="py-2.5 px-3" data-label="Method">
                          <span className="text-[11px] font-semibold text-dim-theme">{log.method}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MANUAL CHECK IN                                                  */}
      {/* ========================================================================= */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsCheckInModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-main">Manual Floor Check In</h3>
            <p className="text-xs text-muted-theme">Select member to start their floor workout timer.</p>

            <form onSubmit={handleCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-theme font-medium mb-1">Select Member *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-bold focus:outline-none focus:border-emerald-500"
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_code} - {m.full_name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-muted-theme font-medium mb-1">Attendance Method *</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="FRONT_DESK">Front Desk Attendance</option>
                  <option value="QR_SCAN">QR Scan Kiosk</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#111214] dark:bg-[#C6F459] text-white dark:text-[#111214] font-extrabold transition shadow-md"
              >
                {loading ? "Starting Timer..." : "Check In & Start Timer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE DUAL-QR DESK POSTER                                    */}
      {/* ========================================================================= */}
      {isPosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5 my-6 border-4 border-amber-500/50 text-center">
            <div className="no-print flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Printable Dual-QR Reception Poster
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#111214] hover:opacity-90 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C6F459]" />
                  <span>Print Poster</span>
                </button>
                <button
                  onClick={() => setIsPosterModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <FitnessPlanetLogo size="md" showTagline={true} src={gym.logo_url} />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tight font-display">
                  FITNESS PLANET UNISEX GYM
                </h2>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                  SIKANDRABAD • OWNER: KAPIL RAJPUT • +91 9149183060
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-900 space-y-2">
                  <div className="text-xs font-black text-emerald-700 uppercase">
                    1. Self Check-In / Out
                  </div>
                  {checkInQrUrl ? (
                    <img src={checkInQrUrl} alt="Check-In QR" className="w-40 h-40 mx-auto" />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-xs text-gray-400 mx-auto">
                      Generating...
                    </div>
                  )}
                  <p className="text-[11px] font-bold text-gray-700">
                    Scan to Start &amp; Stop Workout Timer
                  </p>
                </div>

                <div className="p-4 bg-amber-50/70 rounded-2xl border-2 border-gray-900 space-y-2">
                  <div className="text-xs font-black text-amber-700 uppercase">
                    2. New Self-Enrollment
                  </div>
                  {enrollQrUrl ? (
                    <img src={enrollQrUrl} alt="Enrollment QR" className="w-40 h-40 mx-auto" />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-xs text-gray-400 mx-auto">
                      Generating...
                    </div>
                  )}
                  <p className="text-[11px] font-bold text-gray-700">
                    Scan to Open Registration Form
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold pt-1">
                ★ STRONG IS UNIVERSAL ★
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
