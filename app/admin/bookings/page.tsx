import { notFound, redirect } from "next/navigation";

import {
  getCurrentProfile,
  isAdminRole,
} from "@/features/auth/current-profile";
import { ManageBookings } from "@/features/dashboard/components/manage-bookings";

export default async function AdminBookingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (
    !profile.isActive ||
    !profile.role.isActive ||
    !isAdminRole(profile.role.name)
  ) {
    notFound();
  }

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.2em] text-roya-sun-deep">
        Operations
      </p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase text-roya-ink">
        Bookings
      </h1>
      <ManageBookings />
    </section>
  );
}
