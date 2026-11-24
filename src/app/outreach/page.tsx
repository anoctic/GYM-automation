import { getGymDetails } from "@/actions/gym";
import { getMembers } from "@/actions/members";
import { OutreachClient } from "./OutreachClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Outreach & Automated Follow-Ups | GymOS Cloud",
  description: "Targeted WhatsApp follow-up messaging for dues, renewals, inactives, and trial leads.",
};

export default async function OutreachPage() {
  const { gym, isDemo } = await getGymDetails();
  const { members } = await getMembers();

  return <OutreachClient gym={gym} members={members} isDemo={!!isDemo} />;
}
