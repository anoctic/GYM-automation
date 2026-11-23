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
  CreditCard
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
          <h1 className="text-2xl font-bold text-white flex items-center">
            <UserPlus className="w-6 h-6 text-emerald-400 mr-2" />
            Walk-in Admissions & Self-Registration Queue
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Review self-admissions submitted by walk-in applicants via your public join link.
          </p>
        </div>

        <Link
          href={`/join/${gymId}`}
          target="_blank"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition flex items-center border border-gray-700 shadow"
        >
          <ExternalLink className="w-4 h-4 mr-1.5 text-emerald-400" />
          Test Walk-in Join Link
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
              : "bg-red-950/70 border-red-800 text-red-300"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 bg-gray-900 border border-gray-800 p-1.5 rounded-lg w-fit">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
              statusFilter === status
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {status} ({admissions.filter((a) => (status === "all" ? true : a.status === status)).length})
          </button>
        ))}
      </div>

      {/* Admissions List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-800/80 text-gray-400 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Selected Plan</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No admissions applications found.
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{adm.applicant_name}</span>
                      <span className="text-[11px] text-gray-400 font-mono">ID: {adm.id.slice(0, 8)}</span>
                    </td>

                    <td className="py-3 px-4 text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{adm.phone}</span>
                      </div>
                      {adm.email && (
                        <div className="flex items-center space-x-1 text-gray-400 text-[11px]">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span>{adm.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {adm.membership_plans ? (
                        <div>
                          <span className="font-semibold text-white block">
                            {adm.membership_plans.name}
                          </span>
                          <span className="text-[11px] text-emerald-400">
                            {formatCurrency(adm.membership_plans.price)} (
                            {adm.membership_plans.duration_days} days)
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No plan selected</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-400">
                      {formatDate(adm.submitted_at)} at {formatTime(adm.submitted_at)}
                    </td>

                    <td className="py-3 px-4">
                      {adm.status === "pending" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          Pending Approval
                        </span>
                      )}
                      {adm.status === "approved" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Approved & Enrolled
                        </span>
                      )}
                      {adm.status === "rejected" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                          Rejected
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {adm.status === "pending" ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setApproveModalItem(adm);
                              const planPrice = Number(adm.membership_plans?.price || 0);
                              const admFee = Number(adm.membership_plans?.admission_fee || 0);
                              setPaymentAmount(planPrice + admFee);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition flex items-center shadow"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(adm.id)}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-rose-950 hover:text-rose-300 text-gray-300 rounded text-xs transition flex items-center border border-gray-700"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVE ADMISSION MODAL */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setApproveModalItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Approve Admission & Enroll</h2>
            <p className="text-xs text-gray-400 mb-4">
              Converts <strong className="text-white">{approveModalItem.applicant_name}</strong> into an active member record.
            </p>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="p-3 bg-gray-800/60 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span>Selected Plan:</span>
                  <span className="font-semibold text-white">
                    {approveModalItem.membership_plans?.name || "Standard Plan"}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Plan Price:</span>
                  <span>{formatCurrency(approveModalItem.membership_plans?.price || 0)}</span>
                </div>
                {Number(approveModalItem.membership_plans?.admission_fee || 0) > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Admission Fee:</span>
                    <span>{formatCurrency(approveModalItem.membership_plans?.admission_fee || 0)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Initial Collected Payment (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI (QR / Google Pay)</option>
                  <option value="CASH">Cash at Front Desk</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Reference / UTR ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-984210344"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setApproveModalItem(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50"
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
