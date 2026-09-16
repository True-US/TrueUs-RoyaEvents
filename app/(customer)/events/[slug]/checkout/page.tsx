import Link from "next/link";

export default async function EventCheckoutPage({
  params,
}: PageProps<"/events/[slug]/checkout">) {
  const { slug } = await params;

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-700">
        Ticket checkout
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
        Reserve your place
      </h1>
      <p className="mt-5 leading-7 text-slate-600">
        Checkout integration belongs in this route. The event slug is{" "}
        <strong>{slug}</strong>.
      </p>
      <Link
        className="mt-8 inline-block text-sm font-semibold text-slate-950 underline"
        href="/contact"
      >
        Need help? Contact Roya
      </Link>
    </section>
  );
}
