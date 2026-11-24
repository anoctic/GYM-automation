"use client";

import { useState } from "react";
import { approveAdmission, rejectAdmission } from "@/actions/admissions";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { Admission, PaymentMethod } from "@/types/database";
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Layers,
  ExternalLink,
  X,
  CreditCard,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface AdmissionsClientProps {
  initialAdmissions: Admission[];
  gymId: string;
  isDemo: boolean;
}

export function AdmissionsClient({
  initialAdmissions,
  gymId,
  isDemo,
}: AdmissionsClientProps) {
  const [admissions, setAdmissions] = useState<Admission[]>(initialAdmissions);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [approveModalItem, setApproveModalItem] = useState<Admission | null>(null);

  // Approval Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [referenceId, setReferenceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const filteredAdmissions = admissions.filter((a) => {
    if (statusFilter === "all") return true;
    return a.status === statusFilter;
  });

  async function handleApproveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!approveModalItem) return;
    setLoading(true);

    const res = await approveAdmission({
      admission_id: approveModalItem.id,
      initial_payment_amount: paymentAmount,
      payment_method: paymentMethod,
      reference_id: referenceId || undefined,
    });

    setLoading(false);

    if (res.error) {
      setMessage({ text: res.error, type: "error" });
      return;
    }

    if (res.success) {
      setAdmissions((prev) =>
        prev.map((a) => (a.id === approveModalItem.id ? { ...a, status: "approved" } : a))
      );
      setMessage({
        text: `Successfully enrolled ${approveModalItem.applicant_name} as member ${res.memberCode}!`,
        type: "success",
      });
      setApproveModalItem(null);
    }
  }

  async function handleReject(admissionId: string) {
    if (!confirm("Are you sure you want to reject this admission?")) return;
    setLoading(true);
    const res = await rejectAdmission(admissionId);
    setLoading(false);

    if (res.success) {
      setAdmissions((prev) =>
        prev.map((a) => (a.id === admissionId ? { ...a, status: "rejected" } : a))
      );
      setMessage({ text: "Admission marked as rejected.", type: "success" });
    } else if (res.error) {
      setMessage({ text: res.error, type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center">
            <UserPlus className="w-6 h-6 text-emerald-500 mr-2" />
            Walk-in Admissions & Registration Queue
          </h1>
          <p className="text-sm text-muted-theme mt-1">
            Review online self-admissions submitted by walk-in applicants via your public link or desk tablet.
          </p>
        </div>

        <Link
          href={`/join/${gymId}`}
          target="_blank"
          className="px-4 py-2 bg-surface hover:border-emerald-500 border border-theme text-main rounded-xl text-xs font-semibold transition flex items-center shadow-xs"
        >
          <ExternalLink className="w-4 h-4 mr-1.5 text-emerald-500" />
          Open Public Join Link
        </Link>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-muted-theme hover:text-main">
            ✕
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-1.5 bg-surface border border-theme p-1.5 rounded-xl w-fit">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              statusFilter === status
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-theme hover:text-main"
            }`}
          >
            {status} ({admissions.filter((a) => (status === "all" ? true : a.status === status)).length})
          </button>
        ))}
      </div>

      {/* Admissions Table / Stacked Mobile Cards */}
      <div className="bg-surface border border-theme rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs responsive-table">
          <thead className="bg-app text-muted-theme font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Applicant</th>
              <th className="py-3 px-4">Contact & WhatsApp</th>
              <th className="py-3 px-4">Selected Plan</th>
              <th className="py-3 px-4">Submitted Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {filteredAdmissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-theme">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UserPlus className="w-8 h-8 text-muted-theme/40" />
                    <p className="text-sm font-medium">No admissions applications found in this view.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAdmissions.map((adm) => {
                const cleanPhone = adm.phone.replace(/[^0-9]/g, "");
                const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                  `Namaste ${adm.applicant_name}! Fitness Planet Unisex Gym, Sikandrabad se Kapil Rajput baat kar raha hoon. Aapka membership form receive hua hai. Welcome to Fitness Planet!`
                )}`;

                return (
                  <tr key={adm.id} className="hover:bg-app/50 transition">
                    <td data-label="Applicant" className="py-3.5 px-4">
                      <span className="font-bold text-main block">{adm.applicant_name}</span>
                      <span className="text-[10px] text-muted-theme font-mono">ID: {adm.id.slice(0, 8)}</span>
                    </td>

                    <td data-label="Contact" className="py-3.5 px-4 text-main">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs">{adm.phone}</span>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                          title="Message on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      {adm.email && (
                        <div className="flex items-center space-x-1 text-muted-theme text-[11px] mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{adm.email}</span>
                        </div>
                      )}
                    </td>

                    <td data-label="Selected Plan" className="py-3.5 px-4">
                      {adm.membership_plans ? (
                        <div>
                          <span className="font-semibold text-main block">
                            {adm.membership_plans.name}
                          </span>
                          <span className="text-[11px] text-emerald-500 font-mono font-medium">
                            {formatCurrency(adm.membership_plans.price)} (
                            {adm.membership_plans.duration_days} days)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-theme italic">No plan selected</span>
                      )}
                    </td>

                    <td data-label="Submitted Date" className="py-3.5 px-4 text-muted-theme font-mono text-[11px]">
                      {formatDate(adm.submitted_at)} • {formatTime(adm.submitted_at)}
                    </td>

                    <td data-label="Status" className="py-3.5 px-4">
                      {adm.status === "pending" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          ● Pending Review
                        </span>
                      )}
                      {adm.status === "approved" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          ✓ Enrolled Active
                        </span>
                      )}
                      {adm.status === "rejected" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface text-muted-theme border border-theme">
                          ✕ Rejected
                        </span>
                      )}
                    </td>

                    <td data-label="Actions" className="py-3.5 px-4 text-right">
                      {adm.status === "pending" ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setApproveModalItem(adm);
                              const planPrice = Number(adm.membership_plans?.price || 0);
                              const admFee = Number(adm.membership_plans?.admission_fee || 0);
                              setPaymentAmount(planPrice + admFee);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve & Enroll
                          </button>
                          <button
                            onClick={() => handleReject(adm.id)}
                            className="px-2.5 py-1.5 bg-surface hover:bg-rose-500/10 hover:text-rose-400 text-muted-theme rounded-xl text-xs transition flex items-center border border-theme"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-theme">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* APPROVE ADMISSION MODAL */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setApproveModalItem(null)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-main mb-1 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Approve Admission & Enroll
            </h2>
            <p className="text-xs text-muted-theme mb-4">
              Converts <strong className="text-main">{approveModalItem.applicant_name}</strong> into an active member with an auto-generated member code.
            </p>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="p-3 bg-app rounded-xl border border-theme text-xs space-y-1.5">
                <div className="flex justify-between text-muted-theme">
                  <span>Selected Plan:</span>
                  <span className="font-bold text-main">
                    {approveModalItem.membership_plans?.name || "Standard Plan"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-theme">
                  <span>Plan Price:</span>
                  <span className="font-mono text-main">{formatCurrency(approveModalItem.membership_plans?.price || 0)}</span>
                </div>
                {Number(approveModalItem.membership_plans?.admission_fee || 0) > 0 && (
                  <div className="flex justify-between text-muted-theme">
                    <span>Admission Fee:</span>
                    <span className="font-mono text-main">{formatCurrency(approveModalItem.membership_plans?.admission_fee || 0)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Initial Collected Payment (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-[10px] text-muted-theme mt-1 block">
                  Remaining amount (if any) will automatically be tracked as pending dues.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI (QR / Google Pay / PhonePe)</option>
                  <option value="CASH">Cash at Front Desk</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Reference / UTR ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-984210344"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setApproveModalItem(null)}
                  className="px-4 py-2 bg-surface hover:bg-surface/80 border border-theme text-main rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/40 disabled:opacity-50"
                >
                  {loading ? "Approving..." : "Confirm & Enroll Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
