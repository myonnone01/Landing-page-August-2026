import { EVENT } from "@/lib/event";

export function Footer() {
  return (
    <footer className="bg-navy-900 py-10 text-center text-sm text-navy-100">
      <div className="mx-auto max-w-5xl px-6">
        <p className="font-semibold tracking-[0.2em] text-sand-200 uppercase">
          Presented by {EVENT.host}
        </p>
        <p className="mt-4 text-navy-200">
          Questions, or something came up? Text or email {EVENT.contact.name}.
        </p>
        <p className="mt-2">
          <a
            href={`mailto:${EVENT.contact.email}`}
            className="text-sand-200 underline underline-offset-4 hover:text-white"
          >
            {EVENT.contact.email}
          </a>
          <span className="px-2 text-navy-300">·</span>
          <a
            href={`sms:${EVENT.contact.mobile.replace(/[^\d+]/g, "")}`}
            className="text-sand-200 underline underline-offset-4 hover:text-white"
          >
            {EVENT.contact.mobile}
          </a>
        </p>
      </div>
    </footer>
  );
}
