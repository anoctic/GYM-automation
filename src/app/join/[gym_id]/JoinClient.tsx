"use client";

import { useState } from "react";
import { submitAdmission } from "@/actions/admissions";
import { formatCurrency } from "@/lib/utils";
import { FitnessPlanetLogo } from "@/components/FitnessPlanetLogo";
import { useTheme } from "@/components/ThemeProvider";
import type { Gym, MembershipPlan } from "@/types/database";
import {
  Check,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  UserCheck,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface JoinClientProps {
  gym: Gym;
  plans: MembershipPlan[];
}

export function JoinClient({ gym, plans }: JoinClientProps) {
  const { theme, toggleTheme } = useTheme();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || "");
  const [applicantName, setApplicantName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("Sikandrabad");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await submitAdmission(gym.id, {
      applicant_name: applicantName,
      father_name: fatherName || undefined,
      gender,
      address,
      phone,
      email: email || undefined,
      selected_plan_id: selectedPlanId || undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.success) {
      setSubmitted(true);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 relative">
      {/* Top Controls: Theme Switcher */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-surface border border-theme text-muted-theme hover:text-main transition shadow-xs flex items-center gap-1.5 text-xs font-semibold"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Gym Branding Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <div className="p-2 rounded-2xl bg-surface/80 border border-theme shadow-md shadow-emerald-950/20">
            <FitnessPlanetLogo size="md" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-main tracking-tight uppercase">
          {gym.name || "Fitness Planet Unisex Gym"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-theme mt-1 max-w-lg mx-auto">
          {gym.tagline || "Strong Is Universal • Gym & Health Club • Sikandrabad"}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-muted-theme">
          {gym.address && (
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              {gym.address}, {gym.city}
            </span>
          )}
          {gym.opening_hours && (
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              {gym.opening_hours}
            </span>
          )}
          {gym.phone && (
            <span className="flex items-center font-mono">
              <Phone className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              {gym.phone}
            </span>
          )}
        </div>
      </div>

      {submitted ? (
        <div className="bg-surface border border-emerald-500/50 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-main mb-2">Admission Submitted!</h2>
          <p className="text-sm text-muted-theme max-w-md mx-auto">
            Thank you, <strong className="text-main">{applicantName}</strong>. Your membership application for{" "}
            <span className="text-emerald-500 font-bold">{selectedPlan?.name || "Membership"}</span> has been received by Kapil Rajput & our front desk.
          </p>

          <div className="mt-6 p-4 bg-app rounded-2xl text-xs text-muted-theme max-w-sm mx-auto space-y-1.5 border border-theme">
            <p>Please show this confirmation screen at the reception desk.</p>
            <p>Our trainers will verify your admission and issue your official Member Code (<strong className="text-emerald-500">FP-XX</strong>).</p>
          </div>

          <button
            onClick={() => {
              setSubmitted(false);
              setApplicantName("");
              setPhone("");
              setEmail("");
            }}
            className="mt-6 px-5 py-2.5 rounded-xl bg-app hover:bg-surface border border-theme text-xs font-bold text-main transition"
          >
            Submit Another Application
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-theme rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6 pb-4 border-b border-theme">
            <h2 className="text-base font-bold text-main flex items-center">
              <UserCheck className="w-5 h-5 text-emerald-500 mr-2" />
              Self-Admission Registration
            </h2>
            <p className="text-xs text-muted-theme mt-1">
              Select your membership package and enter your details to register immediately.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Plan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-theme mb-3">
                1. Choose Your Membership Plan
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`cursor-pointer border rounded-2xl p-4 transition relative ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 shadow-sm"
                          : "bg-app border-theme hover:border-emerald-500/30"
                      }`}
                    >
                      {plan.badge_text && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {plan.badge_text}
                        </span>
                      )}

                      <h3 className="font-bold text-main text-sm">{plan.name}</h3>
                      <div className="flex items-baseline mt-1">
                        <span className="text-xl font-black text-main font-mono">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-muted-theme ml-1">/ {plan.duration_days} days</span>
                      </div>

                      {Number(plan.admission_fee) > 0 && (
                        <span className="text-[11px] text-amber-500 block mt-0.5 font-medium">
                          + {formatCurrency(plan.admission_fee)} admission fee
                        </span>
                      )}

                      {/* Perks */}
                      {Array.isArray(plan.perks) && plan.perks.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-muted-theme">
                          {plan.perks.slice(0, 3).map((perk, i) => (
                            <li key={i} className="flex items-center text-[11px]">
                              <Check className="w-3 h-3 text-emerald-500 mr-1.5 shrink-0" />
                              <span className="truncate">{perk}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Personal Details */}
            <div className="pt-4 border-t border-theme">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-theme mb-3">
                2. Applicant Contact Details
              </label>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aman Sharma"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1">Father's Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 91491 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="aman@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Address / Mohalla (Sikandrabad)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near GT Road, Sikandrabad"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                {loading ? "Submitting Application..." : `Submit Admission for ${selectedPlan?.name || "Membership"}`}
              </button>
              <p className="text-[11px] text-center text-muted-theme mt-2">
                By submitting, your admission details are registered directly with {gym.name} front desk.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
