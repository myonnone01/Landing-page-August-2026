import Image from "next/image";
import { EVENT } from "@/lib/event";
import { dateLong, time } from "@/lib/format";

/**
 * Ported from the previous "Cast Off with Presidio" site: photograph of the
 * boat, Presidio billed as host above the headline, sponsors beneath it, and a
 * wave divider into the white page below.
 *
 * The one addition is the arrival callout. The brief is emphatic that everyone
 * has to be on the dock at 3:30 and that the boat leaves at 4:00 regardless, so
 * that fact gets its own band rather than being folded into a time range.
 */
/*
 * The tiles are a fixed size, but each mark is sized inside its own tile.
 * Last year both sponsors were wide lockups, so one height suited both.
 * Komprise is a square stacked mark — at Illumio's height it reads as a
 * quarter of the size. Measuring the ink in both files put the balance point
 * near a 2.4:1 height ratio, which is what these two classes are.
 */
const SPONSORS = [
  {
    name: "Komprise",
    href: "https://komprise.com",
    src: "/logos/komprise-logo.jpg",
    width: 200,
    height: 200,
    logoClass: "h-14 w-auto object-contain",
  },
  {
    name: "Illumio",
    href: "https://illumio.com",
    src: "/logos/illumio-logo.png",
    width: 738,
    height: 186,
    logoClass: "h-6 w-auto object-contain",
  },
];

export function Hero() {
  return (
    <section className="on-dark relative overflow-hidden text-white">
      {/* Fallback ground, in case the photograph is slow or missing. */}
      <div className="absolute inset-0 bg-ocean-gradient" />

      <Image
        src="/img/middlebank.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Darkened for text legibility over a bright sky. */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 via-navy-900/40 to-navy-900/70" />

      <div className="relative mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-8 flex flex-col items-center">
          <span className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-white/70">
            Hosted by
          </span>
          <div className="flex h-16 w-64 items-center justify-center rounded-md bg-white/95 p-3 shadow-lg backdrop-blur-sm">
            <Image
              src="/logos/presidio.svg"
              alt="Presidio"
              width={240}
              height={48}
              priority
              className="h-full w-auto object-contain"
            />
          </div>
        </div>

        <div className="mb-10 flex flex-col items-center">
          <span className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-white/70">
            Proudly Sponsored By
          </span>
          <ul className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            {SPONSORS.map((sponsor) => (
              <li key={sponsor.name}>
                {/* Each mark keeps its own aspect ratio inside a shared tile,
                    so neither is stretched and both sit on one baseline. */}
                {/* Opaque white, not white/95 — the Komprise file is a JPEG
                    with a baked-in white ground, which would show as a panel
                    against a translucent tile. */}
                <a
                  href={sponsor.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-20 w-52 items-center justify-center rounded-md bg-white px-4 py-3 shadow-lg transition hover:shadow-xl"
                >
                  <Image
                    src={sponsor.src}
                    alt={`${sponsor.name} logo`}
                    width={sponsor.width}
                    height={sponsor.height}
                    unoptimized
                    className={sponsor.logoClass}
                  />
                  <span className="sr-only">— opens in a new tab</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <h1
          className="font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl md:text-6xl"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
        >
          {EVENT.title}
        </h1>
        <p
          className="mt-4 max-w-2xl text-lg text-white/90 sm:text-xl"
          style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
        >
          An exclusive charter fishing experience on Long Island Sound. Join us
          for an afternoon of reeling in lines and unwinding with colleagues and
          fellow industry peers.
        </p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-black/30 px-6 py-3 text-sm font-medium ring-1 ring-white/20 backdrop-blur-sm sm:text-base">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sand-300" />
          {dateLong(EVENT.sailAt)} &middot; {time(EVENT.arriveBy)} –{" "}
          {time(EVENT.returnAt)} EDT
        </div>

        {/* The one fact nobody can afford to skim past. */}
        <p className="mt-5 max-w-xl rounded-lg bg-sand-300/95 px-5 py-3 text-sm font-semibold text-navy-900 sm:text-base">
          Please be at the dock by {time(EVENT.arriveBy)}. The boat departs at{" "}
          {time(EVENT.sailAt)}.
        </p>

        <a
          href="#register"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-sand-300 px-8 py-4 text-base font-semibold text-navy-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-sand-200 hover:shadow-2xl"
        >
          Reserve Your Spot
        </a>
      </div>

      <svg
        aria-hidden="true"
        className="relative block h-16 w-full text-white"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,48 C240,96 480,0 720,32 C960,64 1200,80 1440,32 L1440,80 L0,80 Z"
        />
      </svg>
    </section>
  );
}
