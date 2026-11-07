import Image from "next/image";
import Link from "next/link";

type HeroScene = {
  src: string;
  label: string;
  caption: string;
};

/** Placeholder illustrations; swap in final photos (e.g. celebration.jpg) in /public/hero/. */
const scenes: HeroScene[] = [
  {
    src: "/hero/celebration.svg",
    label: "Events",
    caption: "Weddings & celebrations",
  },
  {
    src: "/hero/rockies.svg",
    label: "Adventures",
    caption: "Canadian Rockies",
  },
  {
    src: "/hero/live-music.svg",
    label: "Public events",
    caption: "Live music & DJ nights",
  },
];

/**
 * Homepage hero: three crossfading background scenes driven entirely by CSS
 * animation (see the .hero-* rules in globals.css).
 * @returns The hero section.
 */
export default function HomeHero(): React.JSX.Element {
  return (
    <section className="hero">
      {scenes.map((scene: HeroScene, index: number) => (
        <div
          aria-hidden="true"
          className="hero-slide"
          data-scene={index}
          key={scene.src}
        >
          <Image
            alt=""
            className="object-cover"
            fill
            priority={index === 0}
            sizes="100vw"
            src={scene.src}
          />
        </div>
      ))}
      <div aria-hidden="true" className="hero-overlay" />
      <svg
        aria-hidden="true"
        className="hero-edge"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 1600 60"
      >
        <path d="M0 60 L0 44 L240 20 L420 42 L640 8 L860 40 L1080 16 L1300 44 L1600 22 L1600 60 Z" />
      </svg>

      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-6xl items-center px-6 pb-[150px] pt-12 sm:px-10 md:h-full md:min-h-0 md:py-0">
        <div className="max-w-3xl md:pb-10">
          <p className="mb-5 font-display text-base font-semibold uppercase tracking-[0.18em] text-roya-sun sm:text-lg sm:tracking-[0.25em]">
            Roya Events &amp; Adventures · Alberta
          </p>
          <h1 className="font-display text-[56px] font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-8xl">
            Create.<br className="sm:hidden" /> Celebrate.
            <br />
            Explore<span className="text-roya-sun">.</span>
          </h1>
          <p className="mt-7 max-w-[540px] text-lg leading-8 text-white/90">
            From unforgettable celebrations to extraordinary Alberta
            adventures, Roya Events &amp; Adventures creates experiences
            designed around you.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              className="rounded-full bg-roya-sun px-6 py-3 text-center font-semibold text-roya-ink hover:bg-white"
              href="/custom-event"
            >
              Plan an Event
            </Link>
            <Link
              className="rounded-full border border-white/60 px-6 py-3 text-center font-semibold text-white hover:border-roya-sun hover:text-roya-sun"
              href="/adventures"
            >
              Explore Adventures
            </Link>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="hero-scene absolute inset-x-0 bottom-[76px] z-10 mx-auto max-w-6xl px-6 sm:px-10"
      >
        <div className="hero-scene-box">
          <div className="hero-captions">
            {scenes.map((scene: HeroScene, index: number) => (
              <div
                className="hero-caption"
                data-scene={index}
                key={scene.src}
              >
                <p className="font-display text-base font-semibold uppercase tracking-[0.25em] text-roya-sun">
                  {scene.label}
                </p>
                <p className="text-sm text-white">{scene.caption}</p>
              </div>
            ))}
          </div>
          <div className="hero-bars">
            {scenes.map((scene: HeroScene, index: number) => (
              <span className="hero-bar" data-scene={index} key={scene.src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
