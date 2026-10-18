import { NextResponse } from "next/server";

import { signupSchema } from "@/features/auth/schemas";
import { createUser, SignupError } from "@/features/auth/service";
import { getFirstError } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed: ReturnType<typeof signupSchema.safeParse> = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: getFirstError(parsed.error, msg.invalid("Signup details")) },
      { status: 400 },
    );
  }

  try {
    const result = await createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
      data: result,
    });
  } catch (error) {
    if (error instanceof SignupError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, message: msg.unableTo("create the account") },
      { status: 500 },
    );
  }
}
