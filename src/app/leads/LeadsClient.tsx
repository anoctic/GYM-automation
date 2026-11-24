"use client";

import { useState } from "react";
import { createLead, updateLeadStage, deleteLead } from "@/actions/leads";
import { formatDate } from "@/lib/utils";
import type { Lead, LeadStage } from "@/types/database";
import {
  PhoneCall,
  Plus,
  Trash2,
  Clock,
  User,
  Phone,
  X,
  ArrowRight,
  Sparkles,
  MessageCircle,
} from "lucide-react";

interface LeadsClientProps {
  initialLeads: Lead[];
  isDemo: boolean;
}

const STAGES: { stage: LeadStage; label: string; color: string }[] = [
  { stage: "new_inquiry", label: "New Inquiry", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { stage: "contacted", label: "Contacted", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  { stage: "trial_booked", label: "Trial Booked", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { stage: "follow_up", label: "Follow-Up", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { stage: "converted", label: "Converted (Member)", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { stage: "lost", label: "Lost", color: "bg-surface text-muted-theme border-theme" },
];

export function LeadsClient({ initialLeads, isDemo }: LeadsClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<LeadStage>("new_inquiry");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await createLead({
      name,
      phone,
      stage,
      notes,
    });

    setLoading(false);

    if (res.success && res.lead) {
      setLeads((prev) => [res.lead!, ...prev]);
      setIsModalOpen(false);
      setName("");
      setPhone("");
      setNotes("");
    } else if (res.error) {
      alert(res.error);
    }
  }

  async function handleStageChange(leadId: string, newStage: LeadStage) {
    const res = await updateLeadStage(leadId, newStage);
    if (res.success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
      );
    }
  }

  async function handleDelete(leadId: string) {
    if (!confirm("Are you sure you want to remove this lead?")) return;
    const res = await deleteLead(leadId);
    if (res.success) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center">
            <PhoneCall className="w-6 h-6 text-emerald-500 mr-2" />
            Leads & Inquiries CRM
          </h1>
          <p className="text-sm text-muted-theme mt-1">
            Track prospective Fitness Planet members, trial session bookings, and conversion pipeline.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center shadow-md shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Lead
        </button>
      </div>

      {/* Leads Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAGES.map((s) => {
          const stageLeads = leads.filter((l) => l.stage === s.stage);
          return (
            <div key={s.stage} className="bg-surface border border-theme rounded-2xl p-4 flex flex-col shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-theme mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.color}`}>
                  {s.label}
                </span>
                <span className="text-xs text-muted-theme font-mono font-bold">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {stageLeads.length === 0 ? (
                  <p className="text-xs text-muted-theme italic py-6 text-center">No leads in this stage</p>
                ) : (
                  stageLeads.map((lead) => {
                    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      `Namaste ${lead.name}! Fitness Planet Unisex Gym, Sikandrabad se Kapil Rajput baat kar raha hoon. Gym membership and free trial workout session ke regarding connect kiya.`
                    )}`;

                    return (
                      <div
                        key={lead.id}
                        className="p-3.5 bg-app border border-theme rounded-xl text-xs space-y-2.5 hover:border-emerald-500/40 transition"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-main text-sm">{lead.name}</span>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="text-muted-theme hover:text-rose-400 p-0.5 transition"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-muted-theme">
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span className="font-mono">{lead.phone}</span>
                          </div>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-1 text-[10px] font-bold"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>

                        {lead.notes && (
                          <p className="text-[11px] text-muted-theme bg-surface p-2 rounded-lg border border-theme">
                            {lead.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-theme flex items-center justify-between">
                          <span className="text-[10px] text-muted-theme font-mono">
                            {formatDate(lead.updated_at)}
                          </span>

                          {/* Move stage dropdown */}
                          <select
                            value={lead.stage}
                            onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                            className="text-[10px] bg-surface border border-theme text-main rounded-lg px-2 py-0.5 focus:outline-none"
                          >
                            {STAGES.map((st) => (
                              <option key={st.stage} value={st.stage}>
                                Move: {st.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE LEAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-theme hover:text-main"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-main mb-1">Add Lead / Inquiry</h2>
            <p className="text-xs text-muted-theme mb-4">
              Log a walk-in inquiry or phone lead to track follow-ups and trial visits.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Prospect Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 91491 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Initial Pipeline Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as LeadStage)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main focus:outline-none focus:border-emerald-500"
                >
                  {STAGES.map((st) => (
                    <option key={st.stage} value={st.stage}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Inquiry Notes</label>
                <textarea
                  rows={3}
                  placeholder="Interested in evening slot, weight gain program, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-theme rounded-xl text-xs text-main placeholder-muted-theme focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/40 disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
