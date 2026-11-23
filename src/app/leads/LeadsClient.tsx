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
  Sparkles
} from "lucide-react";

interface LeadsClientProps {
  initialLeads: Lead[];
  isDemo: boolean;
}

const STAGES: { stage: LeadStage; label: string; color: string }[] = [
  { stage: "new_inquiry", label: "New Inquiry", color: "bg-blue-950 text-blue-300 border-blue-800" },
  { stage: "contacted", label: "Contacted", color: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  { stage: "trial_booked", label: "Trial Booked", color: "bg-amber-950 text-amber-300 border-amber-800" },
  { stage: "follow_up", label: "Follow-Up", color: "bg-purple-950 text-purple-300 border-purple-800" },
  { stage: "converted", label: "Converted (Member)", color: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  { stage: "lost", label: "Lost", color: "bg-gray-800 text-gray-400 border-gray-700" },
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
          <h1 className="text-2xl font-bold text-white flex items-center">
            <PhoneCall className="w-6 h-6 text-emerald-400 mr-2" />
            Leads & Inquiries CRM
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track prospective members, trial session bookings, and conversion pipeline.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition flex items-center shadow"
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
            <div key={s.stage} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${s.color}`}>
                  {s.label}
                </span>
                <span className="text-xs text-gray-400 font-mono font-bold">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {stageLeads.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">No leads in this stage</p>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 bg-gray-800/60 border border-gray-700/60 rounded-lg text-xs space-y-2 hover:border-gray-600 transition"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-white text-sm">{lead.name}</span>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="text-gray-400 hover:text-red-400 p-0.5"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-gray-300 flex items-center">
                        <Phone className="w-3 h-3 text-emerald-400 mr-1.5" />
                        <span>{lead.phone}</span>
                      </div>

                      {lead.notes && (
                        <p className="text-[11px] text-gray-400 bg-gray-900/60 p-2 rounded border border-gray-800/80">
                          {lead.notes}
                        </p>
                      )}

                      <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">
                          Updated {formatDate(lead.updated_at)}
                        </span>

                        {/* Move stage dropdown */}
                        <select
                          value={lead.stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                          className="text-[11px] bg-gray-900 border border-gray-700 text-gray-300 rounded px-1.5 py-0.5 focus:outline-none"
                        >
                          {STAGES.map((st) => (
                            <option key={st.stage} value={st.stage}>
                              Move to: {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE LEAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add Lead / Inquiry</h2>
            <p className="text-xs text-gray-400 mb-4">Record new walk-in or phone enquiry.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karan Malhotra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as LeadStage)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {STAGES.map((s) => (
                    <option key={s.stage} value={s.stage}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Inquiry Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Interested in evening trial, asked about personal trainer fees"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {loading ? "Saving..." : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
