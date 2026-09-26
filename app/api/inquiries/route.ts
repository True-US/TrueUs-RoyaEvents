import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || !body.email || !body.message || !body.kind) {
    return NextResponse.json(
      { error: "Missing required inquiry fields." },
      { status: 400 },
    );
  }

  return NextResponse.json({ status: "received" }, { status: 201 });
}
