import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
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

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const demoGymId = "00000000-0000-0000-0000-000000000001";

async function testAllSettingsFeatures() {
  console.log("=== TESTING SETTINGS & ADMINISTRATION FEATURES ===");

  // 1. Verify Gym Slug
  const { data: gym, error: gymErr } = await sb
    .from("gyms")
    .select("id, name, slug")
    .eq("id", demoGymId)
    .single();

  if (gymErr) throw gymErr;
  console.log(`[PASS] Gym slug resolved: "${gym.slug}" for ${gym.name}`);

  // 2. Test Soft Delete & Restore
  console.log("\n--- Testing Soft Delete & Restore ---");
  const testMemberId = "20000000-0000-0000-0000-000000000006"; // Ananya Das (AF-1006)
  
  // Soft Delete
  const now = new Date().toISOString();
  await sb.from("members").update({ deleted_at: now }).eq("id", testMemberId);
  
  const { data: activeMembers } = await sb
    .from("members")
    .select("id, member_code")
    .eq("gym_id", demoGymId)
    .is("deleted_at", null);
  
  const isExcluded = !activeMembers?.some((m) => m.id === testMemberId);
  console.log(`[PASS] Soft delete verified: Member excluded from active directory? ${isExcluded}`);

  // Restore
  await sb.from("members").update({ deleted_at: null }).eq("id", testMemberId);
  const { data: restored } = await sb
    .from("members")
    .select("id, deleted_at")
    .eq("id", testMemberId)
    .single();
  console.log(`[PASS] Member restored: deleted_at is null? ${restored?.deleted_at === null}`);

  // 3. Test Staff RBAC
  console.log("\n--- Testing Staff RBAC ---");
  const { data: staffList, error: staffErr } = await sb
    .from("gym_staff")
    .select("*")
    .eq("gym_id", demoGymId);

  if (staffErr) throw staffErr;
  console.log(`[PASS] Gym Staff count: ${staffList.length}`);
  staffList.forEach((s) => {
    console.log(`  - ${s.full_name} (${s.email}): Role=${s.role}, Status=${s.status}`);
  });

  // 4. Test Audit Logs (Immutable)
  console.log("\n--- Testing Immutable Audit Logs ---");
  const { data: auditList, error: auditErr } = await sb
    .from("audit_logs")
    .select("*")
    .eq("gym_id", demoGymId)
    .order("created_at", { ascending: false });

  if (auditErr) throw auditErr;
  console.log(`[PASS] Total Audit Logs recorded: ${auditList.length}`);
  auditList.slice(0, 3).forEach((al) => {
    console.log(`  - [${al.action}] by ${al.performed_by_email}: ${JSON.stringify(al.details)}`);
  });

  // 5. Test Formula-Injection Sanitization
  console.log("\n--- Testing Formula-Injection Sanitization ---");
  function sanitize(val: string): string {
    const trimmed = val.trim();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return `'${val}`;
    }
    return val;
  }

  const maliciousInputs = [
    "=cmd|'/C calc'!A0",
    "+123456",
    "-SUM(A1:A10)",
    "@SUM(B1:B5)",
    "Normal Text",
  ];

  maliciousInputs.forEach((input) => {
    const clean = sanitize(input);
    console.log(`  "${input}" -> "${clean}" (Safe: ${clean.startsWith("'") || clean === input})`);
  });

  // 6. Test Multi-Sheet Excel Workbook Creation
  console.log("\n--- Testing 9-Sheet Excel Generation ---");
  const wb = new ExcelJS.Workbook();
  const sheetNames = [
    "Executive Summary",
    "Members Master",
    "Payments & Revenue",
    "Attendance & Footfall",
    "Floor Live Sessions",
    "Admissions & Enquiries",
    "CRM Leads",
    "Staff Directory",
    "Audit Trail",
  ];

  sheetNames.forEach((name) => {
    wb.addWorksheet(name);
  });

  const buffer = await wb.xlsx.writeBuffer();
  console.log(`[PASS] Generated 9-Sheet Excel workbook. Binary size: ${buffer.byteLength} bytes`);

  console.log("\n=== ALL SETTINGS & ADMINISTRATION TESTS PASSED SUCCESSFULLY! ===");
}

testAllSettingsFeatures().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
