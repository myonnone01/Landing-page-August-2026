import Image from "next/image";

/**
 * Sponsor billing, deliberately secondary to Presidio.
 *
 * OPTICAL SIZING — the two marks are different shapes, so they are sized to
 * neither a shared width nor a shared height. Komprise is a 200x200 stacked
 * square; Illumio is a 738x186 horizontal lockup, near 4:1.
 *
 * The sizes below come from measuring the actual ink in each file rather than
 * from their bounding boxes, which mislead: Komprise carries ~15% padding on
 * every side, so its ink is only 182x141, while Illumio's ink fills its file
 * edge to edge.
 *
 * Reference points, with Illumio at 34px:
 *   equal ink height    -> Komprise 49px   (Komprise reads clearly subordinate)
 *   equal ink bbox area -> Komprise 85px   (balanced)
 *   equal ink mass      -> Komprise 103px  (Komprise starts to dominate)
 *   equal wordmark size -> Komprise 222px  (absurd, and worth knowing why:
 *     Komprise is icon-dominant, its wordmark is 7.5% of the file height,
 *     against 49% for Illumio's. Their wordmarks cannot match without one
 *     mark swallowing the band — so overall presence is the right target.)
 *
 * 84px was picked by rendering the candidates side by side and choosing.
 *
 * TRADEMARKS — these are other companies' marks. They render as supplied: no
 * recolor, no crop, no filter, no rounding, on a plain white ground.
 * `unoptimized` keeps Next from recompressing them.
 */
type Sponsor = {
  name: string;
  href: string;
  src: string;
  /** Natural pixel dimensions of the supplied file. */
  width: number;
  height: number;
  /** Rendered height in px, chosen optically. See the note above. */
  renderHeight: number;
  /**
   * Fraction of the file's height that is empty below the ink.
   *
   * Needed for the shared baseline: `items-end` aligns file edges, not ink, so
   * a mark with bottom padding would float above its neighbour's floor.
   * Measured from the files — Komprise ends its ink 30px above its lower edge.
   */
  inkBottomInset: number;
};

const SPONSORS: Sponsor[] = [
  {
    name: "Komprise",
    href: "https://komprise.com",
    src: "/logos/komprise-logo.jpg",
    width: 200,
    height: 200,
    renderHeight: 84,
    inkBottomInset: 30 / 200,
  },
  {
    name: "Illumio",
    href: "https://illumio.com",
    src: "/logos/illumio-logo.png",
    width: 738,
    height: 186,
    renderHeight: 34,
    inkBottomInset: 0,
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

  // Pull the mark down by its own empty bottom padding so the ink — not the
  // file edge — sits on the shared baseline.
  const baselineShift = Math.round(
    sponsor.renderHeight * sponsor.inkBottomInset,
  );

  return (
    <Image
      src={sponsor.src}
      alt={`${sponsor.name} logo`}
      width={sponsor.width}
      height={sponsor.height}
      unoptimized
      style={{
        width: renderWidth,
        height: sponsor.renderHeight,
        marginBottom: -baselineShift,
      }}
    />
  );
}
