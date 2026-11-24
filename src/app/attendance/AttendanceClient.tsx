"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import { formatTime, formatDate } from "@/lib/utils";
import { checkInMember, checkOutMember, bulkCheckOutAll } from "@/actions/attendance";
import type { AttendanceLog, Member, AttendanceMethod, Gym } from "@/types/database";
import {
  Activity,
  QrCode,
  Users,
  Clock,
  Printer,
  CheckCircle2,
  X,
  Search,
  ExternalLink,
  Plus,
  LogOut,
  AlertTriangle,
} from "lucide-react";

interface AttendanceClientProps {
  gym: Gym;
  initialActiveSessions: AttendanceLog[];
  allMembers: Member[];
  initialHistory: AttendanceLog[];
  isDemo: boolean;
}

export function AttendanceClient({
  gym,
  initialActiveSessions,
  allMembers,
  initialHistory,
  isDemo,
}: AttendanceClientProps) {
  const [activeSessions, setActiveSessions] = useState<AttendanceLog[]>(initialActiveSessions);
  const [history, setHistory] = useState<AttendanceLog[]>(initialHistory);

  // Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Check In form
  const [selectedMemberId, setSelectedMemberId] = useState(allMembers[0]?.id || "");
  const [method, setMethod] = useState<AttendanceMethod>("FRONT_DESK");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Desk QR Code State
  const [posterQrUrl, setPosterQrUrl] = useState<string | null>(null);
  const gymSlug = gym.slug || "fitness-planet-sikandrabad";

  // Generate QR code for kiosk link
  useEffect(() => {
    if (!isPosterModalOpen) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const kioskUrl = `${origin}/checkin/${gymSlug}`;

    QRCode.toDataURL(kioskUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#06101e", light: "#ffffff" },
    })
      .then((url) => setPosterQrUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [isPosterModalOpen, gymSlug]);

  // Elapsed Timer calculation
  function getElapsedTime(checkInAt: string) {
    const diffMs = new Date().getTime() - new Date(checkInAt).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

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
      setIsCheckInModalOpen(false);
      showToast(`${res.memberName} checked in successfully!`);
    }
  }

  // Handle Single Check Out
  async function handleCheckOut(sessionId: string, memberName?: string) {
    setLoading(true);
    const res = await checkOutMember(sessionId);
    setLoading(false);

    if (res.success && res.log) {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setHistory((prev) => [res.log!, ...prev]);
      showToast(`Checked out ${memberName || "member"}. Workout saved!`);
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
      setActiveSessions([]);
      showToast(`Bulk check-out complete! Closed ${res.count} sessions.`);
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
          <h1 className="text-xl sm:text-2xl font-black text-main flex items-center space-x-2">
            <span>Floor Attendance &amp; Footfall</span>
            <span className="flex items-center text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              {activeSessions.length} On Floor
            </span>
          </h1>
          <p className="text-xs text-muted-theme mt-1">
            Real-time workout floor monitoring, check-ins, end-of-shift bulk checkout, and printable desk QR poster.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Printable Desk Poster Button */}
          <button
            onClick={() => setIsPosterModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center shadow-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Desk QR Poster
          </button>

          {/* Bulk Check Out All */}
          {activeSessions.length > 0 && (
            <button
              onClick={handleBulkCheckOut}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-surface hover:bg-red-950/70 text-muted-theme hover:text-red-400 border border-theme transition flex items-center"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Bulk Check Out ({activeSessions.length})
            </button>
          )}

          {/* Manual Check In Button */}
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Manual Check In
          </button>
        </div>
      </div>

      {/* SECTION 1: ACTIVE FLOOR SESSIONS */}
      <div className="rounded-2xl bg-surface border border-theme p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-subtle-theme pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-main">Live Floor Occupants</h2>
          </div>
          <span className="text-xs text-muted-theme">
            Shift Hours: <strong className="text-main">5-10 AM | 4-10 PM</strong>
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-12 h-12 rounded-full bg-input-field flex items-center justify-center mx-auto text-dim-theme">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-main">No members currently on the gym floor.</p>
            <p className="text-[11px] text-muted-theme max-w-sm mx-auto">
              Members can check in at the front desk kiosk or you can click "+ Manual Check In" above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-app border border-subtle-theme flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-mono-code text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 inline-block">
                      {session.members?.member_code}
                    </span>
                    <h3 className="font-bold text-main text-sm">{session.members?.full_name}</h3>
                    <p className="text-[11px] text-muted-theme">{session.members?.phone}</p>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {session.method}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-subtle-theme text-xs">
                  <span className="text-muted-theme flex items-center font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1 text-dim-theme" />
                    Floor Time: <strong className="text-main ml-1 font-mono-code">{getElapsedTime(session.check_in_at)}</strong>
                  </span>

                  <button
                    onClick={() => handleCheckOut(session.id, session.members?.full_name)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface hover:bg-red-950 text-muted-theme hover:text-red-400 border border-theme transition"
                  >
                    Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: ATTENDANCE HISTORY LOG */}
      <div className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-sm space-y-3 p-5">
        <h2 className="text-sm font-bold text-main flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Completed Workout Sessions Today</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs responsive-table">
            <thead className="bg-app border-b border-subtle-theme text-[11px] font-bold text-muted-theme uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Check-In Time</th>
                <th className="py-2.5 px-3">Check-Out Time</th>
                <th className="py-2.5 px-3">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle-theme">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-theme">
                    No completed sessions recorded yet today.
                  </td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr key={log.id} className="bg-surface-hover">
                    <td className="py-2.5 px-3" data-label="Member">
                      <span className="font-bold text-main">{log.members?.full_name || "Member"}</span>
                      <span className="font-mono-code text-[11px] text-muted-theme ml-1.5">
                        ({log.members?.member_code})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-theme" data-label="Check-In">
                      {formatTime(log.check_in_at)}
                    </td>
                    <td className="py-2.5 px-3 text-muted-theme" data-label="Check-Out">
                      {log.check_out_at ? formatTime(log.check_out_at) : "On Floor"}
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
            <p className="text-xs text-muted-theme">Select member to log arrival on workout floor.</p>

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
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md"
              >
                {loading ? "Checking In..." : "Log Floor Attendance"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE DESK QR POSTER                                         */}
      {/* ========================================================================= */}
      {isPosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-3xl max-w-md w-full p-8 shadow-2xl relative space-y-6 my-6 border-4 border-amber-500/50 text-center">
            {/* Modal Controls */}
            <div className="no-print flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Printable Desk Poster
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
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

            {/* Poster Body */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <FitnessPlanetLogo size="lg" showTagline={true} />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tight">
                  FITNESS PLANET
                </h2>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                  UNISEX GYM &amp; HEALTH CLUB • SIKANDRABAD
                </p>
                <p className="text-[11px] text-gray-500">
                  Owner: Kapil Rajput • Contact: +91 9149183060
                </p>
              </div>

              {/* Large Generated QR Code */}
              <div className="p-4 bg-gray-50 rounded-2xl border-4 border-gray-900 inline-block shadow-md">
                {posterQrUrl ? (
                  <img src={posterQrUrl} alt="Desk QR" className="w-56 h-56 mx-auto" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-gray-400 text-xs">
                    Generating Desk QR...
                  </div>
                )}
              </div>

              <div className="space-y-1 bg-gray-100 p-3 rounded-xl border border-gray-200">
                <p className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                  📱 SCAN WITH PHONE CAMERA TO CHECK IN / OUT
                </p>
                <p className="text-[11px] text-gray-600">
                  Or enter your member code (e.g. <strong>FP-93</strong>) on the reception tablet.
                </p>
              </div>

              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                ★ STRONG IS UNIVERSAL ★
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
