"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { collectDues } from "@/actions/members";
import type { Gym, Payment, Member, PaymentMethod } from "@/types/database";
import {
  CreditCard,
  QrCode,
  Printer,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  Receipt,
  Download,
} from "lucide-react";

interface PaymentsClientProps {
  gym: Gym;
  payments: Payment[];
  membersWithDues: Member[];
  allMembers: Member[];
}

export function PaymentsClient({
  gym,
  payments: initialPayments,
  membersWithDues: initialDues,
  allMembers,
}: PaymentsClientProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [membersWithDues, setMembersWithDues] = useState<Member[]>(initialDues);

  const [activeTab, setActiveTab] = useState<"collections" | "outstanding">("collections");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);

  // Collect form state
  const [collectMemberId, setCollectMemberId] = useState(allMembers[0]?.id || "");
  const [collectAmount, setCollectAmount] = useState<number>(1000);
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>("UPI");
  const [collectRef, setCollectRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic QR State
  const [qrAmount, setQrAmount] = useState<number>(1000);
  const [qrMemberName, setQrMemberName] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // UPI configuration from Gym
  const upiId = gym.upi_primary_id || "9149183060@paytm";
  const upiName = gym.upi_primary_name || "Fitness Planet Unisex Gym";

  // Financial Stats
  const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalDues = membersWithDues.reduce((acc, m) => acc + Number(m.pending_dues), 0);
  const upiCount = payments.filter((p) => p.payment_method === "UPI").length;
  const cashCount = payments.filter((p) => p.payment_method === "CASH").length;

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== "all" && p.payment_method !== methodFilter) return false;
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const memName = p.members?.full_name?.toLowerCase() || "";
      const memCode = p.members?.member_code?.toLowerCase() || "";
      const rcp = p.receipt_no.toLowerCase();
      return memName.includes(term) || memCode.includes(term) || rcp.includes(term);
    }
    return true;
  });

  // Filtered Dues
  const filteredDues = membersWithDues.filter((m) => {
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      return (
        m.full_name.toLowerCase().includes(term) ||
        m.phone.toLowerCase().includes(term) ||
        m.member_code.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Generate Dynamic UPI QR Code
  useEffect(() => {
    if (!isQrModalOpen) return;
    const cleanUpiId = encodeURIComponent(upiId);
    const cleanUpiName = encodeURIComponent(upiName);
    const note = encodeURIComponent(`Gym Fee - ${qrMemberName || "Fitness Planet"}`);
    const upiString = `upi://pay?pa=${cleanUpiId}&pn=${cleanUpiName}&am=${qrAmount}&tn=${note}&cu=INR`;

    QRCode.toDataURL(upiString, {
      width: 260,
      margin: 1,
      color: { dark: "#06101e", light: "#ffffff" },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [isQrModalOpen, qrAmount, qrMemberName, upiId, upiName]);

  // Handle Fee Collection
  async function handleCollectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!collectMemberId || collectAmount <= 0) return;
    setLoading(true);
    const res = await collectDues({
      member_id: collectMemberId,
      amount: collectAmount,
      payment_method: collectMethod,
      reference_id: collectRef || undefined,
    });
    setLoading(false);

    if (res.success && res.payment) {
      setPayments((prev) => [res.payment as Payment, ...prev]);
      setMembersWithDues((prev) =>
        prev
          .map((m) =>
            m.id === collectMemberId
              ? { ...m, pending_dues: Math.max(0, Number(m.pending_dues) - collectAmount) }
              : m
          )
          .filter((m) => Number(m.pending_dues) > 0)
      );
      setIsCollectModalOpen(false);
      setCollectAmount(0);
      setCollectRef("");
      showToast(`Receipt created! Collected ${formatCurrency(collectAmount)}.`);
    } else if (res.error) {
      alert(res.error);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function copyUpiId() {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
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

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-main">Payments &amp; Collections</h1>
          <p className="text-xs text-muted-theme mt-1">
            Real-time receipt ledger, outstanding dues recovery, and dynamic UPI QR code generator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Request Payment UPI QR Button */}
          <button
            onClick={() => {
              setQrAmount(1000);
              setQrMemberName("");
              setIsQrModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center shadow-xs"
          >
            <QrCode className="w-4 h-4 mr-1.5" />
            Request UPI QR
          </button>

          {/* Record Payment Button */}
          <button
            onClick={() => setIsCollectModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Record Fee Payment
          </button>
        </div>
      </div>

      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-theme">
          <span className="text-xs font-semibold text-muted-theme uppercase tracking-wider block">Total Collections</span>
          <span className="text-2xl font-black text-emerald-400 font-mono-code block mt-1">
            {formatCurrency(totalRevenue)}
          </span>
          <span className="text-[11px] text-muted-theme block mt-1">
            {payments.length} receipts ({upiCount} UPI, {cashCount} Cash)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-theme">
          <span className="text-xs font-semibold text-muted-theme uppercase tracking-wider block">Outstanding Dues</span>
          <span className="text-2xl font-black text-amber-400 font-mono-code block mt-1">
            {formatCurrency(totalDues)}
          </span>
          <span className="text-[11px] text-muted-theme block mt-1">
            {membersWithDues.length} members with pending balance
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-theme flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-theme uppercase tracking-wider block">Primary UPI Gateway</span>
            <span className="text-sm font-bold text-main font-mono-code block mt-1 truncate">
              {upiId}
            </span>
            <span className="text-[11px] text-emerald-400 block font-medium mt-0.5 truncate">{upiName}</span>
          </div>
          <button
            onClick={copyUpiId}
            className="mt-2 text-[11px] font-bold text-amber-400 hover:underline flex items-center"
          >
            {copiedUpi ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copiedUpi ? "Copied UPI ID!" : "Copy UPI VPA"}
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="p-4 rounded-2xl bg-surface border border-theme space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab("collections")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === "collections"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-input-field text-muted-theme hover:text-main"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Collections History ({payments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("outstanding")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === "outstanding"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-input-field text-muted-theme hover:text-main"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Outstanding Dues ({membersWithDues.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-dim-theme" />
            <input
              type="text"
              placeholder="Search receipt, member, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main placeholder-dim-theme focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Method Filter Pills for Collections */}
        {activeTab === "collections" && (
          <div className="flex items-center space-x-1.5 pt-1">
            {["all", "UPI", "CASH", "BANK_TRANSFER"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  methodFilter === m
                    ? "bg-surface text-emerald-400 border border-emerald-500/40 font-bold"
                    : "bg-input-field text-muted-theme hover:text-main"
                }`}
              >
                {m === "all" ? "All Methods" : m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: COLLECTIONS LEDGER */}
      {activeTab === "collections" && (
        <div className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs responsive-table">
              <thead className="bg-app border-b border-subtle-theme text-[11px] font-bold text-muted-theme uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt No.</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-theme">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-theme">
                      No payment receipts match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="bg-surface-hover transition-colors">
                      <td className="py-3.5 px-4" data-label="Receipt No.">
                        <span className="font-mono-code font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          {p.receipt_no}
                        </span>
                      </td>

                      <td className="py-3.5 px-4" data-label="Member">
                        <span className="font-bold text-main block">{p.members?.full_name || "Member"}</span>
                        <span className="text-[11px] text-muted-theme font-mono-code">
                          {p.members?.member_code} • {p.members?.phone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4" data-label="Amount">
                        <span className="font-mono-code font-black text-main text-sm">
                          {formatCurrency(p.amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4" data-label="Method">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-surface border border-theme text-main">
                          {p.payment_method}
                          {p.reference_id && (
                            <span className="text-[10px] text-dim-theme ml-1 font-mono-code">
                              ({p.reference_id})
                            </span>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4" data-label="Date">
                        <span className="text-main block">{formatDate(p.paid_at)}</span>
                        <span className="text-[10px] text-dim-theme">{formatTime(p.paid_at)}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right" data-label="Actions">
                        <button
                          onClick={() => {
                            setActivePayment(p);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface hover:bg-surface-hover text-emerald-400 border border-theme inline-flex items-center space-x-1"
                          title="View / Print Official Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: OUTSTANDING DUES TABLE */}
      {activeTab === "outstanding" && (
        <div className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs responsive-table">
              <thead className="bg-app border-b border-subtle-theme text-[11px] font-bold text-muted-theme uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member Code</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Outstanding Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-theme">
                {filteredDues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-theme">
                      🎉 No members with pending dues! All accounts are fully cleared.
                    </td>
                  </tr>
                ) : (
                  filteredDues.map((m) => (
                    <tr key={m.id} className="bg-surface-hover transition-colors">
                      <td className="py-3.5 px-4" data-label="Code">
                        <span className="font-mono-code font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          {m.member_code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4" data-label="Name">
                        <span className="font-bold text-main">{m.full_name}</span>
                      </td>

                      <td className="py-3.5 px-4" data-label="Phone">
                        <span className="text-muted-theme">{m.phone}</span>
                      </td>

                      <td className="py-3.5 px-4" data-label="Balance">
                        <span className="font-mono-code font-black text-amber-400 text-sm">
                          {formatCurrency(m.pending_dues)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right" data-label="Actions">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setQrAmount(Number(m.pending_dues));
                              setQrMemberName(m.full_name);
                              setIsQrModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 inline-flex items-center"
                          >
                            <QrCode className="w-3.5 h-3.5 mr-1" />
                            UPI QR
                          </button>

                          <button
                            onClick={() => {
                              setCollectMemberId(m.id);
                              setCollectAmount(Number(m.pending_dues));
                              setIsCollectModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center"
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            Collect
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD PAYMENT / COLLECT FEE                                     */}
      {/* ========================================================================= */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsCollectModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-main">+ Record Fee Payment</h3>
            <p className="text-xs text-muted-theme">
              Generates an immutable payment receipt and deducts from member's pending dues.
            </p>

            <form onSubmit={handleCollectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-theme font-medium mb-1">Select Member *</label>
                <select
                  value={collectMemberId}
                  onChange={(e) => {
                    setCollectMemberId(e.target.value);
                    const chosen = allMembers.find((m) => m.id === e.target.value);
                    if (chosen && Number(chosen.pending_dues) > 0) {
                      setCollectAmount(Number(chosen.pending_dues));
                    }
                  }}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-bold focus:outline-none focus:border-emerald-500"
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_code} - {m.full_name} (Dues: ₹{m.pending_dues})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-theme font-medium mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={collectAmount || ""}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-muted-theme font-medium mb-1">Payment Method *</label>
                  <select
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UPI">UPI ({upiId})</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="BANK_TRANSFER">Bank IMPS/NEFT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-theme font-medium mb-1">Reference / UTR / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-914918489 or cash rec"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || collectAmount <= 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md"
              >
                {loading ? "Recording..." : `Issue Receipt for ${formatCurrency(collectAmount)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REQUEST PAYMENT DYNAMIC UPI QR GENERATOR                         */}
      {/* ========================================================================= */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border-2 border-amber-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 text-center">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full inline-block">
                Instant UPI Payment QR
              </span>
              <h3 className="text-base font-bold text-main">Scan to Pay Fitness Planet</h3>
              <p className="text-xs text-muted-theme">Works with GPay, PhonePe, Paytm, BHIM</p>
            </div>

            {/* Live Amount Input */}
            <div className="p-3 rounded-xl bg-app border border-subtle-theme space-y-2 text-left">
              <label className="block text-[11px] font-semibold text-muted-theme">Requested Amount (₹)</label>
              <input
                type="number"
                min={1}
                value={qrAmount || ""}
                onChange={(e) => setQrAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-mono-code font-bold text-base focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Generated QR Code Canvas Image */}
            <div className="p-3 bg-white rounded-2xl border-4 border-amber-500/40 inline-block shadow-inner mx-auto">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="UPI QR Code" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* VPA Copy Button */}
            <div className="space-y-2">
              <p className="text-xs font-mono-code text-main font-semibold">{upiId}</p>
              <button
                type="button"
                onClick={copyUpiId}
                className="w-full py-2 rounded-xl bg-surface hover:bg-surface-hover text-amber-400 border border-theme font-bold text-xs transition flex items-center justify-center space-x-1.5"
              >
                {copiedUpi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUpi ? "UPI VPA Copied!" : "Copy UPI ID"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRINTABLE OFFICIAL MEMBERSHIP RECEIPT                             */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && activePayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-6 border border-gray-200">
            {/* Modal Controls */}
            <div className="no-print flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Official Payment Receipt
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="space-y-5 text-xs text-gray-800">
              {/* Gym Header */}
              <div className="text-center space-y-1 pb-4 border-b border-gray-300">
                <div className="flex justify-center mb-1">
                  <FitnessPlanetLogo size="sm" showTagline={false} />
                </div>
                <h2 className="text-xl font-black text-gray-950 uppercase tracking-tight">
                  Fitness Planet Unisex Gym
                </h2>
                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">
                  Strong Is Universal • Gym &amp; Health Club
                </p>
                <p className="text-[10px] text-gray-500">
                  Near GT Road, Sikandrabad, UP (203205) • Tel: +91 9149183060
                </p>
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Receipt No.</span>
                  <span className="font-mono text-xs font-bold text-emerald-800">{activePayment.receipt_no}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Date &amp; Time</span>
                  <span className="font-semibold">{formatDate(activePayment.paid_at)} {formatTime(activePayment.paid_at)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Member Name</span>
                  <span className="font-bold text-gray-950">{activePayment.members?.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Member Code</span>
                  <span className="font-mono font-bold text-gray-900">{activePayment.members?.member_code}</span>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead className="bg-gray-100 text-[10px] uppercase font-bold text-gray-600">
                  <tr>
                    <th className="p-2.5 border border-gray-200">Particulars</th>
                    <th className="p-2.5 border border-gray-200 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 border border-gray-200 font-medium">
                      Gym Membership Fee / Dues Payment
                      {activePayment.reference_id && (
                        <span className="text-[10px] text-gray-500 block">Ref: {activePayment.reference_id}</span>
                      )}
                    </td>
                    <td className="p-2.5 border border-gray-200 text-right font-mono font-bold">
                      {formatCurrency(activePayment.amount)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="p-2.5 border border-gray-200">Total Received ({activePayment.payment_method})</td>
                    <td className="p-2.5 border border-gray-200 text-right font-mono text-emerald-800 text-sm">
                      {formatCurrency(activePayment.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-6 flex items-end justify-between text-[11px]">
                <div className="text-gray-500">
                  <p>Computer generated e-receipt.</p>
                  <p>Fees once paid is strictly non-refundable.</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="w-32 border-b border-gray-400 pb-1 font-serif italic text-gray-700">
                    Kapil Rajput
                  </div>
                  <span className="text-[10px] text-gray-600 block font-bold uppercase">
                    Authorized Signatory
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
