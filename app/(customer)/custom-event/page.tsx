import { CustomEventForm } from "@/features/events/components/custom-form";
import { PageIntro } from "@/components/ui/PageIntro";

export default function CustomEventPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <PageIntro
        eyebrow="Custom events"
        title="Bring us the occasion. We will shape the experience."
        description="Share your goals, group size, timing, and ideas so our team can prepare a thoughtful proposal."
      />
      <CustomEventForm kind="custom_event" submitLabel="Request a proposal" />
    </section>
  );
}
