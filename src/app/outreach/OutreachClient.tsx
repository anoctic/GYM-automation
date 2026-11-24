"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Member, Gym } from "@/types/database";
import {
  MessageCircle,
  Send,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Users,
  Copy,
  Check,
  ExternalLink,
  Flame,
} from "lucide-react";

interface OutreachClientProps {
  gym: Gym;
  members: Member[];
}

type BucketType = "dues" | "expiring" | "expired" | "inactive" | "trials";
type LanguageType = "hinglish" | "english" | "hindi";

export function OutreachClient({ gym, members }: OutreachClientProps) {
  const [activeBucket, setActiveBucket] = useState<BucketType>("dues");
  const [language, setLanguage] = useState<LanguageType>("hinglish");
  const [queueIndex, setQueueIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const gymPhone = gym.phone || "+91 9149183060";
  const gymName = gym.name || "Fitness Planet Unisex Gym";

  // Bucket Classifications
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  const buckets = useMemo(() => {
    return {
      dues: members.filter((m) => Number(m.pending_dues) > 0),
      expiring: members.filter((m) => {
        const exp = new Date(m.expiry_date);
        return exp >= now && exp <= next7Days;
      }),
      expired: members.filter((m) => m.status === "expired"),
      inactive: members.filter((m) => m.is_inactive_3d),
      trials: members.filter((m) => m.status === "trial"),
    };
  }, [members]);

  const currentList = buckets[activeBucket];
  const currentMember: Member | undefined = currentList[queueIndex];

  // Message Generator based on bucket & language
  function generateMessage(m: Member, lang: LanguageType, bucket: BucketType): string {
    const name = m.full_name;
    const plan = m.membership_plans?.name || "Membership Plan";
    const dues = formatCurrency(m.pending_dues);
    const expDate = formatDate(m.expiry_date);

    if (bucket === "dues") {
      switch (lang) {
        case "hinglish":
          return `Namaste ${name} ji! 🙏\nFitness Planet Unisex Gym, Sikandrabad (Owner: Kapil Rajput) se friendly reminder:\nAapka gym membership ka balance dues ${dues} pending hai.\nKripya gym desk par aakar ya UPI (${gym.upi_primary_id || "9149183060@paytm"}) par pay karein.\nContact: ${gymPhone}. Thank you! 💪`;
        case "hindi":
          return `नमस्ते ${name} जी! 🙏\nफिटनेस प्लैनेट यूनिसेक्स जिम, सिकंदराबाद से सादर नमस्कार।\nआपकी जिम सदस्यता का बकाया शुल्क ${dues} देय है। कृपया जिम रिसेप्शन पर या ऑनलाइन भुगतान करें।\nसंपर्क: ${gymPhone}. धन्यवाद! 💪`;
        case "english":
          return `Hello ${name}! 👋\nGreetings from Fitness Planet Unisex Gym, Sikandrabad.\nThis is a friendly reminder that you have pending gym dues of ${dues}.\nPlease clear the payment at the front desk or via UPI.\nHelpline: ${gymPhone}. Have a great workout! 💪`;
      }
    }

    if (bucket === "expiring") {
      switch (lang) {
        case "hinglish":
          return `Namaste ${name} ji! 💪\nFitness Planet Unisex Gym, Sikandrabad se alert:\nAapka ${plan} package ${expDate} ko expire ho raha hai.\nApna workout momentum continue rakhne ke liye timely renew karwayein.\nSpecial renewal offer details ke liye reception par contact karein: ${gymPhone}. Thank you! 🔥`;
        case "hindi":
          return `नमस्ते ${name} जी! 💪\nफिटनेस प्लैनेट यूनिसेक्स जिम, सिकंदराबाद:\nआपका ${plan} पैकेज ${expDate} को समाप्त हो रहा है। निरंतर वर्कआउट के लिए कृपया समय पर नवीनीकरण करवाएं।\nसंपर्क: ${gymPhone}. धन्यवाद! 🔥`;
        case "english":
          return `Dear ${name}! 💪\nYour ${plan} package at Fitness Planet Unisex Gym expires on ${expDate}.\nKindly renew your membership today to keep your fitness momentum going without interruption.\nContact front desk: ${gymPhone}. Stay Strong! 🔥`;
      }
    }

    if (bucket === "expired") {
      switch (lang) {
        case "hinglish":
          return `Namaste ${name} ji! 👋 We miss you at Fitness Planet!\nAapka gym membership plan expire ho chuka hai. Humare naye workout equipment aur seasonal offers start ho chuke hain.\nApni fitness journey wapas start karein. Call Kapil Rajput: ${gymPhone} for exclusive comeback offer! 💪`;
        case "hindi":
          return `नमस्ते ${name} जी! फिटनेस प्लैनेट जिम में आपकी कमी खल रही है!\nआपकी सदस्यता समाप्त हो चुकी है। अपने फिटनेस लक्ष्यों को फिर से शुरू करने के लिए संपर्क करें: ${gymPhone}। आपका स्वागत है! 💪`;
        case "english":
          return `Hello ${name}! We miss seeing you at Fitness Planet Unisex Gym!\nYour membership has expired. Jump back into your fitness routine today with our exclusive renewal benefits.\nCall Kapil Rajput: ${gymPhone}. Strong Is Universal! 💪`;
      }
    }

    if (bucket === "trials") {
      switch (lang) {
        case "hinglish":
          return `Namaste ${name} ji! 🙏\nAapne Fitness Planet Unisex Gym, Sikandrabad mein trial session attend kiya tha. Kaisa raha aapka workout experience?\nAapke liye special 3-Month & Annual transformation discounts available hain. Visit us today or call: ${gymPhone}! 🏋️‍♂️`;
        case "hindi":
          return `नमस्ते ${name} जी! फिटनेस प्लैनेट जिम में आपका ट्रायल सत्र कैसा रहा? नए सदस्यों के लिए विशेष छूट उपलब्ध है। संपर्क करें: ${gymPhone}! 🏋️‍♂️`;
        case "english":
          return `Hi ${name}! How was your workout session at Fitness Planet Unisex Gym? We would love to have you as a regular member. Check out our special introductory packages: ${gymPhone}! 🏋️‍♂️`;
      }
    }

    // Inactive 7d+
    switch (lang) {
      case "hinglish":
        return `Namaste ${name} ji! 🔥 Consistency is key! Hum notice kar rahe hain ki aap pichhle kuch dino se workout ke liye nahi aa pa rahe hain.\nFitness Planet par aaiye aur apni daily workout routine resume kijiye. Koi guidance chahiye toh Kapil Rajput se contact karein: ${gymPhone}! 💪`;
      case "hindi":
        return `नमस्ते ${name} जी! हम नोटिस कर रहे हैं कि आप कुछ दिनों से जिम नहीं आ पाए हैं। अपनी फिटनेस दिनचर्या फिर से शुरू करें। संपर्क करें: ${gymPhone}! 💪`;
      case "english":
        return `Hello ${name}! Consistency is the secret to great results! We noticed you haven't visited Fitness Planet for a few days.\nCome back to the floor today and crush your workout. We are here to support you: ${gymPhone}! 💪`;
    }
  }

  function getWhatsAppLink(m: Member) {
    const cleanPhone = m.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(generateMessage(m, language, activeBucket));
    return `https://wa.me/${formattedPhone}?text=${text}`;
  }

  function copyCurrentMessage() {
    if (!currentMember) return;
    const msg = generateMessage(currentMember, language, activeBucket);
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-main flex items-center space-x-2">
            <span>WhatsApp Outreach Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-bold">
              1-Click Guided Queue
            </span>
          </h1>
          <p className="text-xs text-muted-theme mt-1">
            Segmented member outreach buckets with pre-filled WhatsApp templates in Hinglish, Hindi, and English.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-surface border border-theme">
          {[
            { id: "hinglish", label: "Hinglish (Recommended)" },
            { id: "hindi", label: "हिंदी" },
            { id: "english", label: "English" },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                language === l.id
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "text-muted-theme hover:text-main"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5 OUTREACH BUCKET PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            id: "dues",
            title: "Outstanding Dues",
            count: buckets.dues.length,
            color: "text-amber-400",
            border: "border-amber-500/30",
            bg: "bg-amber-500/10",
          },
          {
            id: "expiring",
            title: "Expiring in 7 Days",
            count: buckets.expiring.length,
            color: "text-orange-400",
            border: "border-orange-500/30",
            bg: "bg-orange-500/10",
          },
          {
            id: "expired",
            title: "Expired Plan",
            count: buckets.expired.length,
            color: "text-red-400",
            border: "border-red-500/30",
            bg: "bg-red-500/10",
          },
          {
            id: "inactive",
            title: "Inactive Members",
            count: buckets.inactive.length,
            color: "text-blue-400",
            border: "border-blue-500/30",
            bg: "bg-blue-500/10",
          },
          {
            id: "trials",
            title: "Trial Passes",
            count: buckets.trials.length,
            color: "text-purple-400",
            border: "border-purple-500/30",
            bg: "bg-purple-500/10",
          },
        ].map((b) => {
          const isSelected = activeBucket === b.id;
          return (
            <button
              key={b.id}
              onClick={() => {
                setActiveBucket(b.id as any);
                setQueueIndex(0);
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-1 ${
                isSelected
                  ? "bg-surface border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-surface/60 border-theme hover:bg-surface"
              }`}
            >
              <span className="text-[11px] font-bold text-muted-theme block">{b.title}</span>
              <span className={`text-2xl font-black font-mono-code ${b.color}`}>{b.count}</span>
            </button>
          );
        })}
      </div>

      {/* 1-BY-1 GUIDED QUEUE CAROUSEL CARD */}
      <div className="rounded-2xl bg-surface border border-theme p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-subtle-theme pb-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center">
              <Send className="w-3.5 h-3.5 mr-1.5" />
              1-by-1 Guided Queue Mode
            </span>
            <h2 className="text-base font-bold text-main">
              Sending to: {activeBucket.toUpperCase()} Queue
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono-code font-bold text-muted-theme">
              {currentList.length > 0 ? `${queueIndex + 1} of ${currentList.length}` : "0 of 0"}
            </span>

            <button
              onClick={() => setQueueIndex((prev) => Math.max(0, prev - 1))}
              disabled={queueIndex === 0}
              className="p-1.5 rounded-lg border border-theme text-muted-theme hover:text-main disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setQueueIndex((prev) => Math.min(currentList.length - 1, prev + 1))}
              disabled={queueIndex >= currentList.length - 1}
              className="p-1.5 rounded-lg border border-theme text-muted-theme hover:text-main disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {currentMember ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Recipient Details */}
            <div className="p-4 rounded-xl bg-app border border-subtle-theme space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
                  {currentMember.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-main text-base">{currentMember.full_name}</h3>
                  <span className="font-mono-code text-xs text-emerald-400 font-semibold">
                    {currentMember.member_code} • {currentMember.phone}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-subtle-theme">
                <div>
                  <span className="text-dim-theme block">Plan</span>
                  <span className="font-semibold text-main">
                    {currentMember.membership_plans?.name || "Standard Plan"}
                  </span>
                </div>
                <div>
                  <span className="text-dim-theme block">Expiry Date</span>
                  <span className="font-semibold text-main">{formatDate(currentMember.expiry_date)}</span>
                </div>
                <div>
                  <span className="text-dim-theme block">Pending Dues</span>
                  <span className="font-bold text-amber-400 font-mono-code">
                    {formatCurrency(currentMember.pending_dues)}
                  </span>
                </div>
                <div>
                  <span className="text-dim-theme block">Sessions Done</span>
                  <span className="font-semibold text-main">{currentMember.total_sessions}</span>
                </div>
              </div>
            </div>

            {/* Message Preview & Action */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-muted-theme uppercase">
                  WhatsApp Message Preview
                </label>
                <button
                  onClick={copyCurrentMessage}
                  className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Text"}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-input-field border border-theme text-xs text-main leading-relaxed font-sans whitespace-pre-line select-all">
                {generateMessage(currentMember, language, activeBucket)}
              </div>

              {/* Big Green WhatsApp Send Button */}
              <div className="flex items-center space-x-3 pt-2">
                <a
                  href={getWhatsAppLink(currentMember)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (queueIndex < currentList.length - 1) {
                      setQueueIndex(queueIndex + 1);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-green-950/40"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp &amp; Send</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                {queueIndex < currentList.length - 1 && (
                  <button
                    onClick={() => setQueueIndex(queueIndex + 1)}
                    className="py-3 px-4 rounded-xl bg-surface hover:bg-surface-hover text-muted-theme hover:text-main border border-theme text-xs font-bold transition"
                  >
                    Skip →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-theme text-xs">
            🎉 All members in this bucket have been cleared! No pending messages for {activeBucket}.
          </div>
        )}
      </div>

      {/* BUCKET LIST TABLE FOR BULK GLANCE */}
      <div className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-sm space-y-3 p-5">
        <h3 className="text-sm font-bold text-main">
          All {currentList.length} Members in this Segment
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs responsive-table">
            <thead className="bg-app border-b border-subtle-theme text-[11px] font-bold text-muted-theme uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3">Pending Dues</th>
                <th className="py-2.5 px-3 text-right">Quick WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle-theme">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-theme">
                    Bucket is empty.
                  </td>
                </tr>
              ) : (
                currentList.map((m, idx) => (
                  <tr key={m.id} className="bg-surface-hover">
                    <td className="py-2.5 px-3" data-label="Member">
                      <span className="font-bold text-main">{m.full_name}</span>
                      <span className="font-mono-code text-[11px] text-emerald-400 ml-1.5">
                        ({m.member_code})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-theme" data-label="Phone">
                      {m.phone}
                    </td>
                    <td className="py-2.5 px-3" data-label="Plan">
                      {m.membership_plans?.name || "Standard"}
                    </td>
                    <td className="py-2.5 px-3 text-muted-theme" data-label="Expiry">
                      {formatDate(m.expiry_date)}
                    </td>
                    <td className="py-2.5 px-3" data-label="Dues">
                      {Number(m.pending_dues) > 0 ? (
                        <span className="font-mono-code font-bold text-amber-400">
                          {formatCurrency(m.pending_dues)}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Cleared</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right" data-label="Action">
                      <a
                        href={getWhatsAppLink(m)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-500 text-white inline-flex items-center space-x-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
