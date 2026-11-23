import { NextResponse } from "next/server";
import { getActiveFloorMembers, checkInMember } from "@/actions/attendance";

export async function GET() {
  const result = await getActiveFloorMembers();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { member_id, method } = body;
    if (!member_id) {
      return NextResponse.json({ error: "member_id is required" }, { status: 400 });
    }
    const result = await checkInMember(member_id, method);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
