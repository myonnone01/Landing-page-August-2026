import Image from "next/image";

/**
 * Sponsor billing, deliberately secondary to Presidio.
 *
 * OPTICAL SIZING — the two marks are different shapes, so they are not sized to
 * a shared width or a shared height. Komprise is a 200x200 stacked square;
 * Illumio is a 738x186 horizontal lockup, near 4:1. Matching heights would give
 * Illumio roughly four times the area; matching widths would tower Komprise.
 * These heights sit between equal-height and equal-area, leaning toward equal
 * area, which is what actually reads as balanced. They align on a shared
 * baseline via `items-end`.
 *
 * TRADEMARKS — these are other companies' marks. They render as supplied: no
 * recolor, no crop, no filter, no rounding, on a plain white ground. `unoptimized`
 * keeps Next from recompressing them.
 */
type Sponsor = {
  name: string;
  href: string;
  /**
   * Drop the supplied file into `public/logos/` and set `src` to its path to
   * swap the placeholder for the real mark. Files were not included in the
   * brief's `./logos/` directory, so both are placeholders for now.
   */
  src: string | null;
  /** Natural pixel dimensions of the supplied file. */
  width: number;
  height: number;
  /** Rendered height in px, chosen optically. See the note above. */
  renderHeight: number;
};

const SPONSORS: Sponsor[] = [
  {
    name: "Komprise",
    href: "https://komprise.com",
    src: null, // -> "/logos/komprise-logo.jpg"
    width: 200,
    height: 200,
    renderHeight: 64,
  },
  {
    name: "Illumio",
    href: "https://illumio.com",
    src: null, // -> "/logos/illumio-logo.png"
    width: 738,
    height: 186,
    renderHeight: 36,
  },
];

export function SponsorBand() {
  return (
    <section
      aria-labelledby="sponsors-heading"
      className="border-t border-shoal-400/25 py-14"
    >
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-[8rem_minmax(0,1fr)]">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-shoal-400">
          Sponsors
        </p>

        <div>
          <h2
            id="sponsors-heading"
            className="font-sans text-[0.95rem] text-sound-500"
          >
            Along for the ride,
          </h2>

          {/* White ground so purple, green and orange sit quietly and don't
              pull the page palette around. */}
          <ul className="mt-5 flex flex-wrap items-end gap-x-14 gap-y-8 rounded-lg bg-white px-7 py-8 ring-1 ring-shoal-400/15">
            {SPONSORS.map((sponsor) => (
              <li key={sponsor.name} className="flex items-end">
                <a
                  href={sponsor.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-sm transition-opacity hover:opacity-70"
                >
                  <SponsorMark sponsor={sponsor} />
                  <span className="sr-only">
                    {sponsor.name} — opens in a new tab
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SponsorMark({ sponsor }: { sponsor: Sponsor }) {
  const renderWidth = Math.round(
    sponsor.renderHeight * (sponsor.width / sponsor.height),
  );

  if (!sponsor.src) {
    return (
      <span
        style={{ width: renderWidth, height: sponsor.renderHeight }}
        className="flex items-center justify-center border border-dashed border-shoal-400/50 text-center font-mono text-[0.6rem] uppercase tracking-[0.14em] text-shoal-400"
      >
        {sponsor.name}
      </span>
    );
  }

  return (
    <Image
      src={sponsor.src}
      alt={`${sponsor.name} logo`}
      width={sponsor.width}
      height={sponsor.height}
      unoptimized
      style={{ width: renderWidth, height: sponsor.renderHeight }}
    />
  );
}
