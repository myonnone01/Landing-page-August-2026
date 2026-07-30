import { ExternalLinkIcon, MapPinIcon } from "@/components/icons";
import { EVENT, FULL_ADDRESS } from "@/lib/event";
import { time } from "@/lib/format";

export function LocationMap() {
  const mapsLink =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(FULL_ADDRESS);
  const embedSrc =
    "https://www.google.com/maps?q=" +
    encodeURIComponent(FULL_ADDRESS) +
    "&output=embed";

  return (
    <section className="bg-navy-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-ocean-600 uppercase">
            Where to Meet Us
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-navy-800 sm:text-4xl">
            {EVENT.venue}, {EVENT.city}
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lg">
          <div className="aspect-video w-full">
            <iframe
              title={`Map of ${EVENT.venue}, ${EVENT.city} ${EVENT.state}`}
              src={embedSrc}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="flex flex-col items-start justify-between gap-4 border-t border-navy-100 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <MapPinIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-ocean-600" />
              <div>
                <p className="font-semibold text-navy-800">{EVENT.venue}</p>
                <p className="text-sm text-navy-600">
                  {EVENT.street}, {EVENT.city}, {EVENT.state} {EVENT.zip}
                </p>
              </div>
            </div>
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ocean-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-700"
            >
              Get Directions
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-navy-600">
          Leave time to park and find the dock. Being on time here means{" "}
          {time(EVENT.arriveBy)}, not {time(EVENT.sailAt)}.
        </p>
      </div>
    </section>
  );
}
