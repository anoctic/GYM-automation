"use client";

import { useState } from "react";
import { checkInMember, checkOutMember, bulkCheckOutAll } from "@/actions/attendance";
import { formatTime, formatDate } from "@/lib/utils";
import type { AttendanceLog, Member, AttendanceMethod } from "@/types/database";
import { 
  Activity, 
  QrCode, 
  UserCheck, 
  LogOut, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  Search
} from "lucide-react";

interface FloorClientProps {
  initialActiveSessions: AttendanceLog[];
  allMembers: Member[];
  initialHistory: AttendanceLog[];
  isDemo: boolean;
}

export function FloorClient({
  initialActiveSessions,
  allMembers,
  initialHistory,
  isDemo,
}: FloorClientProps) {
  const [activeSessions, setActiveSessions] = useState<AttendanceLog[]>(initialActiveSessions);
  const [history, setHistory] = useState<AttendanceLog[]>(initialHistory);
  const [selectedMemberId, setSelectedMemberId] = useState(allMembers[0]?.id || "");
  const [method, setMethod] = useState<AttendanceMethod>("FRONT_DESK");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Check if chosen member is already on the floor
  const isMemberAlreadyCheckedIn = activeSessions.some(
    (s) => s.member_id === selectedMemberId
  );

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMemberId) return;
    setLoading(true);
    setMessage(null);

    const res = await checkInMember(selectedMemberId, method);
    setLoading(false);

    if (res.error) {
      setMessage({ text: res.error, type: "error" });
      return;
    }

    if (res.success && res.log) {
      const member = allMembers.find((m) => m.id === selectedMemberId);
      const newSession: AttendanceLog = {
        ...res.log,
        members: member
          ? {
              id: member.id,
              full_name: member.full_name,
              member_code: member.member_code,
              phone: member.phone,
              status: member.status,
              pending_dues: member.pending_dues,
            }
          : null,
      };

      setActiveSessions((prev) => [newSession, ...prev]);
      setMessage({
        text: `Checked in ${res.memberName} successfully via ${method}!`,
        type: "success",
      });
    }
  }

  async function handleCheckOut(sessionId: string, memberName?: string) {
    setLoading(true);
    const res = await checkOutMember(sessionId);
    setLoading(false);

    if (res.success && res.log) {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setHistory((prev) => [res.log!, ...prev]);
      setMessage({
        text: `Checked out ${memberName || "member"} from floor.`,
        type: "success",
      });
    } else if (res.error) {
      setMessage({ text: res.error, type: "error" });
    }
  }

  async function handleBulkCheckOut() {
    if (activeSessions.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to bulk check out all ${activeSessions.length} active floor members?`
      )
    ) {
      return;
    }

    setLoading(true);
    const res = await bulkCheckOutAll();
    setLoading(false);

    if (res.success) {
      setActiveSessions([]);
      setMessage({
        text: `Successfully checked out all ${res.count} members from the floor!`,
        type: "success",
      });
    } else if (res.error) {
      setMessage({ text: res.error, type: "error" });
    }
  }

  function getElapsedMinutes(checkInAt: string): string {
    const diff = Math.floor((new Date().getTime() - new Date(checkInAt).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Activity className="w-6 h-6 text-emerald-400 mr-2" />
            Floor Attendance Console
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time workout floor monitoring, QR/Front-desk check-in, and bulk checkout.
          </p>
        </div>

        {/* Bulk Check Out Button */}
        <button
          onClick={handleBulkCheckOut}
          disabled={activeSessions.length === 0 || loading}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition flex items-center shadow"
          title="Closes all active check-in sessions immediately"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Bulk Check-Out All ({activeSessions.length})
        </button>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
              : "bg-red-950/70 border-red-800 text-red-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Quick Check-in Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center">
          <UserCheck className="w-4 h-4 text-emerald-400 mr-2" />
          Quick Member Check-In
        </h2>

        <form onSubmit={handleCheckIn} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {allMembers.map((m) => {
                const onFloor = activeSessions.some((s) => s.member_id === m.id);
                return (
                  <option key={m.id} value={m.id} disabled={onFloor}>
                    {m.full_name} ({m.member_code}) — {m.status.toUpperCase()}
                    {onFloor ? " [ALREADY ON FLOOR]" : ""}
                    {Number(m.pending_dues) > 0 ? ` (Due: ₹${m.pending_dues})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="w-full sm:w-44">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as AttendanceMethod)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="FRONT_DESK">Front Desk Check-in</option>
              <option value="QR_SCAN">QR Scan (Self)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isMemberAlreadyCheckedIn || loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold transition flex items-center justify-center shadow"
          >
            <UserCheck className="w-4 h-4 mr-1.5" />
            {isMemberAlreadyCheckedIn ? "Already Checked In" : "Check In Now"}
          </button>
        </form>
      </div>

      {/* Live Floor Active Sessions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
            Currently On Floor ({activeSessions.length} Members)
          </h2>
          <span className="text-xs text-gray-400">Auto-calculated duration</span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="bg-gray-900 border border-dashed border-gray-800 rounded-xl p-10 text-center">
            <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Gym floor is currently empty.</p>
            <p className="text-xs text-gray-500 mt-1">Check in walk-in or arriving members using the bar above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-900 border border-emerald-950 rounded-xl p-4 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-emerald-300">
                      {session.members?.full_name?.charAt(0) || "M"}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{session.members?.full_name}</h3>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-gray-400 bg-gray-800 px-1 rounded">
                          {session.members?.member_code}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {session.method === "QR_SCAN" ? "📱 QR Scan" : "🖥️ Front Desk"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {getElapsedMinutes(session.check_in_at)}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Checked in: <strong className="text-gray-200">{formatTime(session.check_in_at)}</strong>
                  </span>

                  <button
                    onClick={() => handleCheckOut(session.id, session.members?.full_name)}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-rose-900/60 hover:text-rose-300 text-gray-300 rounded text-xs font-semibold border border-gray-700 hover:border-rose-800 transition flex items-center"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance History Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent Attendance Logs</h3>
          <span className="text-xs text-gray-400">Last 20 sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-800/60 text-gray-400 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-4">Member</th>
                <th className="py-2.5 px-4">Check-in</th>
                <th className="py-2.5 px-4">Check-out</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {history.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/30 transition">
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-white block">{log.members?.full_name || "Member"}</span>
                    <span className="text-[11px] text-gray-400 font-mono">{log.members?.member_code}</span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-300">
                    {formatDate(log.check_in_at)} at {formatTime(log.check_in_at)}
                  </td>
                  <td className="py-2.5 px-4 text-gray-300">
                    {log.check_out_at ? formatTime(log.check_out_at) : <span className="text-emerald-400 font-bold">On Floor</span>}
                  </td>
                  <td className="py-2.5 px-4 text-gray-400">
                    {log.method}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {log.check_out_at ? (
                      <span className="text-gray-400">Completed</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Active Now</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
