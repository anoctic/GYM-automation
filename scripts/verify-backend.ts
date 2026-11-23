import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sb = createClient(supabaseUrl, serviceKey);

async function runVerification() {
  console.log("=== STARTING GYMOS CLOUD BACKEND VERIFICATION ===");

  const demoGymId = "00000000-0000-0000-0000-000000000001";

  // 1. Verify Gyms
  const { data: gym, error: gymErr } = await sb
    .from("gyms")
    .select("*")
    .eq("id", demoGymId)
    .single();
  if (gymErr) throw new Error("Gym lookup failed: " + gymErr.message);
  console.log(`[PASS] Demo Gym resolved: "${gym.name}" (Slot: ${gym.default_upi_slot}, UPI: ${gym.upi_primary_id})`);

  // 2. Verify Plans
  const { data: plans, error: plansErr } = await sb
    .from("membership_plans")
    .select("*")
    .eq("gym_id", demoGymId);
  if (plansErr) throw new Error("Plans lookup failed: " + plansErr.message);
  console.log(`[PASS] Membership Plans count: ${plans.length}`);
  plans.forEach((p) => {
    console.log(`  - ${p.name}: ₹${p.price} / ${p.duration_days} days (Active: ${p.is_active})`);
  });

  // 3. Verify Members & Dues
  const { data: members, error: memErr } = await sb
    .from("members")
    .select("*, membership_plans(*)")
    .eq("gym_id", demoGymId);
  if (memErr) throw new Error("Members lookup failed: " + memErr.message);
  console.log(`[PASS] Enrolled Members count: ${members.length}`);
  members.forEach((m) => {
    console.log(`  - ${m.member_code} (${m.full_name}): Status=${m.status}, Expiry=${m.expiry_date}, Dues=₹${m.pending_dues}, Sessions=${m.total_sessions}`);
  });

  // 4. Verify Active Floor Attendance
  const { data: activeFloor, error: floorErr } = await sb
    .from("attendance_logs")
    .select("*, members(full_name, member_code)")
    .eq("gym_id", demoGymId)
    .is("check_out_at", null);
  if (floorErr) throw new Error("Floor attendance lookup failed: " + floorErr.message);
  console.log(`[PASS] Active Members on Floor right now: ${activeFloor.length}`);
  activeFloor.forEach((f) => {
    console.log(`  - ${f.members?.full_name} (${f.members?.member_code}) checked in at ${f.check_in_at} via ${f.method}`);
  });

  // 5. Verify Pending Admissions
  const { data: admissions, error: admErr } = await sb
    .from("admissions")
    .select("*")
    .eq("gym_id", demoGymId)
    .eq("status", "pending");
  if (admErr) throw new Error("Admissions lookup failed: " + admErr.message);
  console.log(`[PASS] Pending Admissions Queue count: ${admissions.length}`);
  admissions.forEach((a) => {
    console.log(`  - Applicant: ${a.applicant_name} (${a.phone})`);
  });

  // 6. Verify Payments Receipts
  const { data: payments, error: payErr } = await sb
    .from("payments")
    .select("*, members(full_name)")
    .eq("gym_id", demoGymId);
  if (payErr) throw new Error("Payments logged: " + payErr.message);
  console.log(`[PASS] Payments Logged: ${payments.length}`);
  payments.forEach((p) => {
    console.log(`  - Receipt: ${p.receipt_no} | Member: ${p.members?.full_name} | Amount: ₹${p.amount} via ${p.payment_method}`);
  });

  console.log("\n>>> ALL ARCHITECTURAL TESTS AND QUERIES PASSED SUCCESSFULLY! <<<");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
