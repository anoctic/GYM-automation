import { NextResponse } from "next/server";
import { getAdmissions, submitAdmission } from "@/actions/admissions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";
  const result = await getAdmissions(status);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gym_id, ...rest } = body;
    if (!gym_id) {
      return NextResponse.json({ error: "gym_id is required" }, { status: 400 });
    }
    const result = await submitAdmission(gym_id, rest);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
