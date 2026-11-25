/**
 * Collision-safe sequential generators for member codes and receipt numbers.
 * Reads existing prefixes instead of raw count(*) so deleted records never cause duplicate key errors.
 */
export async function allocateNextMemberCode(
  db: any,
  gymId: string,
  prefix: string = "FP"
): Promise<string> {
  const { data } = await db
    .from("members")
    .select("member_code")
    .eq("gym_id", gymId);

  let maxNum = 100;
  const regex = new RegExp(`^${prefix}-(\\d+)$`, "i");
  for (const row of data || []) {
    const match = typeof row.member_code === "string" ? row.member_code.match(regex) : null;
    if (match) {
      const n = parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }

  return `${prefix}-${maxNum + 1}`;
}

export async function allocateNextReceiptNo(db: any, gymId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await db
    .from("payments")
    .select("receipt_no")
    .eq("gym_id", gymId)
    .ilike("receipt_no", `RCP-${year}-%`);

  let maxSeq = 0;
  const regex = new RegExp(`^RCP-${year}-(\\d+)$`, "i");
  for (const row of data || []) {
    const match = typeof row.receipt_no === "string" ? row.receipt_no.match(regex) : null;
    if (match) {
      const n = parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxSeq) {
        maxSeq = n;
      }
    }
  }

  return `RCP-${year}-${String(maxSeq + 1).padStart(3, "0")}`;
}
