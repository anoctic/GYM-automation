"use client";

import { useState } from "react";
import { createPlan, togglePlanStatus, deletePlan, updatePlan } from "@/actions/plans";
import { formatCurrency } from "@/lib/utils";
import type { MembershipPlan } from "@/types/database";
import { Plus, Check, X, Shield, Sparkles, Trash2, Edit2, Layers } from "lucide-react";

interface PlansClientProps {
  initialPlans: MembershipPlan[];
  isDemo: boolean;
}

export function PlansClient({ initialPlans, isDemo }: PlansClientProps) {
  const [plans, setPlans] = useState<MembershipPlan[]>(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(1499);
  const [admissionFee, setAdmissionFee] = useState(0);
  const [badgeText, setBadgeText] = useState("");
  const [description, setDescription] = useState("");
  const [perksText, setPerksText] = useState("Cardio Access, Free Locker, Steam Bath");

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const perks = perksText
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const res = await createPlan({
      name,
      duration_days: durationDays,
      price,
      admission_fee: admissionFee,
      badge_text: badgeText || undefined,
      description: description || undefined,
      perks,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.plan) {
      setPlans((prev) => [...prev, res.plan!]);
      setIsModalOpen(false);
      setName("");
      setDescription("");
      setBadgeText("");
    }
  }

  async function handleToggleStatus(planId: string) {
    const res = await togglePlanStatus(planId);
    if (res.success && res.plan) {
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, is_active: res.plan!.is_active } : p))
      );
    }
  }

  async function handleDelete(planId: string) {
    if (!confirm("Are you sure you want to delete or deactivate this plan?")) return;
    const res = await deletePlan(planId);
    if (res.success) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
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
            <Layers className="w-6 h-6 text-emerald-400 mr-2" />
            Membership Plans CRUD
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure admission tiers, pricing, duration cycles, and perks.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition flex items-center shadow"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-xl p-5 flex flex-col justify-between transition ${
              plan.is_active
                ? "bg-gray-900 border-gray-800 shadow-sm hover:border-gray-700"
                : "bg-gray-950/60 border-gray-900 opacity-60"
            }`}
          >
            <div>
              {/* Badge & Status */}
              <div className="flex items-center justify-between mb-3">
                {plan.badge_text ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {plan.badge_text}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 font-mono">{plan.duration_days} Days</span>
                )}

                <button
                  onClick={() => handleToggleStatus(plan.id)}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition ${
                    plan.is_active
                      ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700 hover:bg-emerald-800"
                      : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                  }`}
                  title="Click to toggle active status"
                >
                  {plan.is_active ? "● Active" : "○ Inactive"}
                </button>
              </div>

              {/* Title & Duration */}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{plan.description || "General membership access"}</p>

              {/* Pricing */}
              <div className="mt-4 pb-4 border-b border-gray-800">
                <div className="flex items-baseline">
                  <span className="text-2xl font-extrabold text-white">{formatCurrency(plan.price)}</span>
                  <span className="text-xs text-gray-400 ml-1.5">/ {plan.duration_days} days</span>
                </div>
                {plan.admission_fee && plan.admission_fee > 0 ? (
                  <span className="text-xs text-amber-400 block mt-0.5">
                    + {formatCurrency(plan.admission_fee)} one-time admission
                  </span>
                ) : (
                  <span className="text-xs text-emerald-400 block mt-0.5">₹0 Admission fee</span>
                )}
              </div>

              {/* Perks List */}
              <div className="mt-4 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Included Perks</span>
                {Array.isArray(plan.perks) && plan.perks.length > 0 ? (
                  <ul className="space-y-1.5">
                    {plan.perks.map((perk, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-center">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                        <span className="truncate">{perk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">No specific perks listed</p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-3 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-mono">ID: {plan.id.slice(0, 8)}...</span>
              <button
                onClick={() => handleDelete(plan.id)}
                className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-800 transition"
                title="Delete or deactivate plan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Create Membership Plan</h2>
            <p className="text-xs text-gray-400 mb-4">
              Add a new membership tier with custom pricing, duration, and perks.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Shred 60-Day Pass"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Admission Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={admissionFee}
                    onChange={(e) => setAdmissionFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Popular, Best Value, Seasonal"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Perks (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Cardio, Steam Bath, Diet consultation, Locker"
                  value={perksText}
                  onChange={(e) => setPerksText(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of who this plan is best suited for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Save Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
