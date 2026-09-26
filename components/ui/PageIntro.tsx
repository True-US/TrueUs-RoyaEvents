type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <div className="max-w-2xl">
      <p className="font-display text-base font-semibold uppercase tracking-[0.25em] text-roya-sun-deep">
        {eyebrow}
      </p>
      <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-none tracking-tight text-roya-ink sm:text-6xl">
        {title}
      </h1>
      <p className="mt-5 text-lg leading-8 text-roya-slate">{description}</p>
    </div>
  );
}
