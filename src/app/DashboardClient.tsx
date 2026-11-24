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

      {/* 1. HERO BANNER: Pitch Dark Card with Curved Gold Accent + Large Floating 3D Logo (Matching Image 2) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06080e] via-[#090d16] to-[#0d121e] border border-amber-500/20 p-6 sm:p-8 lg:p-10 shadow-2xl">
        {/* Intense Warm Golden-Amber Ambient Radial Glow Behind Logo */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-8 w-96 h-96 bg-gradient-to-br from-amber-500/25 via-orange-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Curved Golden Accent Wave Across Bottom (as in Image 2) */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-12 pointer-events-none opacity-40 overflow-visible"
          viewBox="0 0 1200 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 45 C 300 20, 600 55, 900 25 C 1050 10, 1150 35, 1200 20"
            stroke="url(#heroGoldLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="heroGoldLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.1" />
              <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Welcome back, Kapil!</span>
              <span className="inline-block text-3xl sm:text-4xl">👋</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
              Manage your gym, members, payments and growth all in one place.
            </p>

            {/* 5 Status Pills (Matching Image 2 Exact Colors & Pill Design) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#111622] border border-slate-800 text-slate-300 font-medium shadow-xs">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{totalCount} Total Members</span>
              </span>

              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#111622] border border-slate-800 text-slate-300 font-medium shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeCount} Active</span>
              </span>

              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#111622] border border-slate-800 text-slate-300 font-medium shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{trialCount} Trials</span>
              </span>

              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#111622] border border-slate-800 text-slate-300 font-medium shadow-xs">
                <PauseCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>{frozenCount} Frozen</span>
              </span>

              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#111622] border border-amber-900/50 text-amber-300 font-medium shadow-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{withDuesCount} With Dues</span>
              </span>
            </div>
          </div>

          {/* Right: High-Res 3D Emblem Logo with Warm Halo (Image 2 style) */}
          <div className="relative flex items-center justify-center shrink-0">
            {/* Ambient Halo */}
            <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-64 flex items-center justify-center group hover:scale-105 transition-transform duration-300">
              <img
                src={gym?.logo_url || "/fitness-planet-logo.png"}
                alt="Fitness Planet Unisex Gym Logo"
                className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(245,158,11,0.35)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTIONS SECTION (Matching Image 2 exact layout and button styles) */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* + Enroll Member (Emerald primary pill) */}
          <Link
            href="/members"
            className="inline-flex items-center space-x-2 py-2.5 px-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition group"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Enroll Member</span>
          </Link>

          {/* + Add Trial */}
          <button
            onClick={() => {
              setIsLeadModalOpen(true);
              setLeadStage("trial_booked");
            }}
            className="inline-flex items-center space-x-2 py-2.5 px-5 rounded-full bg-[#111622] hover:bg-[#182030] text-slate-200 border border-slate-800 font-bold text-xs transition"
          >
            <Plus className="w-4 h-4 text-purple-400 stroke-[2.5]" />
            <span>Add Trial</span>
          </button>

          {/* ₹ Collect Payment */}
          <button
            onClick={() => {
              setIsCollectModalOpen(true);
              const mWithDues = members.find((m) => Number(m.pending_dues) > 0);
              if (mWithDues) {
                setCollectMemberId(mWithDues.id);
                setCollectAmount(Number(mWithDues.pending_dues));
              }
            }}
            className="inline-flex items-center space-x-2 py-2.5 px-5 rounded-full bg-[#111622] hover:bg-[#182030] text-slate-200 border border-slate-800 font-bold text-xs transition"
          >
            <IndianRupee className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>Collect Payment</span>
          </button>

          {/* 💬 Send WhatsApp */}
          <Link
            href="/outreach"
            className="inline-flex items-center space-x-2 py-2.5 px-5 rounded-full bg-[#111622] hover:bg-[#182030] text-slate-200 border border-slate-800 font-bold text-xs transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>Send WhatsApp</span>
          </Link>

          {/* 🗓️ Floor Check In */}
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="inline-flex items-center space-x-2 py-2.5 px-5 rounded-full bg-[#111622] hover:bg-[#182030] text-slate-200 border border-slate-800 font-bold text-xs transition"
          >
            <Calendar className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>Floor Check In</span>
          </button>
        </div>
      </div>

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
