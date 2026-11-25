"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notifyLocalMutation } from "@/lib/realtime/syncStore";
import { createPlan, togglePlanStatus, deletePlan, updatePlan } from "@/actions/plans";
import { formatCurrency } from "@/lib/utils";
import type { MembershipPlan } from "@/types/database";
import {
  Plus,
  Check,
  X,
  Sparkles,
  Trash2,
  Edit2,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  Award,
  Crown,
} from "lucide-react";

interface PlansClientProps {
  initialPlans: MembershipPlan[];
}

export function PlansClient({ initialPlans }: PlansClientProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>(initialPlans);

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(1499);
  const [admissionFee, setAdmissionFee] = useState(0);
  const [badgeText, setBadgeText] = useState("");
  const [description, setDescription] = useState("");
  const [perksText, setPerksText] = useState("Weight Training, Cardio Access, Free Locker, Steam Bath");

  function openCreateModal() {
    setEditingPlan(null);
    setName("");
    setDurationDays(30);
    setPrice(1499);
    setAdmissionFee(0);
    setBadgeText("");
    setDescription("");
    setPerksText("Weight Training, Cardio Access, Free Locker, Steam Bath");
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(plan: MembershipPlan) {
    setEditingPlan(plan);
    setName(plan.name);
    setDurationDays(plan.duration_days);
    setPrice(plan.price);
    setAdmissionFee(plan.admission_fee || 0);
    setBadgeText(plan.badge_text || "");
    setDescription(plan.description || "");
    setPerksText(Array.isArray(plan.perks) ? plan.perks.join(", ") : "");
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const perks = perksText
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (editingPlan) {
      const res = await updatePlan(editingPlan.id, {
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
        setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? res.plan! : p)));
        setIsModalOpen(false);
        notifyLocalMutation(router, "/plans");
      }
    } else {
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
        notifyLocalMutation(router, "/plans");
      }
    }
  }

  async function handleToggleStatus(planId: string) {
    const res = await togglePlanStatus(planId);
    if (res.success && res.plan) {
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, is_active: res.plan!.is_active } : p))
      );
      notifyLocalMutation(router, "/plans");
    }
  }

  async function handleDelete(planId: string) {
    if (!confirm("Are you sure you want to deactivate or remove this plan?")) return;
    const res = await deletePlan(planId);
    if (res.success) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      notifyLocalMutation(router, "/plans");
    } else if (res.error) {
      alert(res.error);
    }
  }

  const activePlans = plans.filter((p) => p.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center">
            <Layers className="w-6 h-6 text-emerald-500 mr-2" />
            Membership Plans & Pricing
          </h1>
          <p className="text-sm text-muted-theme mt-1">
            Configure admission tiers, pricing, duration cycles, and included perks for Fitness Planet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activePlans.length > 1 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-3.5 py-2 bg-surface hover:border-emerald-500 border border-theme text-main rounded-xl text-xs font-semibold transition flex items-center shadow-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Compare Plans
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create New Plan
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const isGold =
            plan.name.toLowerCase().includes("annual") ||
            plan.name.toLowerCase().includes("year") ||
            (plan.badge_text && plan.badge_text.toLowerCase().includes("best value"));

          const isPopular =
            plan.name.toLowerCase().includes("quarter") ||
            plan.name.toLowerCase().includes("3 month") ||
            (plan.badge_text && plan.badge_text.toLowerCase().includes("popular"));

          return (
            <div
              key={plan.id}
              className={`border rounded-2xl p-5 flex flex-col justify-between transition relative overflow-hidden ${
                plan.is_active
                  ? "bg-surface border-theme shadow-sm hover:border-emerald-500/50"
                  : "bg-surface/50 border-theme opacity-60"
              }`}
            >
              {/* Highlight Ribbon */}
              {isGold && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-bl-xl shadow-xs flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Best Value
                </div>
              )}
              {isPopular && !isGold && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-l from-emerald-500 to-teal-600 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-bl-xl shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div>
                {/* Badge & Status */}
                <div className="flex items-center justify-between mb-3 pr-8">
                  {plan.badge_text ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {plan.badge_text}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-theme font-mono">
                      {plan.duration_days} Days
                    </span>
                  )}

                  <button
                    onClick={() => handleToggleStatus(plan.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition ${
                      plan.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-surface text-muted-theme border border-theme hover:bg-surface/80"
                    }`}
                    title="Click to toggle active status"
                  >
                    {plan.is_active ? "● Active" : "○ Inactive"}
                  </button>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-main">{plan.name}</h3>
                <p className="text-xs text-muted-theme mt-1 line-clamp-2">
                  {plan.description || "Full gym equipment, cardio, and locker access."}
                </p>

                {/* Pricing Box */}
                <div className="mt-4 pb-4 border-b border-theme">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-extrabold text-main font-mono">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-xs text-muted-theme ml-1.5 font-medium">
                      / {plan.duration_days} days
                    </span>
                  </div>
                  {plan.admission_fee && plan.admission_fee > 0 ? (
                    <span className="text-[11px] text-amber-500 font-medium block mt-1">
                      + {formatCurrency(plan.admission_fee)} one-time registration fee
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-500 font-medium block mt-1">
                      ✓ Zero Admission Fee
                    </span>
                  )}
                </div>

                {/* Perks List */}
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-theme">
                    Included Benefits
                  </span>
                  {Array.isArray(plan.perks) && plan.perks.length > 0 ? (
                    <ul className="space-y-1.5">
                      {plan.perks.map((perk, i) => (
                        <li key={i} className="text-xs text-main flex items-center">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" />
                          <span className="truncate">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-theme italic">Standard gym floor access</p>
                  )}
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div className="mt-6 pt-3 border-t border-theme flex items-center justify-between">
                <span className="text-[10px] text-muted-theme font-mono">
                  {plan.duration_days}D • ₹{Math.round(plan.price / (plan.duration_days / 30))}/mo
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="p-1.5 rounded-lg text-muted-theme hover:text-main hover:bg-surface border border-transparent hover:border-theme transition"
                    title="Edit plan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-1.5 rounded-lg text-muted-theme hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
                    title="Delete or deactivate plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compare Plans Modal */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCompareOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-main flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                Compare Membership Tiers
              </h2>
              <p className="text-xs text-muted-theme mt-1">
                Side-by-side breakdown of all active Fitness Planet membership plans.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-app border border-theme rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-base font-bold text-main">{plan.name}</h3>
                    <div className="mt-2 text-2xl font-black text-emerald-500 font-mono">
                      {formatCurrency(plan.price)}
                      <span className="text-xs text-muted-theme font-normal ml-1">
                        / {plan.duration_days}d
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-theme mt-1">
                      {plan.admission_fee
                        ? `+ ${formatCurrency(plan.admission_fee)} admission`
                        : "Zero admission fee"}
                    </div>

                    <div className="mt-4 pt-4 border-t border-theme space-y-2">
                      <span className="text-[10px] font-bold text-muted-theme uppercase">
                        Included Features
                      </span>
                      {Array.isArray(plan.perks) &&
                        plan.perks.map((p, idx) => (
                          <div key={idx} className="text-xs text-main flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-main mb-1">
              {editingPlan ? "Edit Membership Plan" : "Create Membership Plan"}
            </h2>
            <p className="text-xs text-muted-theme mb-4">
              {editingPlan
                ? "Update pricing, duration or perks for this plan."
                : "Add a new membership tier with custom pricing, duration, and perks."}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3 Months Transformation Pass"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Admission Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={admissionFee}
                    onChange={(e) => setAdmissionFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Badge Text (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BEST VALUE, POPULAR, ELITE"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Short note on access hours, trainer sessions, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">
                  Included Perks (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Strength Area, Cardio Floor, Steam, Free Locker"
                  value={perksText}
                  onChange={(e) => setPerksText(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-surface/80 border border-theme text-main rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
