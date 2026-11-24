"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { checkOutMember, checkInMember } from "@/actions/attendance";
import { collectDues, enrollMember } from "@/actions/members";
import { createLead } from "@/actions/leads";
import type { Gym, Member, AttendanceLog, Lead, MembershipPlan, Payment } from "@/types/database";
import {
  Users,
  CreditCard,
  Activity,
  AlertTriangle,
  UserPlus,
  Send,
  QrCode,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  Plus,
  X,
  Target,
  ChevronRight,
  TrendingUp,
  Receipt,
  UserCheck,
  PauseCircle,
  AlertCircle,
  Calendar,
  IndianRupee,
} from "lucide-react";

interface DashboardClientProps {
  gym: Gym;
  isDemo: boolean;
  members: Member[];
  plans: MembershipPlan[];
  activeSessions: AttendanceLog[];
  recentPayments: Payment[];
  leads: Lead[];
  financials: {
    totalRevenue: number;
    upiTotal: number;
    cashTotal: number;
    bankTotal: number;
    totalPendingDues: number;
    totalMembers: number;
    activeMembersCount: number;
  };
}

export function DashboardClient({
  gym,
  isDemo,
  members,
  plans,
  activeSessions: initialSessions,
  recentPayments,
  leads: initialLeads,
  financials,
}: DashboardClientProps) {
  const [activeSessions, setActiveSessions] = useState<AttendanceLog[]>(initialSessions);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  // Quick Action Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Check In form state
  const [checkInMemberId, setCheckInMemberId] = useState(members[0]?.id || "");
  const [checkInMethod, setCheckInMethod] = useState<"FRONT_DESK" | "QR_SCAN">("FRONT_DESK");

  // Collect Dues form state
  const [collectMemberId, setCollectMemberId] = useState(
    members.find((m) => Number(m.pending_dues) > 0)?.id || members[0]?.id || ""
  );
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");

  // Lead form state
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadStage, setLeadStage] = useState<any>("new_inquiry");
  const [leadNotes, setLeadNotes] = useState("");

  // Calculate Member Status Counts
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === "active").length;
  const trialCount = members.filter((m) => m.status === "trial").length;
  const frozenCount = members.filter((m) => m.status === "frozen").length;
  const withDuesCount = members.filter((m) => Number(m.pending_dues) > 0).length;

  // Expiring/Overdue Members (within next 7 days or already expired)
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  const expiringMembers = members.filter((m) => {
    if (m.status === "expired") return true;
    const expiry = new Date(m.expiry_date);
    return expiry >= now && expiry <= next7Days;
  });

  // Handle Quick Floor Check-Out
  async function handleCheckOut(sessionId: string) {
    setActionLoading(true);
    const res = await checkOutMember(sessionId);
    setActionLoading(false);
    if (res.success) {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setStatusMessage("Member checked out successfully!");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  }

  // Handle Quick Check-In
  async function handleQuickCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!checkInMemberId) return;
    setActionLoading(true);
    const res = await checkInMember(checkInMemberId, checkInMethod);
    setActionLoading(false);
    if (res.success && res.session) {
      const memberObj = members.find((m) => m.id === checkInMemberId);
      const sessionWithMember = {
        ...res.session,
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
      setActiveSessions((prev) => [sessionWithMember as AttendanceLog, ...prev]);
      setIsCheckInModalOpen(false);
      setStatusMessage("Member checked in to floor!");
      setTimeout(() => setStatusMessage(null), 3000);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // Handle Quick Collect Payment
  async function handleCollectPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!collectMemberId || collectAmount <= 0) return;
    setActionLoading(true);
    const res = await collectDues({
      member_id: collectMemberId,
      amount: collectAmount,
      payment_method: collectMethod,
    });
    setActionLoading(false);
    if (res.success) {
      setIsCollectModalOpen(false);
      setCollectAmount(0);
      setStatusMessage(`Payment of ${formatCurrency(collectAmount)} collected!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // Handle Quick Add Lead
  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadName || !leadPhone) return;
    setActionLoading(true);
    const res = await createLead({
      name: leadName,
      phone: leadPhone,
      stage: leadStage,
      notes: leadNotes,
    });
    setActionLoading(false);
    if (res.lead) {
      setLeads((prev) => [res.lead!, ...prev]);
      setIsLeadModalOpen(false);
      setLeadName("");
      setLeadPhone("");
      setLeadNotes("");
      setStatusMessage("New CRM Lead added!");
      setTimeout(() => setStatusMessage(null), 3000);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // Generate WhatsApp reminder link
  function getWhatsAppUrl(member: Member) {
    const cleanPhone = member.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Namaste ${member.full_name} ji! 🙏\nFitness Planet Unisex Gym, Sikandrabad (Owner: Kapil Rajput) se reminder:\nAapka membership package (${member.membership_plans?.name || "Gym Plan"}) valid tha till ${formatDate(member.expiry_date)}. ${
        Number(member.pending_dues) > 0 ? `Pending Dues: ₹${member.pending_dues}.` : ""
      }\nKripya renewal ya queries ke liye reception par contact karein: +91 9149183060. Thank you! 💪`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. DARK OBSIDIAN COLLECTION HERO CARD (Matching Video & Prototype) */}
      <Link href="/payments" className="block">
        <div className="hero-collection-card relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-slate-400 font-semibold flex items-center gap-1.5">
              <span>₹ Today&apos;s collection</span>
            </span>
            <span className="text-slate-400 text-base font-bold group-hover:translate-x-1 transition-transform">›</span>
          </div>

          <div className="text-3xl sm:text-4xl lg:text-5xl font-black mt-2 tracking-tight text-white">
            {formatCurrency(financials.totalRevenue)}
          </div>

          <div className="collection-split">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--lime)] inline-block" />
              <span className="text-slate-400 font-normal">Online</span>
              <strong className="text-white">{formatCurrency(financials.upiTotal + financials.bankTotal)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span className="text-slate-400 font-normal">Cash</span>
              <strong className="text-white">{formatCurrency(financials.cashTotal)}</strong>
            </span>
          </div>
        </div>
      </Link>

      {/* 2. 4 MINI KPI CARDS (Matching Video Grid) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        <Link href="/members" className="mini-stat block cursor-pointer">
          <div className="num text-[#16A34A]">{members.length}</div>
          <div className="lbl">Admission</div>
        </Link>
        <Link href="/members" className="mini-stat block cursor-pointer">
          <div className="num text-[#2563EB]">{activeCount}</div>
          <div className="lbl">Renewal</div>
        </Link>
        <Link href="/leads" className="mini-stat block cursor-pointer">
          <div className="num text-[#D97706]">{leads.length}</div>
          <div className="lbl">Enquiry</div>
        </Link>
        <Link href="/payments" className="mini-stat block cursor-pointer">
          <div className="num text-[#7C3AED]">{recentPayments.length}</div>
          <div className="lbl">Due paid</div>
        </Link>
      </div>

      {/* 3. SETUP PROGRESS BANNER (Matching Video) */}
      <Link href="/more" className="block">
        <div className="setup-banner group">
          <div className="flex items-center gap-3">
            <div className="setup-check-circle">✓</div>
            <div>
              <div className="text-sm font-bold text-main">Set up your gym • 3/5</div>
              <div className="text-xs text-muted-theme">Complete the remaining steps</div>
            </div>
          </div>
          <span className="text-muted-theme text-lg font-bold group-hover:translate-x-1 transition-transform">›</span>
        </div>
      </Link>

      {/* 4. 3 PASTEL STATUS CARDS (Matching Video) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <Link href="/payments" className="mini-stat pastel-red block cursor-pointer">
          <div className="text-sm mb-1">💳</div>
          <div className="num">{withDuesCount}</div>
          <div className="lbl opacity-85">Overdue</div>
        </Link>

        <Link href="/members" className="mini-stat pastel-amber block cursor-pointer">
          <div className="text-sm mb-1">🕒</div>
          <div className="num">{expiringMembers.length}</div>
          <div className="lbl opacity-85">Expiring</div>
        </Link>

        <Link href="/attendance" className="mini-stat pastel-blue block cursor-pointer">
          <div className="text-sm mb-1">✅</div>
          <div className="num">{activeSessions.length}</div>
          <div className="lbl opacity-85">Attendance</div>
        </Link>
      </div>

      {/* 5. 2 ROW: REPORTS & APPROVALS */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <Link href="/payments" className="mini-stat block cursor-pointer py-3.5 px-3">
          <div className="text-base mb-1">📈</div>
          <div className="text-[13.5px] font-bold text-main">Reports</div>
        </Link>
        <div className="mini-stat py-3.5 px-3">
          <div className="num text-main">0</div>
          <div className="lbl">Approvals pending</div>
        </div>
      </div>

      {/* 6. RECENT TRANSACTIONS (Matching Video) */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-extrabold text-main">Recent transactions</h3>
          <Link href="/payments" className="text-xs font-bold text-muted-theme hover:text-main">
            See all
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <div className="card text-center text-muted-theme text-sm py-6">
            No payments yet.
          </div>
        ) : (
          <div className="card divide-y divide-theme p-0 overflow-hidden">
            {recentPayments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex justify-between items-center px-4 py-3">
                <div>
                  <div className="font-bold text-sm text-main">
                    {p.members?.full_name || "Gym Member"}
                  </div>
                  <div className="text-[11.5px] text-muted-theme">
                    {p.payment_method} • {formatDate(p.paid_at || p.created_at)}
                  </div>
                </div>
                <div className="font-extrabold text-[#16A34A] text-sm font-mono-code">
                  +{formatCurrency(p.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. FLOATING ACTION BUTTON (+) WITH QUICK ACTION SHEET */}
      <button
        onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
        className="fab-btn select-none"
        title="Quick Add"
        aria-label="Quick Add"
      >
        <span className={`transition-transform duration-200 inline-block ${isFabMenuOpen ? "rotate-45" : ""}`}>
          +
        </span>
      </button>

      {/* Quick Action Bottom Sheet (when FAB is clicked) */}
      {isFabMenuOpen && (
        <div
          onClick={() => setIsFabMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#14161A] text-main rounded-3xl p-5 w-full max-w-sm space-y-3 shadow-2xl border border-theme animate-in slide-in-from-bottom-6"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme">
              <h3 className="font-extrabold text-base">Quick Actions</h3>
              <button
                onClick={() => setIsFabMenuOpen(false)}
                className="w-7 h-7 rounded-full border border-theme flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <Link
                href="/members"
                onClick={() => setIsFabMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface hover:bg-surface-hover font-bold text-xs text-main border border-theme transition"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
                  ➕
                </div>
                <span>Enroll New Member</span>
              </Link>

              <button
                onClick={() => {
                  setIsFabMenuOpen(false);
                  setIsLeadModalOpen(true);
                  setLeadStage("trial_booked");
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface hover:bg-surface-hover font-bold text-xs text-main border border-theme text-left transition"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold">
                  🎯
                </div>
                <span>Add Trial / CRM Lead</span>
              </button>

              <button
                onClick={() => {
                  setIsFabMenuOpen(false);
                  setIsCollectModalOpen(true);
                  const mWithDues = members.find((m) => Number(m.pending_dues) > 0);
                  if (mWithDues) {
                    setCollectMemberId(mWithDues.id);
                    setCollectAmount(Number(mWithDues.pending_dues));
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface hover:bg-surface-hover font-bold text-xs text-main border border-theme text-left transition"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
                  ₹
                </div>
                <span>Collect Pending Dues</span>
              </button>

              <button
                onClick={() => {
                  setIsFabMenuOpen(false);
                  setIsCheckInModalOpen(true);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface hover:bg-surface-hover font-bold text-xs text-main border border-theme text-left transition"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center font-bold">
                  🕒
                </div>
                <span>Floor Check In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members */}
        <div className="p-5 rounded-2xl bg-surface border border-theme shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-theme uppercase tracking-wider">Active Members</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-main">{financials.activeMembersCount}</span>
            <span className="text-xs text-muted-theme">of {financials.totalMembers} enrolled</span>
          </div>
          <Link href="/members" className="mt-3 inline-flex items-center text-xs text-blue-400 hover:underline">
            View Directory →
          </Link>
        </div>

        {/* Monthly Collections */}
        <div className="p-5 rounded-2xl bg-surface border border-theme shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-theme uppercase tracking-wider">Total Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono-code">
              {formatCurrency(financials.totalRevenue)}
            </span>
            <span className="text-[11px] text-muted-theme">UPI: {formatCurrency(financials.upiTotal)}</span>
          </div>
          <Link href="/payments" className="mt-3 inline-flex items-center text-xs text-emerald-400 hover:underline">
            View All Receipts →
          </Link>
        </div>

        {/* Pending Dues */}
        <div className="p-5 rounded-2xl bg-surface border border-theme shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-theme uppercase tracking-wider">Pending Dues</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono-code">
              {formatCurrency(financials.totalPendingDues)}
            </span>
            <span className="text-xs text-muted-theme">{withDuesCount} members</span>
          </div>
          <Link href="/payments" className="mt-3 inline-flex items-center text-xs text-amber-400 hover:underline">
            Collect Dues →
          </Link>
        </div>

        {/* Today Floor Attendance */}
        <div className="p-5 rounded-2xl bg-surface border border-theme shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-theme uppercase tracking-wider">Live On Floor</span>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-orange-400 font-mono-code">
              {activeSessions.length}
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" /> Live Now
            </span>
          </div>
          <Link href="/attendance" className="mt-3 inline-flex items-center text-xs text-orange-400 hover:underline">
            Manage Floor →
          </Link>
        </div>
      </div>

      {/* 4. EXPIRING & OVERDUE RENEWALS + TODAY'S FLOOR CHECK-INS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring / Overdue Card */}
        <div className="rounded-2xl bg-surface border border-theme p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-subtle-theme pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-main">Renewals &amp; Overdue Alert</h2>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {expiringMembers.length} Attention Needed
            </span>
          </div>

          {expiringMembers.length === 0 ? (
            <p className="text-xs text-muted-theme py-6 text-center">
              🎉 All memberships are up to date! No renewals expiring in the next 7 days.
            </p>
          ) : (
            <div className="space-y-3">
              {expiringMembers.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-app border border-subtle-theme gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-main">{m.full_name}</span>
                      <span className="font-mono-code text-[11px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                        {m.member_code}
                      </span>
                      {m.status === "expired" && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-950/60 px-1.5 rounded">
                          EXPIRED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-theme">
                      {m.membership_plans?.name || "Membership"} • Expires: {formatDate(m.expiry_date)}
                      {Number(m.pending_dues) > 0 && (
                        <span className="text-amber-400 font-bold ml-1.5">
                          (Due: {formatCurrency(m.pending_dues)})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* 1-Click WhatsApp Button */}
                    <a
                      href={getWhatsAppUrl(m)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-500 text-white flex items-center transition shadow-sm"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Floor Occupancy Card */}
        <div className="rounded-2xl bg-surface border border-theme p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-subtle-theme pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-main">Live Floor Occupancy</h2>
            </div>
            <Link href="/attendance" className="text-xs text-emerald-400 font-semibold hover:underline">
              Full Floor View →
            </Link>
          </div>

          {activeSessions.length === 0 ? (
            <p className="text-xs text-muted-theme py-6 text-center">
              No members currently on the gym floor. Check in walk-ins using the button above.
            </p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-app border border-subtle-theme"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-main">
                        {session.members?.full_name || "Active Member"}
                      </span>
                      <span className="font-mono-code text-[11px] text-emerald-400 bg-emerald-950/60 px-1.5 rounded border border-emerald-800">
                        {session.members?.member_code}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-theme flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-dim-theme" />
                      In: {formatTime(session.check_in_at)} • via {session.method}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCheckOut(session.id)}
                    disabled={actionLoading}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface hover:bg-red-950 text-muted-theme hover:text-red-400 border border-theme transition"
                  >
                    Check Out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. 6-STAGE CRM LEAD PIPELINE */}
      <div className="rounded-2xl bg-surface border border-theme p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-subtle-theme pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-main">Local Sikandrabad Inquiry Pipeline</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              + Add Lead
            </button>
            <Link href="/leads" className="text-xs text-muted-theme hover:text-main underline">
              View All ({leads.length})
            </Link>
          </div>
        </div>

        {/* 6 Stages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: "new_inquiry", label: "New Inquiry", color: "text-blue-400", bg: "bg-blue-500/10" },
            { id: "contacted", label: "Contacted", color: "text-amber-400", bg: "bg-amber-500/10" },
            { id: "trial_booked", label: "Trial Booked", color: "text-purple-400", bg: "bg-purple-500/10" },
            { id: "follow_up", label: "Follow Up", color: "text-orange-400", bg: "bg-orange-500/10" },
            { id: "converted", label: "Converted 🎉", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { id: "lost", label: "Lost", color: "text-gray-400", bg: "bg-gray-500/10" },
          ].map((col) => {
            const stageLeads = leads.filter((l) => l.stage === col.id);
            return (
              <div key={col.id} className="p-3 rounded-xl bg-app border border-subtle-theme space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${col.color}`}>{col.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface text-muted-theme">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-1.5 min-h-[60px]">
                  {stageLeads.slice(0, 2).map((l) => (
                    <div key={l.id} className="p-2 rounded-lg bg-surface border border-theme text-xs space-y-0.5">
                      <p className="font-bold text-main truncate">{l.name}</p>
                      <p className="text-[10px] text-dim-theme truncate">{l.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: CHECK IN TO FLOOR */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCheckInModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-main mb-1">Floor Check In</h3>
            <p className="text-xs text-muted-theme mb-4">Select member to mark attendance on the workout floor.</p>

            <form onSubmit={handleQuickCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Select Member *</label>
                <select
                  value={checkInMemberId}
                  onChange={(e) => setCheckInMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_code} - {m.full_name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Method *</label>
                <select
                  value={checkInMethod}
                  onChange={(e) => setCheckInMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                >
                  <option value="FRONT_DESK">Front Desk Attendance</option>
                  <option value="QR_SCAN">QR Scan Kiosk</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md"
              >
                {actionLoading ? "Checking In..." : "Confirm Floor Check In"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COLLECT DUES */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCollectModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-main mb-1">Collect Member Dues</h3>
            <p className="text-xs text-muted-theme mb-4">Records payment receipt and decrements pending dues.</p>

            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Member *</label>
                <select
                  value={collectMemberId}
                  onChange={(e) => {
                    setCollectMemberId(e.target.value);
                    const chosen = members.find((m) => m.id === e.target.value);
                    if (chosen) setCollectAmount(Number(chosen.pending_dues));
                  }}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_code} - {m.full_name} (Dues: ₹{m.pending_dues})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={collectAmount || ""}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Payment Mode *</label>
                  <select
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UPI">UPI ({gym.upi_primary_id || "9149183060@paytm"})</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="BANK_TRANSFER">Bank IMPS/NEFT</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading || collectAmount <= 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md"
              >
                {actionLoading ? "Processing..." : `Record ₹${collectAmount} Receipt`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CRM LEAD */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsLeadModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-main mb-1">+ Add New Inquiry / Lead</h3>
            <p className="text-xs text-muted-theme mb-4">Capture walk-in inquiries and trial session bookings.</p>

            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Lead Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Nagar"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 91491 00000"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Pipeline Stage *</label>
                  <select
                    value={leadStage}
                    onChange={(e) => setLeadStage(e.target.value as any)}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                  >
                    <option value="new_inquiry">New Inquiry</option>
                    <option value="contacted">Contacted</option>
                    <option value="trial_booked">Trial Booked</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Inquiry Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Inquired about evening weight training batch"
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-md"
              >
                {actionLoading ? "Saving..." : "Save Inquiry to Pipeline"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
