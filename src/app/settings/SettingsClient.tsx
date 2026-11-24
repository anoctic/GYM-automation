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
  Clock,
  Sparkles,
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
  const [name, setName] = useState(gym.name || "Fitness Planet Unisex Gym");
  const [slug, setSlug] = useState(gym.slug || "fitness-planet-sikandrabad");
  const [tagline, setTagline] = useState(gym.tagline || "Strong Is Universal • Gym & Health Club");
  const [address, setAddress] = useState(gym.address || "Sikandrabad");
  const [pincode, setPincode] = useState(gym.pincode || "203205");
  const [city, setCity] = useState(gym.city || "Sikandrabad");
  const [state, setState] = useState(gym.state || "Uttar Pradesh");
  const [phone, setPhone] = useState(gym.phone || "+91 9149183060");
  const [email, setEmail] = useState(gym.email || "kapilrajput.fitnessplanet@gmail.com");
  const [openingHours, setOpeningHours] = useState(
    gym.opening_hours || "Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM"
  );

  // Dual UPI Details
  const [upiPrimaryId, setUpiPrimaryId] = useState(gym.upi_primary_id || "9149183060@paytm");
  const [upiPrimaryName, setUpiPrimaryName] = useState(gym.upi_primary_name || "Fitness Planet Unisex Gym");
  const [upiSecondaryId, setUpiSecondaryId] = useState(gym.upi_secondary_id || "kapilrajput@oksbi");
  const [upiSecondaryName, setUpiSecondaryName] = useState(gym.upi_secondary_name || "Kapil Rajput");
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
      setMessage({ text: "Fitness Planet profile, kiosk slug & Dual UPI settings updated!", type: "success" });
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
        <h1 className="text-2xl font-bold text-main flex items-center">
          <Settings className="w-6 h-6 text-emerald-500 mr-2" />
          Settings & Gym Administration
        </h1>
        <p className="text-sm text-muted-theme mt-1">
          Manage Fitness Planet branding, Dual UPI routing, Staff RBAC, 2FA security, multi-sheet Excel export, and audit trails.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-theme pb-1 overflow-x-auto">
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
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-surface text-emerald-500 border-t-2 border-emerald-500 shadow-xs"
                  : "text-muted-theme hover:text-main hover:bg-surface/50"
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
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-muted-theme hover:text-main">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: General & Dual UPI */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Gym Profile & Slug */}
          <div className="bg-surface border border-theme rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-main flex items-center">
              <Building className="w-4 h-4 text-emerald-500 mr-2" />
              Fitness Planet Information & Kiosk Slug
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Gym Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">
                  Public Kiosk Slug * (e.g. <span className="font-mono text-emerald-500">fitness-planet-sikandrabad</span>)
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-muted-theme px-2.5 py-2 bg-app border border-r-0 border-theme rounded-l-xl font-mono">
                    /checkin/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-app border border-theme rounded-r-xl text-xs text-main focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <Link
                    href={`/checkin/${slug || "fitness-planet-sikandrabad"}`}
                    target="_blank"
                    className="ml-2 px-3 py-2 bg-app hover:bg-surface text-xs font-bold text-emerald-500 rounded-xl border border-theme flex items-center shrink-0"
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
                <label className="block text-xs font-semibold text-main mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-main mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-main mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dual UPI Account Routing */}
          <div className="bg-surface border border-theme rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-main flex items-center">
                  <CreditCard className="w-4 h-4 text-emerald-500 mr-2" />
                  Dual UPI Account Routing
                </h2>
                <p className="text-xs text-muted-theme">
                  Route receipts to Primary (Slot A) or Secondary (Slot B) accounts seamlessly.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-app p-1 rounded-xl border border-theme">
                <span className="text-[11px] text-muted-theme pl-2">Active Slot:</span>
                <button
                  type="button"
                  onClick={() => setDefaultUpiSlot("A")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    defaultUpiSlot === "A" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-theme hover:text-main"
                  }`}
                >
                  Slot A
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultUpiSlot("B")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    defaultUpiSlot === "B" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-theme hover:text-main"
                  }`}
                >
                  Slot B
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-xl border transition ${
                  defaultUpiSlot === "A"
                    ? "bg-emerald-500/10 border-emerald-500/40"
                    : "bg-app border-theme"
                }`}
              >
                <span className="text-xs font-bold text-emerald-500 block mb-2">Slot A: Primary Gym UPI</span>
                <input
                  type="text"
                  placeholder="VPA e.g. 9149183060@paytm"
                  value={upiPrimaryId}
                  onChange={(e) => setUpiPrimaryId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-theme rounded-xl text-xs text-main mb-2 font-mono"
                />
                <input
                  type="text"
                  placeholder="Display Name e.g. Fitness Planet Unisex Gym"
                  value={upiPrimaryName}
                  onChange={(e) => setUpiPrimaryName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-theme rounded-xl text-xs text-main"
                />
              </div>

              <div
                className={`p-4 rounded-xl border transition ${
                  defaultUpiSlot === "B"
                    ? "bg-emerald-500/10 border-emerald-500/40"
                    : "bg-app border-theme"
                }`}
              >
                <span className="text-xs font-bold text-amber-500 block mb-2">Slot B: Secondary / Owner UPI</span>
                <input
                  type="text"
                  placeholder="VPA e.g. kapilrajput@oksbi"
                  value={upiSecondaryId}
                  onChange={(e) => setUpiSecondaryId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-theme rounded-xl text-xs text-main mb-2 font-mono"
                />
                <input
                  type="text"
                  placeholder="Display Name e.g. Kapil Rajput"
                  value={upiSecondaryName}
                  onChange={(e) => setUpiSecondaryName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-theme rounded-xl text-xs text-main"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/40"
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
              <h2 className="text-lg font-bold text-main flex items-center">
                <Users className="w-5 h-5 text-emerald-500 mr-2" />
                Staff Directory & Role-Based Access Control (RBAC)
              </h2>
              <p className="text-xs text-muted-theme mt-0.5">
                Role enforcement: <strong className="text-main">reception</strong> cannot delete members or edit financial UPI settings.
              </p>
            </div>

            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Invite Staff
            </button>
          </div>

          <div className="bg-surface border border-theme rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs responsive-table">
              <thead className="bg-app text-muted-theme font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-app/50 transition">
                    <td data-label="Staff Name" className="py-3.5 px-4 font-bold text-main">{st.full_name}</td>
                    <td data-label="Email" className="py-3.5 px-4 text-muted-theme">{st.email}</td>
                    <td data-label="Phone" className="py-3.5 px-4 text-muted-theme font-mono">{st.phone || "—"}</td>
                    <td data-label="Role" className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                          st.role === "owner"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : st.role === "manager"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-surface text-muted-theme border-theme"
                        }`}
                      >
                        {st.role}
                      </span>
                    </td>
                    <td data-label="Status" className="py-3.5 px-4">
                      <span className="text-emerald-500 font-semibold text-[11px]">● {st.status}</span>
                    </td>
                    <td data-label="Actions" className="py-3.5 px-4 text-right">
                      {st.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveStaff(st.id)}
                          className="text-muted-theme hover:text-rose-400 p-1"
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
              <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                <h3 className="text-base font-bold text-main mb-2">Invite Staff Member</h3>
                <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-main mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-main text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-main mb-1 font-semibold">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-main text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-main mb-1 font-semibold">Phone</label>
                    <input
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-main text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-main mb-1 font-semibold">RBAC Role *</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                      className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-main text-xs focus:outline-none focus:border-emerald-500"
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
                      className="px-3 py-1.5 bg-surface border border-theme text-muted-theme hover:text-main rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs"
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
          <div className="bg-surface border border-theme rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-main mb-2 flex items-center">
              <Key className="w-4 h-4 text-emerald-500 mr-2" />
              Update Account Password
            </h2>
            <p className="text-xs text-muted-theme mb-4">
              Updates your Supabase Auth credentials for Kapil Rajput.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-main mb-1 font-semibold">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newPassword}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* 2FA TOTP */}
          <div className="bg-surface border border-theme rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-main mb-2 flex items-center">
              <Smartphone className="w-4 h-4 text-emerald-500 mr-2" />
              Two-Factor Authentication (TOTP)
            </h2>
            <p className="text-xs text-muted-theme mb-4">
              Enrolls Google Authenticator, Authy, or 1Password via Supabase MFA.
            </p>

            {isMfaActive ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-2">
                <span className="text-emerald-400 font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  2FA is Active on your account
                </span>
                <p className="text-muted-theme text-[11px]">
                  All owner logins require a 6-digit TOTP code.
                </p>
              </div>
            ) : totpData ? (
              <form onSubmit={handleVerifyTotp} className="space-y-4 text-xs">
                <div className="p-4 bg-app border border-theme rounded-xl text-center space-y-2">
                  <p className="text-muted-theme">Scan this QR code in your Authenticator app:</p>
                  <div
                    className="inline-block p-2 bg-white rounded-xl shadow-xs"
                    dangerouslySetInnerHTML={{ __html: totpData.qrCode }}
                  />
                  <p className="text-[10px] text-muted-theme font-mono">Secret: {totpData.secret}</p>
                </div>

                <div>
                  <label className="block text-main mb-1 font-semibold">Enter 6-digit TOTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="w-full text-center px-3 py-2 bg-app border border-theme rounded-xl text-base font-mono font-bold text-main tracking-widest focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading || totpCode.length < 6}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs text-xs"
                  >
                    Verify & Activate 2FA
                  </button>
                  <button
                    type="button"
                    onClick={() => setTotpData(null)}
                    className="px-3 py-2 bg-surface border border-theme text-muted-theme hover:text-main rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-xs text-muted-theme mb-4">
                  Protect your gym's financial records and member data with hardware-backed TOTP security.
                </p>
                <button
                  type="button"
                  onClick={handleStartTotpEnroll}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center shadow-xs"
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
        <div className="bg-surface border border-theme rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-main flex items-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500 mr-2" />
              Multi-Sheet Master Excel Export (.xlsx)
            </h2>
            <p className="text-xs text-muted-theme mt-1">
              Exports a comprehensive 9-sheet workbook including Executive Summary, Members Master, Revenue, Attendance, Floor Live, Admissions, Leads, Staff, and Audit Trail.
            </p>
          </div>

          <div className="p-4 bg-app rounded-xl border border-theme text-xs space-y-3">
            <span className="font-bold text-main block">Select Date Range Filter:</span>
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
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                    dateRange === r.id
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                      : "bg-surface text-muted-theme border-theme hover:text-main"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-muted-theme space-y-1">
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
            <h2 className="text-base font-bold text-main flex items-center">
              <History className="w-4 h-4 text-emerald-500 mr-2" />
              Immutable Audit Trail
            </h2>
            <p className="text-xs text-muted-theme">
              Tamper-proof log of member mutations, financial transactions, staff changes, and system events.
            </p>
          </div>

          <div className="bg-surface border border-theme rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs responsive-table">
              <thead className="bg-app text-muted-theme font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Performed By</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {initialAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-app/50 transition">
                    <td data-label="Action" className="py-2.5 px-4">
                      <span className="font-mono font-bold text-main">{log.action}</span>
                    </td>
                    <td data-label="Entity" className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface text-muted-theme border border-theme">
                        {log.entity_type}
                      </span>
                    </td>
                    <td data-label="Performed By" className="py-2.5 px-4 text-muted-theme">{log.performed_by_email || "system"}</td>
                    <td data-label="Details" className="py-2.5 px-4 text-muted-theme font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td data-label="Timestamp" className="py-2.5 px-4 text-right text-muted-theme text-[11px] font-mono">
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
