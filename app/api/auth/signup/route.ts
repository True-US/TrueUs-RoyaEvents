import { NextResponse } from "next/server";
import { createUser } from "@/features/auth/service";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const result = await createUser({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone ?? null,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Signup failed",
      },
      { status: 400 },
    );
  }
}
