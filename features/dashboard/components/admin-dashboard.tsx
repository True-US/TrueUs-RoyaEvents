"use client";

import { useState } from "react";
import { ManageUsers } from "./manage-user";
import { ManagePermissions } from "./manage-permissions";
import { ManageEvents } from "./manage-events";
import { ManageSchedule } from "./manage-schedule";
import { ManageBookings } from "./manage-bookings";
import type { InitialManagedProfiles } from "../profile-management-types";
type DashboardTab =
  | "Manage User"
  | "Manage Permissions"
  | "Manage Events"
  | "Manage Schedule"
  | "Manage Bookings";

const dashboardTabs: DashboardTab[] = [
  "Manage User",
  "Manage Permissions",
  "Manage Events",
  "Manage Schedule",
  "Manage Bookings",
];

export function AdminDashboard({
  firstName,
  managedProfiles,
}: {
  firstName: string;
  managedProfiles: InitialManagedProfiles;
}) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("Manage User");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roya-sun-deep">
        Admin Dashboard
      </p>

      <h1 className="mt-3 font-display text-4xl font-bold uppercase text-roya-ink">
        Welcome, {firstName}
      </h1>

      <div className="mt-10 border-b border-roya-slate/20">
        <div
          aria-label="Dashboard sections"
          className="flex gap-2"
          role="tablist"
        >
          {dashboardTabs.map((tab) => (
            <button
              key={tab}
              aria-selected={activeTab === tab}
              className={`border-b-2 px-4 py-3 text-sm font-semibold ${
                activeTab === tab
                  ? "border-roya-sun text-roya-ink"
                  : "border-transparent text-roya-slate hover:text-roya-ink"
              }`}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "Manage User" && (
          <ManageUsers initialProfiles={managedProfiles} />
        )}

        {activeTab === "Manage Permissions" && <ManagePermissions />}

        {activeTab === "Manage Events" && <ManageEvents />}

        {activeTab === "Manage Schedule" && <ManageSchedule />}

        {activeTab === "Manage Bookings" && <ManageBookings />}
      </div>
    </section>
  );
}
