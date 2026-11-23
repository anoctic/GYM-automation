import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import ExcelJS from "exceljs";

/**
 * Formula-Injection Sanitization:
 * If a string begins with =, +, -, @, \t, or \r, prefix with an apostrophe (')
 * so spreadsheet applications (Excel, LibreOffice, Google Sheets) treat it purely as text.
 */
function sanitize(value: any): any {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return `'${value}`;
    }
    return value;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return value;
}

function computeDateFilter(range: string, startParam?: string | null, endParam?: string | null) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (range) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case "custom":
      startDate = startParam ? new Date(startParam) : new Date(0);
      endDate = endParam ? new Date(endParam) : now;
      break;
    default:
      startDate = new Date(0); // All time
      break;
  }

  return { startDate, endDate };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "all";
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    const { startDate, endDate } = computeDateFilter(range, startParam, endParam);

    const { gymId, gym } = await getTenantContext();
    const db = createAdminClient() as any;

    // Fetch all entities for this gym
    const [
      gymRes,
      plansRes,
      membersRes,
      paymentsRes,
      attendanceRes,
      admissionsRes,
      leadsRes,
      staffRes,
      auditRes,
    ] = await Promise.all([
      db.from("gyms").select("*").eq("id", gymId).single(),
      db.from("membership_plans").select("*").eq("gym_id", gymId),
      db.from("members").select("*, membership_plans(name, price)").eq("gym_id", gymId),
      db.from("payments").select("*, members(full_name, member_code)").eq("gym_id", gymId),
      db.from("attendance_logs").select("*, members(full_name, member_code)").eq("gym_id", gymId),
      db.from("admissions").select("*, membership_plans(name, price)").eq("gym_id", gymId),
      db.from("leads").select("*").eq("gym_id", gymId),
      db.from("gym_staff").select("*").eq("gym_id", gymId),
      db.from("audit_logs").select("*").eq("gym_id", gymId).order("created_at", { ascending: false }),
    ]);

    const plans = plansRes.data || [];
    const members = membersRes.data || [];
    const payments = (paymentsRes.data || []).filter((p: any) => {
      const d = new Date(p.paid_at);
      return d >= startDate && d <= endDate;
    });
    const attendance = (attendanceRes.data || []).filter((a: any) => {
      const d = new Date(a.check_in_at);
      return d >= startDate && d <= endDate;
    });
    const admissions = admissionsRes.data || [];
    const leads = leadsRes.data || [];
    const staff = staffRes.data || [];
    const auditLogs = auditRes.data || [];

    // Financial Metrics
    let totalRevenue = 0;
    let upiTotal = 0;
    let cashTotal = 0;
    let bankTotal = 0;
    payments.forEach((p: any) => {
      const amt = Number(p.amount);
      totalRevenue += amt;
      if (p.payment_method === "UPI") upiTotal += amt;
      else if (p.payment_method === "CASH") cashTotal += amt;
      else if (p.payment_method === "BANK_TRANSFER") bankTotal += amt;
    });

    let totalPendingDues = 0;
    let activeMembersCount = 0;
    members.forEach((m: any) => {
      totalPendingDues += Number(m.pending_dues || 0);
      if (m.status === "active" && !m.deleted_at) activeMembersCount++;
    });

    const activeFloorSessions = attendance.filter((a: any) => !a.check_out_at);

    // Initialize Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GymOS Cloud Edition";
    workbook.created = new Date();

    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF064E3B" }, // Dark Emerald
      },
      alignment: { vertical: "middle" as const, horizontal: "left" as const },
    };

    // ==========================================
    // SHEET 1: Executive Summary
    // ==========================================
    const s1 = workbook.addWorksheet("Executive Summary");
    s1.columns = [
      { header: "Metric", key: "metric", width: 35 },
      { header: "Value", key: "value", width: 45 },
    ];
    s1.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    [
      { metric: "Gym Name", value: sanitize(gym?.name) },
      { metric: "Gym Slug", value: sanitize(gym?.slug) },
      { metric: "Report Date Range", value: sanitize(range.toUpperCase()) },
      { metric: "Generated At (UTC)", value: new Date().toISOString() },
      { metric: "Total Revenue (₹)", value: totalRevenue },
      { metric: "UPI Collections (₹)", value: upiTotal },
      { metric: "Cash Collections (₹)", value: cashTotal },
      { metric: "Bank Transfer Collections (₹)", value: bankTotal },
      { metric: "Total Outstanding Dues (₹)", value: totalPendingDues },
      { metric: "Total Members Enrolled", value: members.length },
      { metric: "Active Members", value: activeMembersCount },
      { metric: "Current Floor Occupancy", value: activeFloorSessions.length },
      { metric: "Total Attendance Check-ins", value: attendance.length },
      { metric: "Pending Admissions Queue", value: admissions.filter((a: any) => a.status === "pending").length },
      { metric: "Total CRM Leads", value: leads.length },
      { metric: "Staff Headcount", value: staff.length },
      { metric: "Primary UPI Account", value: sanitize(gym?.upi_primary_id) },
      { metric: "Active UPI Slot", value: sanitize(gym?.default_upi_slot) },
    ].forEach((row) => s1.addRow(row));

    // ==========================================
    // SHEET 2: Members Master
    // ==========================================
    const s2 = workbook.addWorksheet("Members Master");
    s2.columns = [
      { header: "Member Code", key: "code", width: 14 },
      { header: "Full Name", key: "name", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 25 },
      { header: "Plan", key: "plan", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Join Date", key: "join_date", width: 14 },
      { header: "Expiry Date", key: "expiry_date", width: 14 },
      { header: "Pending Dues (₹)", key: "dues", width: 16 },
      { header: "Floor Sessions", key: "sessions", width: 14 },
      { header: "Soft Deleted", key: "deleted", width: 14 },
    ];
    s2.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    members.forEach((m: any) => {
      s2.addRow({
        code: sanitize(m.member_code),
        name: sanitize(m.full_name),
        phone: sanitize(m.phone),
        email: sanitize(m.email),
        plan: sanitize(m.membership_plans?.name || "Standard"),
        status: sanitize(m.status),
        join_date: sanitize(m.join_date),
        expiry_date: sanitize(m.expiry_date),
        dues: Number(m.pending_dues || 0),
        sessions: Number(m.total_sessions || 0),
        deleted: m.deleted_at ? `Yes (${m.deleted_at})` : "No",
      });
    });

    // ==========================================
    // SHEET 3: Payments & Revenue
    // ==========================================
    const s3 = workbook.addWorksheet("Payments & Revenue");
    s3.columns = [
      { header: "Receipt No", key: "receipt_no", width: 16 },
      { header: "Member Code", key: "code", width: 14 },
      { header: "Member Name", key: "name", width: 25 },
      { header: "Amount (₹)", key: "amount", width: 15 },
      { header: "Payment Method", key: "method", width: 16 },
      { header: "Paid At", key: "paid_at", width: 22 },
      { header: "Reference / UTR", key: "ref", width: 22 },
      { header: "Notes", key: "notes", width: 35 },
    ];
    s3.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    payments.forEach((p: any) => {
      s3.addRow({
        receipt_no: sanitize(p.receipt_no),
        code: sanitize(p.members?.member_code),
        name: sanitize(p.members?.full_name),
        amount: Number(p.amount),
        method: sanitize(p.payment_method),
        paid_at: sanitize(p.paid_at),
        ref: sanitize(p.reference_id),
        notes: sanitize(p.notes),
      });
    });

    // ==========================================
    // SHEET 4: Attendance & Footfall
    // ==========================================
    const s4 = workbook.addWorksheet("Attendance & Footfall");
    s4.columns = [
      { header: "Session ID", key: "id", width: 14 },
      { header: "Member Code", key: "code", width: 14 },
      { header: "Member Name", key: "name", width: 25 },
      { header: "Check In Time", key: "in", width: 22 },
      { header: "Check Out Time", key: "out", width: 22 },
      { header: "Duration (Mins)", key: "duration", width: 15 },
      { header: "Method", key: "method", width: 15 },
    ];
    s4.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    attendance.forEach((a: any) => {
      let durationMins = "";
      if (a.check_out_at) {
        const diff = Math.round((new Date(a.check_out_at).getTime() - new Date(a.check_in_at).getTime()) / 60000);
        durationMins = String(Math.max(1, diff));
      }
      s4.addRow({
        id: sanitize(a.id.slice(0, 8)),
        code: sanitize(a.members?.member_code),
        name: sanitize(a.members?.full_name),
        in: sanitize(a.check_in_at),
        out: a.check_out_at ? sanitize(a.check_out_at) : "Active on floor",
        duration: durationMins,
        method: sanitize(a.method),
      });
    });

    // ==========================================
    // SHEET 5: Floor Live Sessions
    // ==========================================
    const s5 = workbook.addWorksheet("Floor Live Sessions");
    s5.columns = [
      { header: "Member Code", key: "code", width: 14 },
      { header: "Member Name", key: "name", width: 25 },
      { header: "Check In Time", key: "in", width: 22 },
      { header: "Elapsed Minutes", key: "elapsed", width: 16 },
      { header: "Method", key: "method", width: 15 },
    ];
    s5.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    activeFloorSessions.forEach((a: any) => {
      const elapsed = Math.round((Date.now() - new Date(a.check_in_at).getTime()) / 60000);
      s5.addRow({
        code: sanitize(a.members?.member_code),
        name: sanitize(a.members?.full_name),
        in: sanitize(a.check_in_at),
        elapsed: `${elapsed} mins`,
        method: sanitize(a.method),
      });
    });

    // ==========================================
    // SHEET 6: Admissions & Enquiries
    // ==========================================
    const s6 = workbook.addWorksheet("Admissions & Enquiries");
    s6.columns = [
      { header: "Admission ID", key: "id", width: 14 },
      { header: "Applicant Name", key: "name", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 25 },
      { header: "Selected Plan", key: "plan", width: 20 },
      { header: "Status", key: "status", width: 14 },
      { header: "Submitted At", key: "date", width: 22 },
    ];
    s6.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    admissions.forEach((adm: any) => {
      s6.addRow({
        id: sanitize(adm.id.slice(0, 8)),
        name: sanitize(adm.applicant_name),
        phone: sanitize(adm.phone),
        email: sanitize(adm.email),
        plan: sanitize(adm.membership_plans?.name || "N/A"),
        status: sanitize(adm.status),
        date: sanitize(adm.submitted_at),
      });
    });

    // ==========================================
    // SHEET 7: CRM Leads
    // ==========================================
    const s7 = workbook.addWorksheet("CRM Leads");
    s7.columns = [
      { header: "Lead ID", key: "id", width: 14 },
      { header: "Name", key: "name", width: 22 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Stage", key: "stage", width: 16 },
      { header: "Notes", key: "notes", width: 40 },
      { header: "Last Updated", key: "updated", width: 22 },
    ];
    s7.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    leads.forEach((l: any) => {
      s7.addRow({
        id: sanitize(l.id.slice(0, 8)),
        name: sanitize(l.name),
        phone: sanitize(l.phone),
        stage: sanitize(l.stage),
        notes: sanitize(l.notes),
        updated: sanitize(l.updated_at),
      });
    });

    // ==========================================
    // SHEET 8: Staff Directory
    // ==========================================
    const s8 = workbook.addWorksheet("Staff Directory");
    s8.columns = [
      { header: "Staff ID", key: "id", width: 14 },
      { header: "Full Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Role", key: "role", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Created At", key: "created_at", width: 22 },
    ];
    s8.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    staff.forEach((st: any) => {
      s8.addRow({
        id: sanitize(st.id.slice(0, 8)),
        name: sanitize(st.full_name),
        email: sanitize(st.email),
        phone: sanitize(st.phone),
        role: sanitize(st.role),
        status: sanitize(st.status),
        created_at: sanitize(st.created_at),
      });
    });

    // ==========================================
    // SHEET 9: Audit Trail (Immutable)
    // ==========================================
    const s9 = workbook.addWorksheet("Audit Trail");
    s9.columns = [
      { header: "Audit ID", key: "id", width: 14 },
      { header: "Action", key: "action", width: 26 },
      { header: "Entity Type", key: "type", width: 18 },
      { header: "Entity ID", key: "entity_id", width: 18 },
      { header: "Performed By", key: "by", width: 25 },
      { header: "Details (JSON)", key: "details", width: 45 },
      { header: "Timestamp (UTC)", key: "time", width: 22 },
    ];
    s9.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    auditLogs.slice(0, 200).forEach((al: any) => {
      s9.addRow({
        id: sanitize(al.id.slice(0, 8)),
        action: sanitize(al.action),
        type: sanitize(al.entity_type),
        entity_id: sanitize(al.entity_id),
        by: sanitize(al.performed_by_email),
        details: sanitize(al.details),
        time: sanitize(al.created_at),
      });
    });

    // Generate binary buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `gymos-report-${gym?.slug || "export"}-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("[Export XLSX Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
