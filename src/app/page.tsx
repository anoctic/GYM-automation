import Link from "next/link";
import { getTenantContext } from "@/lib/tenant/context";
import { getActiveFloorMembers } from "@/actions/attendance";
import { getFinancialSummary, getPayments } from "@/actions/payments";
import { getAdmissions } from "@/actions/admissions";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { 
  Users, 
  Activity, 
  CreditCard, 
  AlertCircle, 
  UserPlus, 
  QrCode, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  TrendingUp, 
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default async function DashboardPage() {
  const { gymId, isDemo, gym } = await getTenantContext();
  const { activeSessions } = await getActiveFloorMembers();
  const { totalRevenue, totalPendingDues, activeMembersCount, totalMembers } = await getFinancialSummary();
  const { admissions } = await getAdmissions("pending");
  const { payments } = await getPayments();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">{gym?.name}</h1>
            {isDemo && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> Demo Tenant
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{gym?.tagline || "GymOS Multi-Tenant Architecture"}</p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
            <span>📍 {gym?.city || "Sikandrabad"}, {gym?.state || "Uttar Pradesh"}</span>
            <span>•</span>
            <span>⏰ {gym?.opening_hours || "06:00 AM - 10:00 PM"}</span>
            <span>•</span>
            <span className="text-emerald-400">UPI Primary: {gym?.upi_primary_id || "Not configured"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/join/${gymId}`}
            target="_blank"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition flex items-center shadow"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Walk-in Self-Admission Link
            <ArrowUpRight className="w-3.5 h-3.5 ml-1 opacity-70" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active Members</span>
            <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-900 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{activeMembersCount}</span>
            <span className="text-xs text-gray-400">of {totalMembers} total enrolled</span>
          </div>
          <div className="mt-3 text-xs text-blue-400 flex items-center">
            <Link href="/members" className="hover:underline flex items-center">
              View member directory →
            </Link>
          </div>
        </div>

        {/* Live on Floor */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Floor Occupancy</span>
            <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-900 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{activeSessions.length}</span>
            <span className="flex items-center text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
              Live Now
            </span>
          </div>
          <div className="mt-3 text-xs text-emerald-400 flex items-center">
            <Link href="/floor" className="hover:underline flex items-center">
              Manage floor check-ins →
            </Link>
          </div>
        </div>

        {/* Pending Admissions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pending Admissions</span>
            <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-900 text-amber-400">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-300">{admissions.length}</span>
            <span className="text-xs text-gray-400">awaiting approval</span>
          </div>
          <div className="mt-3 text-xs text-amber-400 flex items-center">
            <Link href="/admissions" className="hover:underline flex items-center">
              Review & approve →
            </Link>
          </div>
        </div>

        {/* Total Collections & Dues */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-lg bg-purple-950/70 border border-purple-900 text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</span>
            <span className="text-xs text-red-400 font-medium">Dues: {formatCurrency(totalPendingDues)}</span>
          </div>
          <div className="mt-3 text-xs text-purple-400 flex items-center">
            <Link href="/members?filter=dues" className="hover:underline flex items-center">
              Collect outstanding dues →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Floor Sessions & Quick Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Floor Activity (2 cols) */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center">
                <Activity className="w-5 h-5 text-emerald-400 mr-2" />
                Live Floor Sessions ({activeSessions.length})
              </h2>
              <p className="text-xs text-gray-400">Members currently checked in on gym floor</p>
            </div>
            <Link
              href="/floor"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            >
              Open Floor Console
            </Link>
          </div>

          {activeSessions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">No active members on floor right now.</p>
              <Link href="/floor" className="mt-2 inline-block text-xs text-emerald-400 hover:underline">
                Check in a member →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {activeSessions.map((session) => (
                <div key={session.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-xs font-bold text-emerald-300">
                      {session.members?.full_name?.charAt(0) || "M"}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">{session.members?.full_name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                          {session.members?.member_code}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        Checked in via {session.method} at {formatTime(session.check_in_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {session.members?.pending_dues && session.members.pending_dues > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                        Due: ₹{session.members.pending_dues}
                      </span>
                    ) : null}
                    <span className="text-xs text-emerald-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Receipts (1 col) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/members"
                className="p-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-left transition"
              >
                <UserPlus className="w-4 h-4 text-blue-400 mb-1" />
                <span className="block text-xs font-semibold text-white">Enroll Member</span>
                <span className="block text-[11px] text-gray-400">New registration</span>
              </Link>
              <Link
                href="/floor"
                className="p-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-left transition"
              >
                <QrCode className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="block text-xs font-semibold text-white">Scan / Check-in</span>
                <span className="block text-[11px] text-gray-400">Front desk attendance</span>
              </Link>
              <Link
                href="/plans"
                className="p-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-left transition"
              >
                <Layers className="w-4 h-4 text-purple-400 mb-1" />
                <span className="block text-xs font-semibold text-white">Plans CRUD</span>
                <span className="block text-[11px] text-gray-400">Manage memberships</span>
              </Link>
              <Link
                href="/settings"
                className="p-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-left transition"
              >
                <CreditCard className="w-4 h-4 text-amber-400 mb-1" />
                <span className="block text-xs font-semibold text-white">Dual UPI Setup</span>
                <span className="block text-[11px] text-gray-400">Slot A/B routing</span>
              </Link>
            </div>
          </div>

          {/* Recent Payment Receipts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Recent Receipts</h3>
            <div className="space-y-2.5">
              {payments.slice(0, 4).map((pay) => (
                <div key={pay.id} className="p-2.5 bg-gray-800/40 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-white block">{pay.members?.full_name || "Member"}</span>
                    <span className="text-gray-400 font-mono text-[11px]">{pay.receipt_no} • {pay.payment_method}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 block">{formatCurrency(pay.amount)}</span>
                    <span className="text-gray-400 text-[10px]">{formatDate(pay.paid_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
