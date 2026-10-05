"use client";

import { useState } from "react";

type DashboardBooking = {
  id: number;
  eventTitle: string;
  startsAt: string;
  location: string | null;
  status: string;
  quantity: number;
  totalAmount: string;
  orderedAt: string;
};

type UserDashboardProps = {
  bookings: DashboardBooking[];
  firstName: string;
  upcomingBookings: DashboardBooking[];
};

type DashboardTab = "upcoming" | "orders";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

export function UserDashboard({
  bookings,
  firstName,
  upcomingBookings,
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("upcoming");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roya-sun-deep">
        Your account
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
          <button
            aria-controls="upcoming-events-panel"
            aria-selected={activeTab === "upcoming"}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === "upcoming"
                ? "border-roya-sun text-roya-ink"
                : "border-transparent text-roya-slate hover:text-roya-ink"
            }`}
            id="upcoming-events-tab"
            onClick={() => setActiveTab("upcoming")}
            role="tab"
            type="button"
          >
            Upcoming events
          </button>
          <button
            aria-controls="order-history-panel"
            aria-selected={activeTab === "orders"}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === "orders"
                ? "border-roya-sun text-roya-ink"
                : "border-transparent text-roya-slate hover:text-roya-ink"
            }`}
            id="order-history-tab"
            onClick={() => setActiveTab("orders")}
            role="tab"
            type="button"
          >
            Order history
          </button>
        </div>
      </div>

      {activeTab === "upcoming" ? (
        <div
          aria-labelledby="upcoming-events-tab"
          className="mt-6"
          id="upcoming-events-panel"
          role="tabpanel"
          tabIndex={0}
        >
          {upcomingBookings.length > 0 ? (
            <div className="divide-y divide-roya-slate/15 border-y border-roya-slate/15">
              {upcomingBookings.map((booking) => (
                <article
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                  key={booking.id}
                >
                  <div>
                    <p className="text-sm font-medium text-roya-sun-deep">
                      {formatDate(booking.startsAt)}
                      {booking.location ? ` · ${booking.location}` : ""}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold uppercase text-roya-ink">
                      {booking.eventTitle}
                    </h2>
                    <p className="mt-1 text-sm capitalize text-roya-slate">
                      {booking.quantity} ticket
                      {booking.quantity === 1 ? "" : "s"}
                      {" · "}
                      {formatStatus(booking.status)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="py-10 text-roya-slate">
              You have no upcoming booked events.
            </p>
          )}
        </div>
      ) : (
        <div
          aria-labelledby="order-history-tab"
          className="mt-6"
          id="order-history-panel"
          role="tabpanel"
          tabIndex={0}
        >
          {bookings.length > 0 ? (
            <div className="divide-y divide-roya-slate/15 border-y border-roya-slate/15">
              {bookings.map((booking) => (
                <article
                  className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
                  key={booking.id}
                >
                  <div>
                    <p className="text-sm text-roya-slate">
                      Order #{booking.id} · {formatDate(booking.orderedAt)}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold uppercase text-roya-ink">
                      {booking.eventTitle}
                    </h2>
                    <p className="mt-1 text-sm capitalize text-roya-slate">
                      {booking.quantity} ticket
                      {booking.quantity === 1 ? "" : "s"}
                      {" · "}
                      {formatStatus(booking.status)}
                    </p>
                  </div>
                  <p className="font-semibold text-roya-ink">
                    Total: {booking.totalAmount}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="py-10 text-roya-slate">You have no orders yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
