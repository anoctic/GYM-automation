"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { Gym, Member, AttendanceLog, Lead } from "@/types/database";
import {
  Bell,
  AlertTriangle,
  Clock,
  Activity,
  Target,
  MessageCircle,
  Phone,
  CheckCircle2,
  ChevronLeft,
  Filter,
  Check,
  Trash2,
  ArrowRight,
} from "lucide-react";

interface NotificationsClientProps {
  gym: Gym;
  isDemo: boolean;
  members: Member[];
  activeSessions: AttendanceLog[];
  recentHistory: AttendanceLog[];
  leads: Lead[];
}

type NotificationCategory = "all" | "dues" | "expiring" | "leads" | "attendance";

interface NotificationItem {
  id: string;
  category: "dues" | "expiring" | "leads" | "attendance";
  title: string;
  message: string;
  time: string;
  priority: "high" | "medium" | "low";
  actionLabel?: string;
  actionUrl?: string;
  isExternalAction?: boolean;
  member?: Member;
  lead?: Lead;
}

export function NotificationsClient({
  gym,
  isDemo,
  members,
  activeSessions,
  recentHistory,
  leads,
}: NotificationsClientProps) {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const gymName = gym.name || "Fitness Planet Unisex Gym";
  const gymPhone = gym.phone || "+91 9149183060";

  // Generate notifications list dynamically
  const allNotifications = useMemo(() => {
    const list: NotificationItem[] = [];
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    // 1. Dues alerts (High priority)
    members
      .filter((m) => Number(m.pending_dues) > 0)
      .forEach((m) => {
        const cleanPhone = m.phone.replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
        const waMsg = encodeURIComponent(
          `Namaste ${m.full_name} ji! 🙏\n${gymName} se reminder:\nAapka pending membership fees ₹${m.pending_dues} due hai. Kripya desk par ya UPI se pay karein. Thank you! 💪`
        );

        list.push({
          id: `due-${m.id}`,
          category: "dues",
          title: "Pending Dues Alert",
          message: `${m.full_name} (${m.member_code}) has an outstanding balance of ₹${m.pending_dues} for ${m.membership_plans?.name || "Membership"}.`,
          time: "Action Required",
          priority: "high",
          actionLabel: "WhatsApp Reminder",
          actionUrl: `https://wa.me/${formattedPhone}?text=${waMsg}`,
          isExternalAction: true,
          member: m,
        });
      });

    // 2. Expiring / Expired alerts
    members
      .filter((m) => {
        if (m.status === "expired") return true;
        const expiry = new Date(m.expiry_date);
        return expiry >= now && expiry <= next7Days;
      })
      .forEach((m) => {
        const isExpired = m.status === "expired";
        const cleanPhone = m.phone.replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
        const waMsg = encodeURIComponent(
          `Namaste ${m.full_name} ji! 🙏\n${gymName} se reminder:\nAapka package (${m.membership_plans?.name || "Gym Plan"}) ${isExpired ? "expire ho chuka hai" : `expires on ${formatDate(m.expiry_date)}`}. Kripya renew karwayein taaki workout continue rahe! 💪`
        );

        list.push({
          id: `exp-${m.id}`,
          category: "expiring",
          title: isExpired ? "Membership Expired" : "Renewal Due Soon",
          message: `${m.full_name} (${m.member_code}) ${isExpired ? "expired" : "expires"} on ${formatDate(m.expiry_date)}.`,
          time: formatDate(m.expiry_date),
          priority: isExpired ? "high" : "medium",
          actionLabel: "Remind Renewal",
          actionUrl: `https://wa.me/${formattedPhone}?text=${waMsg}`,
          isExternalAction: true,
          member: m,
        });
      });

    // 3. New CRM Leads inquiries
    leads.slice(0, 5).forEach((l) => {
      list.push({
        id: `lead-${l.id}`,
        category: "leads",
        title: `CRM Lead: ${l.name}`,
        message: `New prospect inquiry for ${gymName}. Stage: ${l.stage.replace("_", " ").toUpperCase()}${l.phone ? ` • Contact: ${l.phone}` : ""}.`,
        time: formatDate(l.created_at),
        priority: l.stage === "new_inquiry" ? "high" : "medium",
        actionLabel: "Open Lead CRM",
        actionUrl: `/leads`,
        isExternalAction: false,
        lead: l,
      });
    });

    // 4. Live Attendance
    activeSessions.slice(0, 4).forEach((s) => {
      list.push({
        id: `att-${s.id}`,
        category: "attendance",
        title: "Live On Floor",
        message: `${s.members?.full_name || "Member"} (${s.members?.member_code || ""}) checked in via ${s.method} at ${formatTime(s.check_in_at)}.`,
        time: formatTime(s.check_in_at),
        priority: "low",
        actionLabel: "Floor Live",
        actionUrl: `/attendance`,
        isExternalAction: false,
      });
    });

    return list;
  }, [members, activeSessions, leads, gymName]);

  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((n) => {
      if (activeCategory === "all") return true;
      return n.category === activeCategory;
    });
  }, [allNotifications, activeCategory]);

  const unreadCount = allNotifications.filter((n) => !readIds.has(n.id)).length;

  function markAllAsRead() {
    const allIds = new Set(allNotifications.map((n) => n.id));
    setReadIds(allIds);
    showToast("All notifications marked as read.");
  }

  function markAsRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id));
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-full border border-theme bg-surface hover:bg-surface-hover flex items-center justify-center text-main transition"
            aria-label="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-main flex items-center gap-2">
              <span>Notifications &amp; Alerts</span>
              {unreadCount > 0 && (
                <span className="owner-pill text-[11px] font-bold">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-theme font-medium mt-0.5">
              Live updates for {gymName}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-muted-theme hover:text-main px-3 py-1.5 rounded-xl border border-theme bg-surface hover:bg-surface-hover transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
            activeCategory === "all"
              ? "bg-[var(--obsidian)] text-white dark:bg-[var(--lime)] dark:text-[var(--obsidian)]"
              : "bg-surface text-muted-theme hover:text-main border border-theme"
          }`}
        >
          All ({allNotifications.length})
        </button>

        <button
          onClick={() => setActiveCategory("dues")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
            activeCategory === "dues"
              ? "bg-[var(--obsidian)] text-white dark:bg-[var(--lime)] dark:text-[var(--obsidian)]"
              : "bg-surface text-muted-theme hover:text-main border border-theme"
          }`}
        >
          💳 Dues ({allNotifications.filter((n) => n.category === "dues").length})
        </button>

        <button
          onClick={() => setActiveCategory("expiring")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
            activeCategory === "expiring"
              ? "bg-[var(--obsidian)] text-white dark:bg-[var(--lime)] dark:text-[var(--obsidian)]"
              : "bg-surface text-muted-theme hover:text-main border border-theme"
          }`}
        >
          🕒 Expiring ({allNotifications.filter((n) => n.category === "expiring").length})
        </button>

        <button
          onClick={() => setActiveCategory("leads")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
            activeCategory === "leads"
              ? "bg-[var(--obsidian)] text-white dark:bg-[var(--lime)] dark:text-[var(--obsidian)]"
              : "bg-surface text-muted-theme hover:text-main border border-theme"
          }`}
        >
          🎯 Leads ({allNotifications.filter((n) => n.category === "leads").length})
        </button>

        <button
          onClick={() => setActiveCategory("attendance")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
            activeCategory === "attendance"
              ? "bg-[var(--obsidian)] text-white dark:bg-[var(--lime)] dark:text-[var(--obsidian)]"
              : "bg-surface text-muted-theme hover:text-main border border-theme"
          }`}
        >
          ✅ Floor ({allNotifications.filter((n) => n.category === "attendance").length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="card text-center py-12 space-y-2">
            <div className="text-3xl">🎉</div>
            <h3 className="font-extrabold text-base text-main">All caught up!</h3>
            <p className="text-xs text-muted-theme max-w-sm mx-auto">
              No notifications in this category. All gym dues, renewals and floor sessions are up to date.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isRead = readIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`card p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isRead ? "opacity-75 bg-surface/60" : "bg-surface border-theme shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Category Icon */}
                  <div className="shrink-0 mt-0.5">
                    {item.category === "dues" && (
                      <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                        💳
                      </div>
                    )}
                    {item.category === "expiring" && (
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                        🕒
                      </div>
                    )}
                    {item.category === "leads" && (
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                        🎯
                      </div>
                    )}
                    {item.category === "attendance" && (
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                        ✅
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-main leading-tight">
                        {item.title}
                      </span>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-theme font-medium leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[11px] text-dim-theme font-mono block">
                      {item.time}
                    </span>
                  </div>
                </div>

                {/* Quick Action Button */}
                {item.actionLabel && (
                  <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0">
                    {item.isExternalAction ? (
                      <a
                        href={item.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{item.actionLabel}</span>
                      </a>
                    ) : (
                      <Link
                        href={item.actionUrl || "#"}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--obsidian)] hover:opacity-90 text-white dark:bg-[var(--lime)] dark:text-[var(--obsidian)] flex items-center gap-1.5 transition shadow-xs"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
