import { redirect } from "next/navigation";

import {
  getCurrentProfile,
  isAdminRole,
} from "@/features/auth/current-profile";
import { UserDashboard } from "@/features/dashboard/components/user-dashboard";
import {
  getInitialManagedProfiles,
  getUserDashboardBookings,
} from "@/features/dashboard/queries";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  console.log(profile);
  if (!profile) redirect("/login");
  if (!profile.isActive || !profile.role.isActive) redirect("/");

  if (isAdminRole(profile.role.name)) {
    const managedProfiles = await getInitialManagedProfiles();
    return (
      <AdminDashboard
        firstName={profile.firstName}
        managedProfiles={managedProfiles}
      />
    );
  } else {
    const { bookings, upcomingBookings } = await getUserDashboardBookings(
      profile.id,
    );
    return (
      <UserDashboard
        bookings={bookings}
        firstName={profile.firstName}
        upcomingBookings={upcomingBookings}
      />
    );
  }
}
