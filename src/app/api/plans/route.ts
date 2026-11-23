import { NextResponse } from "next/server";
import { getPlans, createPlan } from "@/actions/plans";

export async function GET() {
  const result = await getPlans();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createPlan(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
