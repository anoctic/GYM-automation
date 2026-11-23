"use client";

import { useState } from "react";
import { updateGymSettings } from "@/actions/gym";
import { createStaffMember, updateStaffMember, deleteStaffMember } from "@/actions/staff";
import { changePassword, enrollMfaTotp, verifyMfaTotp, unenrollMfa } from "@/actions/security";
import { formatDate, formatTime } from "@/lib/utils";
import type { Gym, UpiSlot, GymStaff, StaffRole, AuditLog } from "@/types/database";
import { 
  Settings, 
  CreditCard, 
  Building, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Users,
  Shield,
  Key,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Smartphone,
  Eye,
  History,
  Clock
} from "lucide-react";
import Link from "next/link";

interface SettingsClientProps {
  gym: Gym;
  isDemo: boolean;
  initialStaff: GymStaff[];
  initialAuditLogs: AuditLog[];
}

export function SettingsClient({
  gym,
  isDemo,
  initialStaff,
  initialAuditLogs,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"general" | "staff" | "security" | "export" | "audit">("general");

  // Gym Profile State
  const [name, setName] = useState(gym.name || "");
  const [slug, setSlug] = useState(gym.slug || "fitness-planet-sikandrabad");
  const [tagline, setTagline] = useState(gym.tagline || "");
  const [address, setAddress] = useState(gym.address || "");
  const [pincode, setPincode] = useState(gym.pincode || "");
  const [city, setCity] = useState(gym.city || "");
  const [state, setState] = useState(gym.state || "");
  const [phone, setPhone] = useState(gym.phone || "");
  const [email, setEmail] = useState(gym.email || "");
  const [openingHours, setOpeningHours] = useState(gym.opening_hours || "");

  // Dual UPI Details
  const [upiPrimaryId, setUpiPrimaryId] = useState(gym.upi_primary_id || "");
  const [upiPrimaryName, setUpiPrimaryName] = useState(gym.upi_primary_name || "");
  const [upiSecondaryId, setUpiSecondaryId] = useState(gym.upi_secondary_id || "");
  const [upiSecondaryName, setUpiSecondaryName] = useState(gym.upi_secondary_name || "");
  const [defaultUpiSlot, setDefaultUpiSlot] = useState<UpiSlot>(gym.default_upi_slot || "A");

  // Staff State
  const [staffList, setStaffList] = useState<GymStaff[]>(initialStaff);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("reception");

  // Security & 2FA State
  const [newPassword, setNewPassword] = useState("");
  const [totpData, setTotpData] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [isMfaActive, setIsMfaActive] = useState(false);

  // Reports Export State
  const [dateRange, setDateRange] = useState("all");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 1. Save Gym Profile & UPI Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await updateGymSettings({
      name,
      slug,
      tagline,
      address,
      pincode,
      city,
      state,
      phone,
      email,
      opening_hours: openingHours,
      upi_primary_id: upiPrimaryId,
      upi_primary_name: upiPrimaryName,
      upi_secondary_id: upiSecondaryId,
      upi_secondary_name: upiSecondaryName,
      default_upi_slot: defaultUpiSlot,
    });

    setLoading(false);

    if (res.error) {
      setMessage({ text: res.error, type: "error" });
    } else {
      setMessage({ text: "Gym profile, slug & Dual UPI settings updated!", type: "success" });
    }
  }

  // 2. Add Staff Member
  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await createStaffMember({
      full_name: staffName,
      email: staffEmail,
      phone: staffPhone || undefined,
      role: staffRole,
    });

    setLoading(false);

    if (res.error) {
      alert(res.error);
      return;
    }

    if (res.success && res.staff) {
      setStaffList((prev) => [...prev, res.staff!]);
      setIsStaffModalOpen(false);
      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      setMessage({ text: `Invited ${res.staff.full_name} as ${res.staff.role}!`, type: "success" });
    }
  }

  // 3. Remove Staff
  async function handleRemoveStaff(staffId: string) {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    const res = await deleteStaffMember(staffId);
    if (res.error) {
      alert(res.error);
    } else if (res.success) {
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      setMessage({ text: "Staff member removed.", type: "success" });
    }
  }

  // 4. Change Password
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await changePassword(newPassword);
    setLoading(false);

    if (res.error) {
      setMessage({ text: res.error, type: "error" });
    } else {
      setNewPassword("");
      setMessage({ text: "Account password updated securely!", type: "success" });
    }
  }

  // 5. Enroll 2FA TOTP
  async function handleStartTotpEnroll() {
    setLoading(true);
    const res = await enrollMfaTotp();
    setLoading(false);

    if (res.success && res.factorId) {
      setTotpData({
        factorId: res.factorId,
        qrCode: res.qrCode!,
        secret: res.secret!,
      });
    } else if (res.error) {
      setMessage({ text: res.error, type: "error" });
    }
  }

  // 6. Verify 2FA TOTP Code
  async function handleVerifyTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!totpData) return;
    setLoading(true);
    const res = await verifyMfaTotp(totpData.factorId, totpCode);
    setLoading(false);

    if (res.success) {
      setIsMfaActive(true);
      setTotpData(null);
      setTotpCode("");
      setMessage({ text: "Two-Factor Authentication (TOTP) successfully activated!", type: "success" });
    } else if (res.error) {
      setMessage({ text: res.error, type: "error" });
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Settings className="w-6 h-6 text-emerald-400 mr-2" />
          Settings & Administration
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage gym branding, Dual UPI routing, Staff RBAC, 2FA security, multi-sheet Excel export, and audit trails.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-800 pb-1 overflow-x-auto">
        {[
          { id: "general", label: "Profile & Dual UPI", icon: Building },
          { id: "staff", label: `Staff RBAC (${staffList.length})`, icon: Users },
          { id: "security", label: "Security & 2FA", icon: Shield },
          { id: "export", label: "9-Sheet Excel Export", icon: FileSpreadsheet },
          { id: "audit", label: `Audit Trail (${initialAuditLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setMessage(null);
              }}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gray-900 text-emerald-400 border-t-2 border-emerald-500 shadow"
                  : "text-gray-400 hover:text-white hover:bg-gray-900/50"
              }`}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
              : "bg-red-950/70 border-red-800 text-red-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: General & Dual UPI */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Gym Profile & Slug */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-white flex items-center">
              <Building className="w-4 h-4 text-emerald-400 mr-2" />
              Gym Information & Kiosk Slug
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Gym Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Public Kiosk Slug * (e.g. <span className="font-mono text-emerald-400">anytime-fitness-sikandrab</span>)
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-400 px-2.5 py-2 bg-gray-800/80 border border-r-0 border-gray-700 rounded-l-lg font-mono">
                    /checkin/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-r-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <Link
                    href={`/checkin/${slug || "anytime-fitness-sikandrab"}`}
                    target="_blank"
                    className="ml-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-emerald-400 rounded-lg border border-gray-700 flex items-center shrink-0"
                    title="Open live kiosk check-in"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Open Kiosk
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Dual UPI Account Routing */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center">
                  <CreditCard className="w-4 h-4 text-emerald-400 mr-2" />
                  Dual UPI Account Routing
                </h2>
                <p className="text-xs text-gray-400">
                  Route receipts to Primary (Slot A) or Secondary (Slot B) accounts.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded-lg">
                <span className="text-[11px] text-gray-400 pl-2">Active Slot:</span>
                <button
                  type="button"
                  onClick={() => setDefaultUpiSlot("A")}
                  className={`px-3 py-1 text-xs font-bold rounded ${
                    defaultUpiSlot === "A" ? "bg-emerald-600 text-white shadow" : "text-gray-400"
                  }`}
                >
                  Slot A
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultUpiSlot("B")}
                  className={`px-3 py-1 text-xs font-bold rounded ${
                    defaultUpiSlot === "B" ? "bg-emerald-600 text-white shadow" : "text-gray-400"
                  }`}
                >
                  Slot B
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-xl border ${
                  defaultUpiSlot === "A" ? "bg-emerald-950/20 border-emerald-600" : "bg-gray-800/40 border-gray-800"
                }`}
              >
                <span className="text-xs font-bold text-emerald-400 block mb-2">Slot A: Primary UPI</span>
                <input
                  type="text"
                  placeholder="VPA e.g. anytimefit@icici"
                  value={upiPrimaryId}
                  onChange={(e) => setUpiPrimaryId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white mb-2 font-mono"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={upiPrimaryName}
                  onChange={(e) => setUpiPrimaryName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white"
                />
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  defaultUpiSlot === "B" ? "bg-emerald-950/20 border-emerald-600" : "bg-gray-800/40 border-gray-800"
                }`}
              >
                <span className="text-xs font-bold text-purple-400 block mb-2">Slot B: Secondary UPI</span>
                <input
                  type="text"
                  placeholder="VPA e.g. owner@hdfcbank"
                  value={upiSecondaryId}
                  onChange={(e) => setUpiSecondaryId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white mb-2 font-mono"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={upiSecondaryName}
                  onChange={(e) => setUpiSecondaryName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition shadow"
            >
              {loading ? "Saving..." : "Save Settings & Slug"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Staff Directory & RBAC */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center">
                <Users className="w-5 h-5 text-emerald-400 mr-2" />
                Staff Directory & Role-Based Access Control (RBAC)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Role enforcement: <strong className="text-white">reception</strong> cannot delete members or edit financial UPI settings.
              </p>
            </div>

            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center shadow"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Invite Staff
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-800/80 text-gray-400 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-800/40">
                    <td className="py-3 px-4 font-bold text-white">{st.full_name}</td>
                    <td className="py-3 px-4 text-gray-300">{st.email}</td>
                    <td className="py-3 px-4 text-gray-400">{st.phone || "—"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase ${
                          st.role === "owner"
                            ? "bg-purple-950 text-purple-300 border-purple-800"
                            : st.role === "manager"
                            ? "bg-blue-950 text-blue-300 border-blue-800"
                            : "bg-gray-800 text-gray-300 border-gray-700"
                        }`}
                      >
                        {st.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-semibold text-[11px]">● {st.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {st.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveStaff(st.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                          title="Remove staff"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invite Staff Modal */}
          {isStaffModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
                <h3 className="text-base font-bold text-white mb-2">Invite Staff Member</h3>
                <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-gray-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">RBAC Role *</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="reception">Reception (Check-ins & admissions only, no delete)</option>
                      <option value="manager">Manager (Can manage members & floor, no financial changes)</option>
                      <option value="owner">Owner (Full administrative & financial access)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsStaffModalOpen(false)}
                      className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                    >
                      Invite Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Security & 2FA */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Password */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-white mb-2 flex items-center">
              <Key className="w-4 h-4 text-emerald-400 mr-2" />
              Update Account Password
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Updates your Supabase Auth credentials.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newPassword}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* 2FA TOTP */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-white mb-2 flex items-center">
              <Smartphone className="w-4 h-4 text-emerald-400 mr-2" />
              Two-Factor Authentication (TOTP)
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Enrolls Google Authenticator, Authy, or 1Password via Supabase MFA.
            </p>

            {isMfaActive ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs space-y-2">
                <span className="text-emerald-300 font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  2FA is Active on your account
                </span>
                <p className="text-gray-400 text-[11px]">
                  All owner logins require a 6-digit TOTP code.
                </p>
              </div>
            ) : totpData ? (
              <form onSubmit={handleVerifyTotp} className="space-y-4 text-xs">
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl text-center space-y-2">
                  <p className="text-gray-300">Scan this QR code in your Authenticator app:</p>
                  <div
                    className="inline-block p-2 bg-white rounded-lg"
                    dangerouslySetInnerHTML={{ __html: totpData.qrCode }}
                  />
                  <p className="text-[10px] text-gray-500 font-mono">Secret: {totpData.secret}</p>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Enter 6-digit TOTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="w-full text-center px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-base font-mono font-bold text-white tracking-widest"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading || totpCode.length < 6}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                  >
                    Verify & Activate 2FA
                  </button>
                  <button
                    type="button"
                    onClick={() => setTotpData(null)}
                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-xs text-gray-300 mb-4">
                  Protect your gym's financial records and member data with hardware-backed TOTP security.
                </p>
                <button
                  type="button"
                  onClick={handleStartTotpEnroll}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center shadow"
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  Setup 2FA Authenticator
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: 9-Sheet Excel Export */}
      {activeTab === "export" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 mr-2" />
              Multi-Sheet Master Excel Export (.xlsx)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Exports a comprehensive 9-sheet workbook including Executive Summary, Members Master, Revenue, Attendance, Floor Live, Admissions, Leads, Staff, and Audit Trail.
            </p>
          </div>

          <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/60 text-xs space-y-3">
            <span className="font-bold text-gray-200 block">Select Date Range Filter:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "7d", label: "Last 7 Days" },
                { id: "this_month", label: "This Month" },
                { id: "last_month", label: "Last Month" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDateRange(r.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                    dateRange === r.id
                      ? "bg-emerald-600 text-white border-emerald-500 shadow"
                      : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-gray-400 space-y-1">
              <p>🛡️ <strong>Formula-Injection Protected</strong>: Escapes all spreadsheet formula triggers (`=`, `+`, `-`, `@`) to protect accountants opening in Microsoft Excel.</p>
              <p>📊 <strong>9 Full Worksheets</strong>: Generates separate styled worksheets for each operational pillar.</p>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`/api/reports/xlsx?range=${dateRange}`}
              download
              className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition"
            >
              <Download className="w-4 h-4 mr-2" />
              Download 9-Sheet Master Workbook ({dateRange.toUpperCase()})
            </a>
          </div>
        </div>
      )}

      {/* TAB 5: Audit Trail */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center">
              <History className="w-4 h-4 text-emerald-400 mr-2" />
              Immutable Audit Trail
            </h2>
            <p className="text-xs text-gray-400">
              Tamper-proof log of member mutations, financial transactions, staff changes, and system events.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-800/80 text-gray-400 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Performed By</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {initialAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/40">
                    <td className="py-2.5 px-4">
                      <span className="font-mono font-bold text-white">{log.action}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-300">{log.performed_by_email || "system"}</td>
                    <td className="py-2.5 px-4 text-gray-400 font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-400 text-[11px]">
                      {formatDate(log.created_at)} {formatTime(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
