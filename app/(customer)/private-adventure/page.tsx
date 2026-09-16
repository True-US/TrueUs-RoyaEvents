import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageIntro } from "@/components/ui/PageIntro";

export default function PrivateAdventurePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <PageIntro
        eyebrow="Private adventures"
        title="A route made for your group."
        description="Tell us who is coming, when you would like to go, and what would make the day feel right."
      />
      <InquiryForm
        kind="private_adventure"
        submitLabel="Send private adventure request"
      />
    </section>
  );
}
