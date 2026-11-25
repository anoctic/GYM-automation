"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { signOut } from "@/actions/auth";
import type { Gym, MembershipPlan } from "@/types/database";
import {
  CreditCard,
  QrCode,
  Clock,
  Printer,
  BarChart3,
  Dumbbell,
  Users2,
  MessageCircle,
  Building,
  CheckCircle2,
  ChevronRight,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";

interface MoreClientProps {
  gym: Gym;
  plans: MembershipPlan[];
}

export function MoreClient({ gym, plans }: MoreClientProps) {
  const router = useRouter();
  const [isQrPosterOpen, setIsQrPosterOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiId, setUpiId] = useState(gym.upi_primary_id || "fitnessplanet@upi");
  const [qrCheckInDataUrl, setQrCheckInDataUrl] = useState<string | null>(null);
  const [qrEnrollDataUrl, setQrEnrollDataUrl] = useState<string | null>(null);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string | null>(null);

  const gymName = gym.name || "Fitness Planet Unisex Gym";
  const gymSlug = gym.slug || "fitness-planet-sikandrabad";
  const gymPhone = gym.phone || "+91 9149183060";

  async function openPosterModal() {
    setIsQrPosterOpen(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://gym-automation-two.vercel.app";
    const checkInUrl = `${origin}/checkin/${gymSlug}?mode=self`;
    const enrollUrl = `${origin}/join/${gymSlug}`;
    try {
      const [ciUrl, enUrl] = await Promise.all([
        QRCode.toDataURL(checkInUrl, { width: 280, margin: 2 }),
        QRCode.toDataURL(enrollUrl, { width: 280, margin: 2 }),
      ]);
      setQrCheckInDataUrl(ciUrl);
      setQrEnrollDataUrl(enUrl);
    } catch (e) {}
  }

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  async function openUpiModal() {
    setIsUpiModalOpen(true);
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(gymName)}&cu=INR`;
    try {
      const url = await QRCode.toDataURL(upiLink, { width: 250, margin: 2 });
      setUpiQrDataUrl(url);
    } catch (e) {}
  }

  function handlePrintPoster() {
    window.print();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <h1 className="text-2xl font-black text-main">More</h1>

      {/* Electric Lime Owner Card (Exact Video Match) */}
      <div className="bg-[var(--lime)] text-[var(--obsidian)] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[var(--obsidian)] text-[var(--lime)] flex items-center justify-center font-extrabold text-lg shrink-0">
          KR
        </div>
        <div className="min-w-0">
          <div className="text-base font-extrabold leading-tight">Kapil Rajput</div>
          <div className="text-xs font-semibold opacity-85 truncate">
            Owner • {gymName}
          </div>
          <div className="text-[11px] font-mono mt-0.5 opacity-75">{gymPhone}</div>
        </div>
      </div>

      {/* 1. Money Section */}
      <div>
        <div className="more-group-title">Money</div>
        <div className="more-list">
          <Link href="/payments" prefetch={true} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Payments &amp; Dues</div>
                <div className="text-xs text-muted-theme">All collections &amp; receipts</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </Link>

          <button onClick={openUpiModal} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">UPI QR</div>
                <div className="text-xs text-muted-theme">Direct UPI fee collections</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </button>
        </div>
      </div>

      {/* 2. Operations Section */}
      <div>
        <div className="more-group-title">Operations</div>
        <div className="more-list">
          <Link href="/attendance" prefetch={true} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Attendance Log</div>
                <div className="text-xs text-muted-theme">Full check-in history</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </Link>

          <button onClick={openPosterModal} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Entrance QR Poster</div>
                <div className="text-xs text-muted-theme">Print for gym reception desk</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </button>

          <Link href="/payments" prefetch={true} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Reports &amp; Register</div>
                <div className="text-xs text-muted-theme">Revenue, collections, members</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </Link>
        </div>
      </div>

      {/* 3. Team & Plans Section */}
      <div>
        <div className="more-group-title">Team &amp; Plans</div>
        <div className="more-list">
          <Link href="/plans" prefetch={true} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-pink-50 dark:bg-pink-950/40 text-pink-600">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Membership Plans</div>
                <div className="text-xs text-muted-theme">
                  {plans.map((p) => `₹${p.price}`).slice(0, 4).join(" • ") || "₹999 • ₹2,599 • ₹4,999 • ₹9,999"}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </Link>

          <div className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <Users2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Staff &amp; Trainers</div>
                <div className="text-xs text-muted-theme">Kapil Rajput (Owner) • +91 9149183060</div>
              </div>
            </div>
            <span className="owner-pill text-[10px]">Active</span>
          </div>
        </div>
      </div>

      {/* 4. Setup & Account Section */}
      <div>
        <div className="more-group-title">Setup &amp; Account</div>
        <div className="more-list">
          <Link href="/outreach" prefetch={true} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Reminder Settings</div>
                <div className="text-xs text-muted-theme">WhatsApp templates &amp; automated timing</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </Link>

          <Link href="/settings" prefetch={true} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Gym Profile &amp; Logo</div>
                <div className="text-xs text-muted-theme">Timings, Sikandrabad address, Logo photo</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </Link>

          <Link href="/settings" prefetch={true} className="more-row">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-main">Admin Credentials &amp; Password</div>
                <div className="text-xs text-muted-theme">Change login username, email &amp; password</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-theme" />
          </Link>

          <button onClick={handleLogout} className="more-row text-red-600 dark:text-red-400">
            <div className="flex items-center gap-3">
              <div className="more-icon bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold">Sign Out</div>
                <div className="text-xs opacity-75">Lock admin dashboard and return to login</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </button>
        </div>
      </div>

      {/* ENTRANCE DUAL QR POSTER MODAL */}
      {isQrPosterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#14161A] text-slate-900 dark:text-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative border border-theme">
            <div className="flex items-center justify-between no-print">
              <h3 className="font-black text-lg">Dual-QR Entrance Desk Poster</h3>
              <button
                onClick={() => setIsQrPosterOpen(false)}
                className="w-8 h-8 rounded-full border border-theme flex items-center justify-center hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 bg-white text-black rounded-2xl border-2 border-black text-center space-y-4">
              <div>
                <div className="text-xs font-black tracking-widest uppercase text-emerald-700">{gymName}</div>
                <h4 className="font-extrabold text-base leading-tight">RECEPTION SELF-SERVICE KIOSK</h4>
                <p className="text-[11px] text-slate-500">Sikandrabad • Scan with phone camera</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-black uppercase text-emerald-700">1. Self Check-In / Out</div>
                  {qrCheckInDataUrl && (
                    <img src={qrCheckInDataUrl} alt="Check-In QR" className="w-36 h-36 mx-auto" />
                  )}
                  <p className="text-[10px] text-slate-600 font-semibold">
                    Start workout timer on entry &amp; stop on exit
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="text-[11px] font-black uppercase text-amber-700">2. New Member Registration</div>
                  {qrEnrollDataUrl && (
                    <img src={qrEnrollDataUrl} alt="Self Enrollment QR" className="w-36 h-36 mx-auto" />
                  )}
                  <p className="text-[10px] text-slate-600 font-semibold">
                    Scan to open self-enrollment form
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                Kiosk: /checkin/{gymSlug} • Join: /join/{gymSlug}
              </div>
            </div>

            <button
              onClick={handlePrintPoster}
              className="no-print w-full py-3 rounded-xl bg-[var(--obsidian)] text-white dark:bg-[var(--lime)] dark:text-[var(--obsidian)] font-bold text-sm flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Dual-QR Poster for Desk
            </button>
          </div>
        </div>
      )}

      {/* UPI QR MODAL */}
      {isUpiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#14161A] text-slate-900 dark:text-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative border border-theme">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg">Gym UPI QR</h3>
              <button
                onClick={() => setIsUpiModalOpen(false)}
                className="w-8 h-8 rounded-full border border-theme flex items-center justify-center hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-white text-black rounded-2xl border border-slate-200 text-center space-y-3">
              <h4 className="font-extrabold text-base">{gymName}</h4>
              <p className="text-xs text-slate-600">Scan to pay membership fees</p>

              {upiQrDataUrl && (
                <div className="flex justify-center py-2">
                  <img src={upiQrDataUrl} alt="UPI QR" className="w-44 h-44" />
                </div>
              )}

              <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg">
                {upiId}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
