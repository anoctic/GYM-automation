"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, generateMemberCode } from "@/lib/utils";
import {
  enrollMember,
  renewMember,
  collectDues,
  toggleMemberFreeze,
  softDeleteMember,
  restoreMember,
} from "@/actions/members";
import { checkInMember } from "@/actions/attendance";
import { SignaturePad } from "@/components/SignaturePad";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import type { Member, MembershipPlan, PaymentMethod, MemberStatus } from "@/types/database";
import {
  Search,
  UserPlus,
  Activity,
  CreditCard,
  RefreshCw,
  Snowflake,
  Trash2,
  RotateCcw,
  MessageCircle,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Eye,
  Camera,
  AlertTriangle,
  Clock,
  ShieldAlert,
  UserCheck,
  Check,
  Filter,
} from "lucide-react";

interface MembersClientProps {
  initialMembers: Member[];
  plans: MembershipPlan[];
  initialFilter?: string;
  initialOpenEnroll?: boolean;
}

export function MembersClient({
  initialMembers,
  plans,
  initialFilter,
  initialOpenEnroll = false,
}: MembersClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter || "all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Modal States
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(initialOpenEnroll);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isDuesModalOpen, setIsDuesModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeMember, setActiveMember] = useState<Member | null>(null);

  // Async States
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // ==========================================
  // ENROLL FORM STATE (Printed Replica Form)
  // ==========================================
  const nextMemberCode = useMemo(() => {
    return generateMemberCode(members.length, "FP");
  }, [members.length]);

  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("Sikandrabad");
  const [pincode, setPincode] = useState("203205");
  const [aadharNumber, setAadharNumber] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [referenceId, setReferenceId] = useState("");

  const [hasMedical, setHasMedical] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState("");
  const [takingMeds, setTakingMeds] = useState(false);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [agreedTerms, setAgreedTerms] = useState(true);

  // Auto-calculate Age when DOB changes
  function handleDobChange(val: string) {
    setDob(val);
    if (!val) {
      setAge("");
      return;
    }
    const birthDate = new Date(val);
    const diffYears = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    if (diffYears > 0 && diffYears < 120) {
      setAge(diffYears);
    }
  }

  // Handle Photo File Select
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Selected Plan Calculations
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const totalEnrollFee = selectedPlan
    ? Number(selectedPlan.price) + Number(selectedPlan.admission_fee || 0)
    : 0;
  const calculatedPendingDues = Math.max(0, totalEnrollFee - (initialPayment || 0));

  // ==========================================
  // RENEW & COLLECT STATE
  // ==========================================
  const [renewPlanId, setRenewPlanId] = useState(plans[0]?.id || "");
  const [renewAmount, setRenewAmount] = useState<number>(0);
  const [renewMethod, setRenewMethod] = useState<PaymentMethod>("UPI");

  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>("UPI");

  const inactive3dCount = useMemo(() => {
    return members.filter((m) => !m.deleted_at && m.is_inactive_3d).length;
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Trash filter
      if (showArchived && !m.deleted_at) return false;
      if (!showArchived && m.deleted_at) return false;

      // Status filter
      if (statusFilter === "has_dues") {
        if (Number(m.pending_dues) <= 0) return false;
      } else if (statusFilter === "inactive") {
        if (!m.is_inactive_3d) return false;
      } else if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      // Plan filter
      if (planFilter !== "all" && m.plan_id !== planFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        return (
          m.full_name.toLowerCase().includes(term) ||
          m.phone.toLowerCase().includes(term) ||
          m.member_code.toLowerCase().includes(term) ||
          (m.address && m.address.toLowerCase().includes(term))
        );
      }

      return true;
    });
  }, [members, showArchived, statusFilter, planFilter, searchTerm]);

  // ==========================================
  // SERVER ACTION HANDLERS
  // ==========================================

  // 1. Submit Member Enrollment
  async function handleEnrollSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedTerms) {
      setModalError("Please accept the gym rules and terms to proceed.");
      return;
    }
    setLoading(true);
    setModalError(null);

    const res = await enrollMember({
      full_name: fullName,
      father_name: fatherName || undefined,
      dob: dob || undefined,
      age: typeof age === "number" ? age : undefined,
      gender,
      phone,
      email: email || undefined,
      address,
      pincode,
      aadhar_number: aadharNumber || undefined,
      photo_url: photoPreview || undefined,
      signature_url: signatureData || undefined,
      plan_id: selectedPlanId,
      join_date: joinDate,
      initial_payment_amount: initialPayment,
      payment_method: paymentMethod,
      reference_id: referenceId || undefined,
      has_medical_condition: hasMedical,
      medical_details: medicalDetails || undefined,
      taking_medication: takingMeds,
      emergency_contact_name: emergencyName || undefined,
      emergency_contact_relation: emergencyRelation || undefined,
      emergency_contact_phone: emergencyPhone || undefined,
    });

    setLoading(false);

    if (res.error) {
      setModalError(res.error);
      return;
    }

    if (res.member) {
      setMembers((prev) => [
        { ...res.member!, membership_plans: selectedPlan },
        ...prev,
      ]);
      setIsEnrollModalOpen(false);
      resetEnrollForm();
      showToast(`Member enrolled successfully with code ${res.member.member_code}!`);
    }
  }

  function resetEnrollForm() {
    setFullName("");
    setFatherName("");
    setDob("");
    setAge("");
    setPhone("");
    setEmail("");
    setAddress("Sikandrabad");
    setAadharNumber("");
    setPhotoPreview(null);
    setSignatureData(null);
    setInitialPayment(0);
    setReferenceId("");
    setHasMedical(false);
    setMedicalDetails("");
    setTakingMeds(false);
    setEmergencyName("");
    setEmergencyPhone("");
  }

  // 2. Submit Membership Renewal
  async function handleRenewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMember) return;
    setLoading(true);
    const res = await renewMember({
      member_id: activeMember.id,
      plan_id: renewPlanId,
      payment_amount: renewAmount,
      payment_method: renewMethod,
    });
    setLoading(false);
    if (res.success && res.member) {
      const pObj = plans.find((p) => p.id === renewPlanId);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === activeMember.id ? { ...res.member!, membership_plans: pObj } : m
        )
      );
      setIsRenewModalOpen(false);
      showToast(`Membership renewed for ${activeMember.full_name}!`);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // 3. Submit Collect Dues
  async function handleDuesSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMember || collectAmount <= 0) return;
    setLoading(true);
    const res = await collectDues({
      member_id: activeMember.id,
      amount: collectAmount,
      payment_method: collectMethod,
    });
    setLoading(false);
    if (res.success && res.member) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === activeMember.id ? { ...m, pending_dues: res.member!.pending_dues } : m
        )
      );
      setIsDuesModalOpen(false);
      showToast(`Collected ${formatCurrency(collectAmount)} for ${activeMember.full_name}!`);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // 4. Quick Check-In from directory
  async function handleQuickCheckIn(member: Member) {
    const res = await checkInMember(member.id, "FRONT_DESK");
    if (res.success && res.session) {
      showToast(`${member.full_name} (${member.member_code}) checked in to floor!`);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // 5. Toggle Freeze
  async function handleToggleFreeze(member: Member) {
    const res = await toggleMemberFreeze(member.id);
    if (res.success && res.member) {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: res.member!.status } : m))
      );
      showToast(`Status updated to ${res.member.status.toUpperCase()}!`);
    }
  }

  // 6. Soft Delete
  async function handleSoftDelete(member: Member) {
    if (!confirm(`Are you sure you want to move ${member.full_name} to trash?`)) return;
    const res = await softDeleteMember(member.id);
    if (res.success) {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      showToast(`${member.full_name} moved to trash.`);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // 7. Restore from Trash
  async function handleRestore(member: Member) {
    const res = await restoreMember(member.id);
    if (res.success) {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      showToast(`${member.full_name} restored to active directory!`);
    } else if (res.error) {
      alert(res.error);
    }
  }

  // 8. Export to CSV
  function exportCSV() {
    const headers = [
      "Member Code",
      "Full Name",
      "Phone",
      "Email",
      "Plan",
      "Status",
      "Join Date",
      "Expiry Date",
      "Pending Dues",
      "Total Sessions",
      "Address",
    ];
    const rows = filteredMembers.map((m) => [
      `"${m.member_code}"`,
      `"${m.full_name}"`,
      `"${m.phone}"`,
      `"${m.email || ""}"`,
      `"${m.membership_plans?.name || ""}"`,
      `"${m.status}"`,
      `"${m.join_date}"`,
      `"${m.expiry_date}"`,
      m.pending_dues,
      m.total_sessions,
      `"${m.address || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fitness_Planet_Members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function showToast(msg: string) {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  }

  function getWhatsAppReminder(m: Member) {
    const cleanPhone = m.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const isAbsentReminder = m.is_inactive_3d && statusFilter === "inactive";
    const text = encodeURIComponent(
      isAbsentReminder
        ? `Namaste ${m.full_name} ji! 💪\nFitness Planet Unisex Gym, Sikandrabad se reminder:\nAapne pichle ${m.days_since_checkin || 3} din se gym check-in nahi kiya hai. Apna workout routine continue rakhne ke liye aaj zaroor aayein! 🔥`
        : `Namaste ${m.full_name} ji! 🙏\nFitness Planet Unisex Gym, Sikandrabad se reminder:\nAapka membership (${m.membership_plans?.name || "Gym Plan"}) expiry date: ${formatDate(m.expiry_date)}.\nPending Dues: ₹${m.pending_dues}.\nKripya gym desk par aakar apna membership renew karwayein. Thank you! 💪`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-main flex items-center gap-2">
            <span>Members Directory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono-code font-bold">
              {filteredMembers.length}
            </span>
          </h1>
          <p className="text-xs text-muted-theme mt-1">
            Complete member records, digital admission entry forms, renewal tracking, and fee collection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export Button */}
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-hover text-main border border-theme transition flex items-center shadow-xs"
            title="Export Members to CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            CSV Export
          </button>

          {/* Trash Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center border ${
              showArchived
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-surface text-muted-theme border-theme hover:text-main"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            {showArchived ? "Viewing Trash" : "Trash"}
          </button>

          {/* Enroll New Member Button */}
          <button
            onClick={() => {
              if (selectedPlan) {
                setInitialPayment(totalEnrollFee);
              }
              setIsEnrollModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center shadow-md shadow-emerald-950/40"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            + Enroll Member
          </button>
        </div>
      </div>

      {/* Filters: Search Bar, Status Pills & Plan Dropdown */}
      <div className="p-4 rounded-2xl bg-surface border border-theme space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-dim-theme" />
            <input
              type="text"
              placeholder="Search by name, phone, code (e.g. FP-93)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main placeholder-dim-theme focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Plan Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-theme font-medium whitespace-nowrap">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 bg-input-field border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">All Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-0.5">
          {[
            { id: "all", label: "All Members" },
            { id: "active", label: "Active" },
            { id: "inactive", label: `Inactive (3+ Days) • ${inactive3dCount}` },
            { id: "trial", label: "Trial" },
            { id: "expired", label: "Expired" },
            { id: "has_dues", label: "Has Pending Dues ⚠️" },
            { id: "frozen", label: "Frozen" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? tab.id === "inactive"
                    ? "bg-amber-600 text-white font-bold shadow-xs"
                    : "bg-[#111214] dark:bg-[#C6F459] text-white dark:text-[#111214] font-bold shadow-xs"
                  : "bg-input-field text-muted-theme hover:text-main"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table (Mobile Responsive Cards via .responsive-table) */}
      <div className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs responsive-table">
            <thead className="bg-app border-b border-subtle-theme text-[11px] font-bold text-muted-theme uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Plan &amp; Validity</th>
                <th className="py-3 px-4">Dues &amp; Sessions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle-theme">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-theme">
                    No members match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="bg-surface-hover transition-colors">
                    {/* Member Info */}
                    <td className="py-3.5 px-4" data-label="Member">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0 overflow-hidden">
                          {m.photo_url ? (
                            <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                          ) : (
                            m.full_name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-main truncate">{m.full_name}</span>
                            <span className="font-mono-code text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                              {m.member_code}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-theme truncate">
                            {m.phone} {m.father_name && `• S/o ${m.father_name}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Plan & Validity */}
                    <td className="py-3.5 px-4" data-label="Plan & Validity">
                      <p className="font-semibold text-main">{m.membership_plans?.name || "Standard Plan"}</p>
                      <p className="text-[11px] text-muted-theme">
                        Valid till: <strong className="text-main">{formatDate(m.expiry_date)}</strong>
                      </p>
                    </td>

                    {/* Dues & Sessions */}
                    <td className="py-3.5 px-4" data-label="Dues & Sessions">
                      <div className="space-y-0.5">
                        {Number(m.pending_dues) > 0 ? (
                          <span className="font-mono-code font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
                            Due: {formatCurrency(m.pending_dues)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
                            <Check className="w-3 h-3 mr-1" /> Paid in Full
                          </span>
                        )}
                        <p className="text-[11px] text-dim-theme">
                          Sessions: <strong className="text-muted-theme">{m.total_sessions}</strong>
                          {m.last_check_in_at && (
                            <span className="ml-1.5">• Last: {formatDate(m.last_check_in_at)}</span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4" data-label="Status">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            m.status === "active"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : m.status === "expired"
                              ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
                              : m.status === "frozen"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {m.status}
                        </span>
                        {m.is_inactive_3d && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                            title="No check-in for 3+ days"
                          >
                            Absent {m.days_since_checkin}d
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right" data-label="Actions">
                      <div className="flex items-center justify-end space-x-1.5 flex-wrap gap-y-1">
                        {!showArchived ? (
                          <>
                            {/* Check In */}
                            <button
                              onClick={() => handleQuickCheckIn(m)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
                              title="Floor Check In"
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </button>

                            {/* Collect Dues */}
                            {Number(m.pending_dues) > 0 && (
                              <button
                                onClick={() => {
                                  setActiveMember(m);
                                  setCollectAmount(Number(m.pending_dues));
                                  setIsDuesModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 border border-amber-500/20"
                                title="Collect Fee"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Renew */}
                            <button
                              onClick={() => {
                                setActiveMember(m);
                                setRenewPlanId(m.plan_id || plans[0]?.id || "");
                                const pl = plans.find((p) => p.id === m.plan_id) || plans[0];
                                setRenewAmount(pl ? Number(pl.price) : 0);
                                setIsRenewModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 border border-blue-500/20"
                              title="Renew Plan"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Reminder */}
                            <a
                              href={getWhatsAppReminder(m)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 border border-green-500/20"
                              title="Send WhatsApp Message"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {/* Freeze/Unfreeze */}
                            <button
                              onClick={() => handleToggleFreeze(m)}
                              className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 border border-purple-500/20"
                              title={m.status === "frozen" ? "Unfreeze Member" : "Freeze Membership"}
                            >
                              <Snowflake className="w-3.5 h-3.5" />
                            </button>

                            {/* Details Modal */}
                            <button
                              onClick={() => {
                                setActiveMember(m);
                                setIsDetailsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-muted-theme hover:text-main hover:bg-surface border border-theme"
                              title="View Full Profile & Signature"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Soft Delete */}
                            <button
                              onClick={() => handleSoftDelete(m)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(m)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PRINTED ENTRY FORM REPLICA (ENROLL NEW MEMBER)                   */}
      {/* ========================================================================= */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border-2 border-theme rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto space-y-5">
            {/* Modal Close Button */}
            <button
              onClick={() => setIsEnrollModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main p-1 rounded-lg hover:bg-app"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Gym Crest & Form Title */}
            <div className="text-center pb-4 border-b border-theme space-y-2">
              <div className="flex justify-center">
                <FitnessPlanetLogo size="sm" showTagline={false} />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-main tracking-tight uppercase">
                Fitness Planet Unisex Gym
              </h2>
              <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">
                Official Membership Admission Form • Sikandrabad
              </p>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-5 text-xs">
              {/* Top Row: Auto Member Code + Joining Date + Photo Uploader */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-xl bg-app border border-subtle-theme items-center">
                <div>
                  <label className="block text-[11px] font-bold text-muted-theme uppercase mb-1">
                    Membership No.
                  </label>
                  <span className="font-mono-code font-black text-emerald-400 text-base bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-800 block text-center">
                    {nextMemberCode}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-theme uppercase mb-1">
                    Date of Joining *
                  </label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-input-field border border-theme rounded-lg text-main text-xs focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Passport Size Photo Uploader */}
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-16 rounded-lg border-2 border-dashed border-theme bg-input-field flex items-center justify-center overflow-hidden shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-dim-theme" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-surface border border-theme text-main font-semibold text-[11px] hover:bg-surface-hover inline-block">
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] text-dim-theme block mt-1">Passport size</span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: Personal Details */}
              <div className="space-y-3">
                <span className="font-bold text-main uppercase tracking-wider text-[11px] block border-b border-subtle-theme pb-1">
                  1. Applicant Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aman Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Father's / Husband's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Age (Years)</label>
                    <input
                      type="number"
                      placeholder="Auto / manual"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 91491 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Email ID</label>
                    <input
                      type="email"
                      placeholder="aman@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Aadhar Card Number</label>
                    <input
                      type="text"
                      placeholder="12-digit UID"
                      value={aadharNumber}
                      onChange={(e) => setAadharNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-muted-theme font-medium mb-1">Residential Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mohalla / Street, Sikandrabad"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500 font-mono-code"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Plan Selection & Fee Calculator */}
              <div className="space-y-3 p-4 rounded-xl bg-app border border-subtle-theme">
                <span className="font-bold text-main uppercase tracking-wider text-[11px] block border-b border-subtle-theme pb-1">
                  2. Membership Plan &amp; Payment Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Select Package *</label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.price)} ({p.duration_days} Days)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Payment Mode *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="UPI">UPI (Paytm / Google Pay / PhonePe)</option>
                      <option value="CASH">Cash at Reception</option>
                      <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                    </select>
                  </div>
                </div>

                {/* Live Fee vs Dues Calculation */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
                  <div className="p-2.5 rounded-lg bg-surface border border-theme">
                    <span className="text-[10px] text-muted-theme block">Total Fee</span>
                    <span className="font-mono-code font-bold text-main text-sm">
                      {formatCurrency(totalEnrollFee)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 block font-semibold">Initial Payment (₹)</span>
                    <input
                      type="number"
                      min={0}
                      value={initialPayment || ""}
                      onChange={(e) => setInitialPayment(Number(e.target.value))}
                      className="w-full text-center bg-transparent font-mono-code font-bold text-emerald-400 text-sm focus:outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 block font-semibold">Balance Dues (₹)</span>
                    <span className="font-mono-code font-black text-amber-400 text-sm">
                      {formatCurrency(calculatedPendingDues)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Health Declaration & Emergency Contact */}
              <div className="space-y-3">
                <span className="font-bold text-main uppercase tracking-wider text-[11px] block border-b border-subtle-theme pb-1">
                  3. Health &amp; Emergency Declaration
                </span>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMedical}
                      onChange={(e) => setHasMedical(e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span className="text-muted-theme">Any past medical history / heart condition / surgery?</span>
                  </label>

                  {hasMedical && (
                    <input
                      type="text"
                      placeholder="Please specify medical details..."
                      value={medicalDetails}
                      onChange={(e) => setMedicalDetails(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main text-xs focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      placeholder="Relative / Guardian"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Relationship</label>
                    <input
                      type="text"
                      placeholder="Father / Brother / Friend"
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme font-medium mb-1">Emergency Mobile *</label>
                    <input
                      type="tel"
                      placeholder="+91 91491 00000"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Terms & Conditions + HTML5 Signature Pad */}
              <div className="space-y-3 p-4 rounded-xl bg-app border border-subtle-theme">
                <span className="font-bold text-main uppercase tracking-wider text-[11px] block border-b border-subtle-theme pb-1">
                  4. Rules, Terms &amp; Digital Signature
                </span>

                <ul className="text-[11px] text-muted-theme space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Fees paid is strictly non-refundable and non-transferable under any condition.</li>
                  <li>Members must carry clean indoor workout shoes and a towel on the gym floor.</li>
                  <li>Re-rack all weights and dumbbells immediately after your workout sets.</li>
                  <li>Fitness Planet is not responsible for loss of cash, mobile, or personal items.</li>
                  <li>I certify that I am medically fit for weight training and cardio exercise.</li>
                </ul>

                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="rounded accent-emerald-500 w-4 h-4"
                  />
                  <span className="font-bold text-main text-xs">
                    I have read, understood, and accept all the terms and rules above.
                  </span>
                </label>

                {/* HTML5 Touch/Mouse Signature Pad */}
                <div className="pt-2">
                  <SignaturePad onSignatureChange={setSignatureData} />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/40"
                >
                  {loading ? "Registering & Provisioning Member..." : "Complete Admission & Enroll Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RENEW MEMBERSHIP                                                 */}
      {/* ========================================================================= */}
      {isRenewModalOpen && activeMember && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsRenewModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-main">Renew Plan for {activeMember.full_name}</h3>
            <p className="text-xs text-muted-theme">
              Extends validity from previous expiry ({formatDate(activeMember.expiry_date)}) and updates status to active.
            </p>

            <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-theme font-medium mb-1">Select Renewal Package *</label>
                <select
                  value={renewPlanId}
                  onChange={(e) => {
                    setRenewPlanId(e.target.value);
                    const p = plans.find((pl) => pl.id === e.target.value);
                    if (p) setRenewAmount(Number(p.price));
                  }}
                  className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-bold"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price)} / {p.duration_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-theme font-medium mb-1">Renewal Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={renewAmount || ""}
                    onChange={(e) => setRenewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted-theme font-medium mb-1">Payment Mode *</label>
                  <select
                    value={renewMethod}
                    onChange={(e) => setRenewMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-semibold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md"
              >
                {loading ? "Renewing..." : `Confirm Renewal & Receipt`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COLLECT DUES                                                     */}
      {/* ========================================================================= */}
      {isDuesModalOpen && activeMember && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsDuesModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-main">Collect Dues for {activeMember.full_name}</h3>
            <p className="text-xs text-muted-theme">
              Outstanding Balance: <strong className="text-amber-400 font-bold">{formatCurrency(activeMember.pending_dues)}</strong>
            </p>

            <form onSubmit={handleDuesSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-theme font-medium mb-1">Amount to Collect (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={Number(activeMember.pending_dues)}
                    value={collectAmount || ""}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted-theme font-medium mb-1">Payment Method *</label>
                  <select
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-input-field border border-theme rounded-xl text-main font-semibold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || collectAmount <= 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md"
              >
                {loading ? "Recording..." : `Record Payment of ${formatCurrency(collectAmount)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FULL MEMBER DETAILS & SIGNATURE VIEWER                           */}
      {/* ========================================================================= */}
      {isDetailsModalOpen && activeMember && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-3 border-b border-theme">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm overflow-hidden shrink-0">
                {activeMember.photo_url ? (
                  <img src={activeMember.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  activeMember.full_name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-main">{activeMember.full_name}</h3>
                <span className="font-mono-code text-xs text-emerald-400 font-bold">
                  {activeMember.member_code} • {activeMember.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-app border border-subtle-theme">
                <div>
                  <span className="text-dim-theme block">Phone</span>
                  <span className="font-semibold text-main">{activeMember.phone}</span>
                </div>
                <div>
                  <span className="text-dim-theme block">Father's Name</span>
                  <span className="font-semibold text-main">{activeMember.father_name || "—"}</span>
                </div>
                <div>
                  <span className="text-dim-theme block">Plan</span>
                  <span className="font-semibold text-main">{activeMember.membership_plans?.name || "—"}</span>
                </div>
                <div>
                  <span className="text-dim-theme block">Expiry Date</span>
                  <span className="font-semibold text-main">{formatDate(activeMember.expiry_date)}</span>
                </div>
                <div>
                  <span className="text-dim-theme block">Pending Dues</span>
                  <span className="font-bold text-amber-400">{formatCurrency(activeMember.pending_dues)}</span>
                </div>
                <div>
                  <span className="text-dim-theme block">Total Floor Sessions</span>
                  <span className="font-bold text-main">{activeMember.total_sessions}</span>
                </div>
              </div>

              {activeMember.address && (
                <div className="p-3 rounded-xl bg-app border border-subtle-theme">
                  <span className="text-dim-theme block">Address</span>
                  <span className="font-semibold text-main">
                    {activeMember.address}, Sikandrabad ({activeMember.pincode || "203205"})
                  </span>
                </div>
              )}

              {activeMember.signature_url && (
                <div className="p-3 rounded-xl bg-app border border-subtle-theme space-y-1">
                  <span className="text-dim-theme block">Digital Signature</span>
                  <div className="bg-surface p-2 rounded-lg border border-theme flex justify-center">
                    <img src={activeMember.signature_url} alt="Signature" className="max-h-20" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
