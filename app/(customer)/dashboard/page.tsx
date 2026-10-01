import { redirect } from "next/navigation";

import {
  getCurrentProfile,
  isAdminRole,
} from "@/features/auth/current-profile";
import { UserDashboard } from "@/features/dashboard/components/user-dashboard";
import { getUserDashboardBookings } from "@/features/dashboard/queries";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  console.log(profile);
  if (!profile) redirect("/login");
  if (!profile.isActive || !profile.role.isActive) redirect("/");

  const { bookings, upcomingBookings } = await getUserDashboardBookings(
    profile.id,
  );
  if (isAdminRole(profile.role.name)) {
    return <AdminDashboard firstName={profile.firstName} />;
  } else {
    return (
      <UserDashboard
        bookings={bookings}
        firstName={profile.firstName}
        upcomingBookings={upcomingBookings}
      />
    );
  }
}
