import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageIntro } from "@/components/ui/PageIntro";

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <PageIntro
        eyebrow="Contact"
        title="Let us start with a conversation."
        description="For general questions, partnerships, or help choosing an experience, send us a note."
      />
      <InquiryForm kind="contact" submitLabel="Send message" />
    </section>
  );
}
