import { redirect } from "next/navigation";
import { getGymDetails } from "@/actions/gym";
import { getMembers } from "@/actions/members";
import { getTenantContext } from "@/lib/tenant/context";
import { OutreachClient } from "./OutreachClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Outreach & Automated Follow-Ups | GymOS Cloud",
  description: "Targeted WhatsApp follow-up messaging for dues, renewals, inactives, and trial leads.",
};

export default async function OutreachPage() {
  const { isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const { gym } = await getGymDetails();
  const { members } = await getMembers();

  return <OutreachClient gym={gym!} members={members} />;
}
