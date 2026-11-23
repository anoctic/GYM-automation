import { NextResponse } from "next/server";
import { getGymDetails, updateGymSettings } from "@/actions/gym";

export async function GET() {
  const result = await getGymDetails();
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = await updateGymSettings(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
