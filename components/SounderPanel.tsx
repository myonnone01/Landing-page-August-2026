import { EVENT } from "@/lib/event";
import { time } from "@/lib/format";

/**
 * The signature element.
 *
 * A depth-sounder readout carrying the schedule. 3:30 is the largest numeral on
 * the page because it is the one fact with consequences — the boat leaves at
 * 4:00 either way. The bottom trace is static SVG on purpose: a scrolling sonar
 * waterfall would be a gadget and would pull attention off the arrival time.
 */
export function SounderPanel() {
  return (
    <div className="on-dark overflow-hidden rounded-lg bg-sound-900 text-deck-50">
      <div className="flex items-baseline justify-between gap-4 border-b border-white/10 px-5 py-3 sm:px-8">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-deck-50/55">
          {EVENT.boat} · Tue Aug 25
        </p>
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-deck-50/55">
          Long Island Sound
        </p>
      </div>

      <div className="px-5 pt-8 sm:px-8">
        {/* The one loud thing on the page. */}
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-signal-500">
          Be at the dock by
        </p>
        <p className="mt-2 font-display text-[4.25rem] leading-[0.85] font-bold tracking-tight text-signal-500 sm:text-[6.5rem]">
          {time(EVENT.arriveBy)}
        </p>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-deck-50/80">
          The boat leaves at {time(EVENT.sailAt)} with or without you. There is
          no way to catch up to it.
        </p>

        {/* Sail and return sit deliberately quieter than the arrival time. */}
        <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-5 border-t border-white/10 pt-6">
          <div>
            <dt className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-deck-50/55">
              Lines off
            </dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-deck-50">
              {time(EVENT.sailAt)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-deck-50/55">
              Back at the dock
            </dt>
            {/* dusk-400 has exactly one job on this page: the 8:00 terminus. */}
            <dd className="mt-1 font-display text-2xl font-semibold text-dusk-400">
              {time(EVENT.returnAt)}
            </dd>
          </div>
        </dl>
      </div>

      <BottomTrace />
    </div>
  );
}

/**
 * A plausible depth profile with a reef hump and a hole, marked the way a
 * fishfinder marks returns. Decorative, so it is hidden from assistive tech.
 */
function BottomTrace() {
  return (
    <svg
      viewBox="0 0 800 130"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className="mt-8 block h-24 w-full sm:h-28"
    >
      {/* Depth gridlines, the way a sounder screen is ruled. */}
      <g stroke="currentColor" className="text-white/[0.07]" strokeWidth="1">
        {[0, 100, 200, 300, 400, 500, 600, 700].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="130" />
        ))}
        <line x1="0" y1="34" x2="800" y2="34" />
        <line x1="0" y1="68" x2="800" y2="68" />
      </g>

      {/* Sonar returns above the bottom — the arches a sounder draws for fish. */}
      <g
        stroke="currentColor"
        className="text-signal-500/70"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M148,52 q7,-8 14,0" />
        <path d="M262,40 q8,-9 16,0" />
        <path d="M300,58 q6,-7 12,0" />
        <path d="M486,74 q9,-10 18,0" />
        <path d="M604,60 q7,-8 14,0" />
      </g>

      {/* The bottom itself: filled mass under a brighter contour line. */}
      <path
        d="M0,88 C40,86 70,82 110,84 S180,94 220,86 C260,78 285,58 320,60 C358,62 392,80 430,90 C470,100 502,110 540,108 C580,106 612,96 650,92 C692,88 736,82 800,86 L800,130 L0,130 Z"
        className="fill-white/[0.09]"
      />
      <path
        d="M0,88 C40,86 70,82 110,84 S180,94 220,86 C260,78 285,58 320,60 C358,62 392,80 430,90 C470,100 502,110 540,108 C580,106 612,96 650,92 C692,88 736,82 800,86"
        fill="none"
        stroke="currentColor"
        className="text-deck-50/45"
        strokeWidth="1.5"
      />
    </svg>
  );
}
