import Link from "next/link";
import { notFound } from "next/navigation";

import { TicketCheckoutForm } from "@/features/bookings/components/ticket-checkout-form";
import { getCurrentProfile } from "@/features/auth/current-profile";
import { getPublicEventBySlug } from "@/features/events/server/queries";
import {
  formatEventDateLong,
  formatPrice,
  getEventState,
} from "@/features/events/utils/format";

export default async function EventCheckoutPage({
  params,
  searchParams,
}: PageProps<"/events/[slug]/checkout">) {
  const { slug } = await params;
  const [event, query] = await Promise.all([
    getPublicEventBySlug(slug),
    searchParams,
  ]);

  if (!event) {
    notFound();
  }

  const state = getEventState(event);
  const profile = await getCurrentProfile();
  const canUseProfile = profile?.isActive && profile.role.isActive;

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.2em] text-roya-sun-deep">
        Ticket checkout
      </p>
      <h1 className="mt-4 text-4xl font-display font-bold uppercase tracking-tight text-roya-ink">
        {event.title}
      </h1>
      <p className="mt-3 leading-7 text-roya-slate">
        {formatEventDateLong(event.startDatetime, event.endDatetime)}
      </p>
      <p className="mt-2 text-xl font-semibold text-roya-ink">{formatPrice(event.price)} per ticket</p>

      {state === "open" ? (
        <TicketCheckoutForm
          availableSpots={event.availableSpots}
          cancelled={query.cancelled === "1"}
          initialEmail={canUseProfile ? profile.email : ""}
          initialName={canUseProfile ? `${profile.firstName} ${profile.lastName}` : ""}
          price={event.price}
          slug={event.slug}
        />
      ) : (
        <p className="mt-8 border-l-4 border-roya-sun bg-white px-4 py-3 font-semibold text-roya-ink">
          {state === "sold-out"
            ? "This event is sold out."
            : state === "cancelled"
              ? "This event has been cancelled."
              : "This event has ended."}
        </p>
      )}

      <Link
        className="mt-8 inline-block text-sm font-semibold text-roya-ink underline"
        href={`/events/${event.slug}`}
      >
        Back to event details
      </Link>
    </section>
  );
}
