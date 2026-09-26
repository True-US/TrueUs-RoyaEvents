import Link from "next/link";

export default async function EventCheckoutPage({
  params,
}: PageProps<"/events/[slug]/checkout">) {
  const { slug } = await params;

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.2em] text-roya-sun-deep">
        Ticket checkout
      </p>
      <h1 className="mt-4 text-4xl font-display font-bold uppercase tracking-tight text-roya-ink">
        Reserve your place
      </h1>
      <p className="mt-5 leading-7 text-roya-slate">
        Checkout integration belongs in this route. The event slug is{" "}
        <strong>{slug}</strong>.
      </p>
      <Link
        className="mt-8 inline-block text-sm font-semibold text-roya-ink underline"
        href="/contact"
      >
        Need help? Contact Roya
      </Link>
    </section>
  );
}
