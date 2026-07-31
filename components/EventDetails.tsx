import { CalendarIcon, ClockIcon, MapPinIcon } from "@/components/icons";
import { EVENT } from "@/lib/event";
import { dateLong, time } from "@/lib/format";

export function EventDetails() {
  const details = [
    {
      Icon: CalendarIcon,
      label: "Date",
      value: dateLong(EVENT.sailAt),
    },
    {
      Icon: ClockIcon,
      label: "Time",
      value: `${time(EVENT.arriveBy)} – ${time(EVENT.returnAt)} EDT`,
      note: `Dock by ${time(EVENT.arriveBy)}, sails ${time(EVENT.sailAt)}`,
    },
    {
      Icon: MapPinIcon,
      label: "Location",
      value: `${EVENT.venue}, ${EVENT.city}, ${EVENT.state}`,
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {details.map(({ Icon, label, value, note }) => (
            <div
              key={label}
              className="flex items-start gap-4 rounded-2xl border border-navy-100 bg-sand-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-ocean-500 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-ocean-700 uppercase">
                  {label}
                </p>
                <p className="mt-1 text-lg font-semibold text-navy-800">
                  {value}
                </p>
                {note && (
                  <p className="mt-1 text-sm text-navy-600">{note}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-navy-800 sm:text-4xl">
            A Day on the Water, Reimagined
          </h2>
          <p className="mt-4 text-base leading-relaxed text-navy-600 sm:text-lg">
            Trade the conference room for the open sound. {EVENT.host} invites
            you aboard {EVENT.boat}, professionally captained by{" "}
            {EVENT.operator}, for an afternoon of light-tackle fishing, fresh sea
            air, and relaxed conversation with industry peers.{" "}
            {EVENT.provided}
            {" are provided — no experience needed."}
          </p>
        </div>
      </div>
    </section>
  );
}
