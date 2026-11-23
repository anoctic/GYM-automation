"use client";

import { useState } from "react";
import { 
  enrollMember, 
  renewMember, 
  toggleMemberFreeze, 
  collectDues,
  softDeleteMember,
  restoreMember
} from "@/actions/members";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Member, MembershipPlan, PaymentMethod, MemberStatus } from "@/types/database";
import { 
  Users, 
  UserPlus, 
  Search, 
  Snowflake, 
  RefreshCw, 
  IndianRupee, 
  Trash2, 
  RotateCcw,
  Archive,
  X,
  CreditCard,
  Clock,
  ShieldAlert
} from "lucide-react";

interface MembersClientProps {
  initialMembers: Member[];
  plans: MembershipPlan[];
  isDemo: boolean;
}

export function MembersClient({ initialMembers, plans, isDemo }: MembersClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [duesModalMember, setDuesModalMember] = useState<Member | null>(null);
  const [renewModalMember, setRenewModalMember] = useState<Member | null>(null);

  // Enroll Form State
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [address, setAddress] = useState("Sikandrabad");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [referenceId, setReferenceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collect Dues State
  const [duesAmount, setDuesAmount] = useState<number>(0);
  const [duesMethod, setDuesMethod] = useState<PaymentMethod>("UPI");
  const [duesRef, setDuesRef] = useState("");

  // Renew Plan State
  const [renewPlanId, setRenewPlanId] = useState(plans[0]?.id || "");
  const [renewPayment, setRenewPayment] = useState<number>(0);
  const [renewMethod, setRenewMethod] = useState<PaymentMethod>("UPI");
  const [renewRef, setRenewRef] = useState("");

  // Filter members (Active vs Archived)
  const filteredMembers = members.filter((m) => {
    // Soft delete filter
    if (showArchived && !m.deleted_at) return false;
    if (!showArchived && m.deleted_at) return false;

    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.full_name.toLowerCase().includes(term) ||
      m.phone.toLowerCase().includes(term) ||
      m.member_code.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const totalEnrollFee = selectedPlan
    ? Number(selectedPlan.price) + Number(selectedPlan.admission_fee || 0)
    : 0;

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await enrollMember({
      full_name: fullName,
      father_name: fatherName || undefined,
      gender,
      address,
      phone,
      email: email || undefined,
      plan_id: selectedPlanId,
      join_date: joinDate,
      initial_payment_amount: initialPayment,
      payment_method: paymentMethod,
      reference_id: referenceId || undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.member) {
      setMembers((prev) => [
        { ...res.member!, membership_plans: selectedPlan },
        ...prev,
      ]);
      setIsEnrollOpen(false);
      setFullName("");
      setPhone("");
      setEmail("");
      setInitialPayment(0);
      setReferenceId("");
    }
  }

  async function handleToggleFreeze(memberId: string) {
    const res = await toggleMemberFreeze(memberId);
    if (res.success && res.member) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: res.member!.status } : m))
      );
    }
  }

  async function handleSoftDelete(memberId: string) {
    if (!confirm("Are you sure you want to soft-delete this member? They can be restored at any time.")) {
      return;
    }
    const res = await softDeleteMember(memberId);
    if (res.error) {
      alert(res.error);
      return;
    }
    if (res.success && res.member) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, deleted_at: res.member!.deleted_at } : m))
      );
    }
  }

  async function handleRestore(memberId: string) {
    const res = await restoreMember(memberId);
    if (res.error) {
      alert(res.error);
      return;
    }
    if (res.success && res.member) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, deleted_at: null } : m))
      );
    }
  }

  async function handleCollectDuesSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!duesModalMember) return;
    setLoading(true);

    const res = await collectDues({
      member_id: duesModalMember.id,
      amount: duesAmount,
      payment_method: duesMethod,
      reference_id: duesRef || undefined,
    });

    setLoading(false);
    if (res.success && res.member) {
      setMembers((prev) =>
        prev.map((m) => (m.id === duesModalMember.id ? { ...m, pending_dues: res.remainingDues! } : m))
      );
      setDuesModalMember(null);
    } else if (res.error) {
      alert(res.error);
    }
  }

  async function handleRenewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!renewModalMember) return;
    setLoading(true);

    const res = await renewMember({
      member_id: renewModalMember.id,
      plan_id: renewPlanId,
      payment_amount: renewPayment,
      payment_method: renewMethod,
      reference_id: renewRef || undefined,
    });

    setLoading(false);
    if (res.success && res.member) {
      const plan = plans.find((p) => p.id === renewPlanId);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === renewModalMember.id
            ? {
                ...m,
                status: "active",
                expiry_date: res.member!.expiry_date,
                pending_dues: res.member!.pending_dues,
                membership_plans: plan || m.membership_plans,
              }
            : m
        )
      );
      setRenewModalMember(null);
    } else if (res.error) {
      alert(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Users className="w-6 h-6 text-emerald-400 mr-2" />
            Members Directory & Lifecycle
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Enroll members, renew memberships, freeze passes, soft-delete, and restore archives.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle Active vs Archived */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center border ${
              showArchived
                ? "bg-amber-950/80 text-amber-300 border-amber-800"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
            }`}
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            {showArchived ? "Viewing Trash / Archived" : "View Trash"}
          </button>

          <button
            onClick={() => {
              if (selectedPlan) {
                setInitialPayment(totalEnrollFee);
              }
              setIsEnrollOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition flex items-center shadow"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Enroll New Member
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-900 border border-gray-800 p-3 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, code (e.g. FP-93)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "active", "expired", "frozen", "trial"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition ${
                statusFilter === status
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-800/80 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Current Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Pending Dues</th>
                <th className="py-3 px-4 text-center">Sessions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    {showArchived
                      ? "Trash is empty. No archived members."
                      : "No members found matching your search."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const isExpired = new Date(m.expiry_date) < new Date();
                  const isDeleted = !!m.deleted_at;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-gray-800/40 transition ${
                        isDeleted ? "opacity-60 bg-gray-950/40" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-emerald-300">
                            {m.full_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{m.full_name}</span>
                            <span className="text-[11px] text-gray-400 font-mono">{m.member_code}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-gray-300">
                        <div>{m.phone}</div>
                        {m.email && <div className="text-[11px] text-gray-400">{m.email}</div>}
                      </td>

                      <td className="py-3 px-4 text-gray-300">
                        <span className="font-medium text-white block">
                          {m.membership_plans?.name || "Custom Plan"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {m.membership_plans?.duration_days ? `${m.membership_plans.duration_days} days` : "Standard"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {isDeleted ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                            Soft-Deleted
                          </span>
                        ) : (
                          <>
                            {m.status === "active" && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Active
                              </span>
                            )}
                            {m.status === "expired" && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                                Expired
                              </span>
                            )}
                            {m.status === "frozen" && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">
                                Frozen
                              </span>
                            )}
                            {m.status === "trial" && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                                Trial
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-mono ${isExpired ? "text-rose-400 font-bold" : "text-gray-300"}`}>
                          {formatDate(m.expiry_date)}
                        </span>
                        <span className="block text-[10px] text-gray-500">Joined {formatDate(m.join_date)}</span>
                      </td>

                      <td className="py-3 px-4">
                        {Number(m.pending_dues) > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-300 border border-red-800">
                            {formatCurrency(m.pending_dues)}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Paid</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-gray-300 font-semibold">
                        {m.total_sessions}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isDeleted ? (
                            <button
                              onClick={() => handleRestore(m.id)}
                              className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition flex items-center text-[11px] font-semibold shadow"
                              title="Restore Member from Trash"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Restore Member
                            </button>
                          ) : (
                            <>
                              {Number(m.pending_dues) > 0 && (
                                <button
                                  onClick={() => {
                                    setDuesModalMember(m);
                                    setDuesAmount(Number(m.pending_dues));
                                  }}
                                  className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 transition flex items-center text-[11px] font-medium"
                                  title="Collect Pending Dues"
                                >
                                  <IndianRupee className="w-3 h-3 mr-0.5" />
                                  Pay Dues
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setRenewModalMember(m);
                                  const defaultPlan = plans[0];
                                  setRenewPlanId(m.plan_id || defaultPlan?.id || "");
                                  setRenewPayment(Number(defaultPlan?.price || 0));
                                }}
                                className="px-2 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition flex items-center text-[11px]"
                                title="Renew Membership Plan"
                              >
                                <RefreshCw className="w-3 h-3 mr-0.5" />
                                Renew
                              </button>

                              <button
                                onClick={() => handleToggleFreeze(m.id)}
                                className={`p-1 rounded transition ${
                                  m.status === "frozen"
                                    ? "bg-sky-900 text-sky-300 hover:bg-sky-800"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                                }`}
                                title={m.status === "frozen" ? "Unfreeze Membership" : "Freeze Membership"}
                              >
                                <Snowflake className="w-3.5 h-3.5" />
                              </button>

                              {/* Soft Delete */}
                              <button
                                onClick={() => handleSoftDelete(m.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition"
                                title="Soft-delete member to archive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENROLL MEMBER MODAL */}
      {isEnrollOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEnrollOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Enroll New Member</h2>
            <p className="text-xs text-gray-400 mb-4">
              Registers member, assigns plan, calculates expiry, and logs initial payment receipt.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleEnroll} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aman Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Father's Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Sharma"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 91491 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="aman@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Address / Mohalla (Sikandrabad)</label>
                <input
                  type="text"
                  placeholder="e.g. Near GT Road, Sikandrabad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Select Membership Plan *</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedPlanId(id);
                    const p = plans.find((item) => item.id === id);
                    if (p) {
                      setInitialPayment(Number(p.price) + Number(p.admission_fee || 0));
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.duration_days} Days — {formatCurrency(p.price)}
                      {p.admission_fee > 0 ? ` (+ ₹${p.admission_fee} fee)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-gray-800/60 border border-gray-700/60 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span>Plan Fee:</span>
                  <span>{formatCurrency(selectedPlan?.price || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Admission Fee:</span>
                  <span>{formatCurrency(selectedPlan?.admission_fee || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-gray-700">
                  <span>Total Payable:</span>
                  <span className="text-emerald-400">{formatCurrency(totalEnrollFee)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Initial Paid Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Pending dues: {formatCurrency(Math.max(0, totalEnrollFee - initialPayment))}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                    <option value="CASH">Cash at Front Desk</option>
                    <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Reference / UTR ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-984210398"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50"
                >
                  {loading ? "Enrolling..." : "Complete Enrollment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT DUES MODAL */}
      {duesModalMember && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDuesModalMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Collect Outstanding Dues</h2>
            <p className="text-xs text-gray-400 mb-4">
              Member: <span className="text-white font-semibold">{duesModalMember.full_name}</span> ({duesModalMember.member_code})
            </p>

            <form onSubmit={handleCollectDuesSubmit} className="space-y-4">
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-center justify-between text-xs">
                <span className="text-red-300">Total Outstanding Balance:</span>
                <span className="text-base font-extrabold text-red-400">
                  {formatCurrency(duesModalMember.pending_dues)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Number(duesModalMember.pending_dues)}
                  value={duesAmount}
                  onChange={(e) => setDuesAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Payment Method</label>
                <select
                  value={duesMethod}
                  onChange={(e) => setDuesMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI (QR / Google Pay / PhonePe)</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Reference / Note</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Cash receipt"
                  value={duesRef}
                  onChange={(e) => setDuesRef(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDuesModalMember(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Record Payment Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENEW MEMBER MODAL */}
      {renewModalMember && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setRenewModalMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Renew Membership</h2>
            <p className="text-xs text-gray-400 mb-4">
              Extends validity for <span className="text-white font-semibold">{renewModalMember.full_name}</span>.
            </p>

            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Renewal Plan *</label>
                <select
                  value={renewPlanId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setRenewPlanId(id);
                    const p = plans.find((item) => item.id === id);
                    if (p) setRenewPayment(Number(p.price));
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.duration_days} Days) — {formatCurrency(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={renewPayment}
                  onChange={(e) => setRenewPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Payment Method</label>
                <select
                  value={renewMethod}
                  onChange={(e) => setRenewMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenewModalMember(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50"
                >
                  {loading ? "Renewing..." : "Confirm Renewal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
