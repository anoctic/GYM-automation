"use client";

import { useState } from "react";
import { submitAdmission } from "@/actions/admissions";
import { formatCurrency } from "@/lib/utils";
import type { Gym, MembershipPlan } from "@/types/database";
import { 
  Dumbbell, 
  Check, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle2, 
  UserCheck, 
  Sparkles 
} from "lucide-react";

interface JoinClientProps {
  gym: Gym;
  plans: MembershipPlan[];
}

export function JoinClient({ gym, plans }: JoinClientProps) {
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Gym Branding Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xl shadow-emerald-950/50 mx-auto mb-3">
          <Dumbbell className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{gym.name}</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-lg mx-auto">
          {gym.tagline || "Begin your fitness transformation with us today."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-gray-400">
          {gym.address && (
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              {gym.address}, {gym.city}
            </span>
          )}
          {gym.opening_hours && (
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              {gym.opening_hours}
            </span>
          )}
          {gym.phone && (
            <span className="flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              {gym.phone}
            </span>
          )}
        </div>
      </div>

      {submitted ? (
        <div className="bg-gray-900 border border-emerald-800/80 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admission Submitted!</h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto">
            Thank you, <strong className="text-white">{applicantName}</strong>. Your membership application for{" "}
            <span className="text-emerald-400 font-semibold">{selectedPlan?.name || "Membership"}</span> has been received by our front desk.
          </p>

          <div className="mt-6 p-4 bg-gray-800/60 rounded-xl text-xs text-gray-400 max-w-sm mx-auto space-y-1">
            <p>Please show this confirmation screen at the reception desk.</p>
            <p>Our trainers will verify your admission and issue your official Member Code.</p>
          </div>

          <button
            onClick={() => {
              setSubmitted(false);
              setApplicantName("");
              setPhone("");
              setEmail("");
            }}
            className="mt-6 px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition"
          >
            Submit Another Application
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6 pb-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white flex items-center">
              <UserCheck className="w-5 h-5 text-emerald-400 mr-2" />
              Self-Admission Registration
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select your membership package and enter your details to register immediately.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Plan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                1. Choose Your Membership Plan
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`cursor-pointer border rounded-xl p-4 transition relative ${
                        isSelected
                          ? "bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/30"
                          : "bg-gray-800/40 border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      {plan.badge_text && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {plan.badge_text}
                        </span>
                      )}

                      <h3 className="font-bold text-white text-sm">{plan.name}</h3>
                      <div className="flex items-baseline mt-1">
                        <span className="text-xl font-extrabold text-white">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">/ {plan.duration_days} days</span>
                      </div>

                      {Number(plan.admission_fee) > 0 && (
                        <span className="text-[11px] text-amber-400 block mt-0.5">
                          + {formatCurrency(plan.admission_fee)} admission fee
                        </span>
                      )}

                      {/* Perks */}
                      {Array.isArray(plan.perks) && plan.perks.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-gray-300">
                          {plan.perks.slice(0, 3).map((perk, i) => (
                            <li key={i} className="flex items-center text-[11px]">
                              <Check className="w-3 h-3 text-emerald-400 mr-1.5 shrink-0" />
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
            <div className="pt-4 border-t border-gray-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                2. Applicant Contact Details
              </label>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aman Sharma"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Father's Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 91491 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="aman@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
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
                    className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                {loading ? "Submitting Application..." : `Submit Admission for ${selectedPlan?.name || "Membership"}`}
              </button>
              <p className="text-[11px] text-center text-gray-500 mt-2">
                By submitting, your details are registered directly with {gym.name} front desk.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
