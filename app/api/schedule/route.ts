import { NextResponse } from "next/server";

import { msg } from "@/lib/validation/messages";

import { getCurrentProfile, isAdminRole } from "@/features/auth/current-profile";
import { getAdminScheduleItems } from "@/features/dashboard/queries";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !profile.isActive || !profile.role.isActive || !isAdminRole(profile.role.name)) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const items = await getAdminScheduleItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get admin schedule error:", error);
    return NextResponse.json(
      { message: msg.unableTo("load the schedule") },
      { status: 500 },
    );
  }
}
