# Presidio × Middlebank charter

A one-page event site for a private charter fishing trip Presidio is hosting for
customers, with a registration form and a passcode-gated roster at `/admin`.

- **Boat:** The Middlebank, Middlebank Sport Fishing
- **Where:** Captain's Cove Seaport, 1 Bostwick Ave, Bridgeport, CT 06605
- **When:** Tuesday, August 25 2026 — at the dock by 3:30 PM, sails 4:00 PM, back by 8:00 PM
- **RSVP closes:** end of day Friday, August 14 2026

No email sending, no notifications, no third-party integrations. The whole
system is this app and one Postgres database.

---

## Before you send anyone the URL

| What | Where | Status |
| --- | --- | --- |
| Host mobile number | `lib/event.ts` → `EVENT.contact.mobile` | Set to `(203) 450-7593`. |
| Host name and email | `lib/event.ts` → `EVENT.contact` | Defaulted to Mike Yonnone / mike.yonnone@gmail.com. Swap for a Presidio address if that should carry the invitation. |
| Sponsor logos | `public/logos/` | Both in place. |

---

## Run it locally

Requires Node 20+.

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and ADMIN_SESSION_SECRET
npm run db:migrate        # create the tables
npm run db:seed           # optional: five obviously-fake registrations
npm run dev
```

Then open **http://localhost:3000** and **http://localhost:3000/admin**.

### Getting a database

The app needs Postgres in both dev and production. SQLite is not an option:
Vercel's filesystem is ephemeral and per-invocation, so a registration written
by one request would vanish for the next.

**Neon (what production uses).** Create a free project at
[console.neon.tech](https://console.neon.tech), then copy the **pooled**
connection string — the host contains `-pooler` — from *Connection Details* into
`DATABASE_URL`. Create a second Neon **branch** for local development so test
rows never land in the real roster.

**Local Postgres,** if you'd rather not touch the network:

```bash
createdb middlebank
# DATABASE_URL="postgresql://localhost:5432/middlebank"
```

### Generating the session secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Environment variables

All four are required. `.env` is gitignored; `.env.example` is the committed
template.

| Variable | What it does | Where its value comes from |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | Neon console → your project → *Connection Details* → pooled connection string. Locally, your own Postgres. |
| `ADMIN_PASSCODE` | The passcode for `/admin` | You choose it. The one from the brief is set in `.env` locally; it is deliberately not written down here or in `.env.example`. |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie | Generate with the command above. Changing it signs out anyone currently in `/admin`. |
| `EVENT_CAPACITY` | Total seats, counting hosts | The boat's capacity. Currently `50`. |

---

## Changing the capacity

`EVENT_CAPACITY` counts **people, not registrations** — a registrant bringing a
guest uses two seats.

- **Locally:** edit `EVENT_CAPACITY` in `.env` and restart `npm run dev`.
- **In production:** Vercel → your project → *Settings* → *Environment
  Variables* → edit `EVENT_CAPACITY` → **redeploy**. Vercel does not pick up
  env changes without a new deployment.

Lowering it below the current headcount does not bump anyone. Existing
registrations keep their confirmed status; the page simply shows no spots left
and new signups go to the waitlist.

## Changing the passcode

Same two places: `ADMIN_PASSCODE` in `.env` locally, and Vercel's environment
variables plus a redeploy in production. Everyone currently signed in keeps
their session for up to 12 hours — to cut those off immediately, change
`ADMIN_SESSION_SECRET` at the same time.

### How weak this is, plainly

It is one shared string. Specifically:

- **No identity.** The roster holds every registrant's email and mobile number.
  A shared passcode cannot tell you *who* looked at it, and there is no audit
  trail.
- **It leaks permanently.** Forwarded once in a Slack message or a text, it is
  out, and it keeps working until you change it and redeploy. You will not know
  it happened.
- **The current passcode is a guessable shape.** A company name plus `123` is
  exactly what a credential-guessing list tries first.

What is actually in place: the passcode is compared in constant time, never
stored in the repo, exchanged for an HMAC-signed `httpOnly` cookie, and the form
is rate-limited to 8 attempts per 15 minutes per IP, which is what stops online
brute force. `/admin` is unlinked and `noindex`.

**If you do nothing else, change the passcode to a random phrase** (four or five
unrelated words). That removes the only genuinely cheap attack and costs you
nothing but a redeploy.

Better options, with honest effort estimates:

| Option | Effort | What it buys |
| --- | --- | --- |
| Random passphrase instead of the current one | 2 minutes | Kills guessing. Still shared, still no identity. |
| A distinct passcode per person who needs access | ~1 hour | You can tell who looked, and revoke one person without disrupting others. Still a shared-secret model. |
| Email magic links | ~half a day, no new vendor if you allow-list addresses | Real identity per viewer, revocable, nothing to leak permanently. Needs an email sender, which the brief ruled out. |
| Google sign-in restricted to your Presidio domain | ~half a day plus an OAuth client | Proper identity, no passwords, no new vendor beyond Google. Heaviest option, and overkill for a roster that stops mattering on August 25. |

My recommendation for a roster with a three-week lifespan: random passphrase,
and delete the deployment after the trip. The data stops being worth protecting
once the boat is back at the dock.

---

## Exporting the roster on the morning of the event

1. Go to `https://<your-domain>/admin` and enter the passcode.
2. Check the header: **Headcount** is the number to give the captain — it counts
   guests. **Registrations** is lower, because some people bring one.
3. Click **Download CSV**. It saves as
   `middlebank-roster-YYYY-MM-DD.csv`, opens directly in Excel or Numbers, and
   contains every field including the waitlist column.
4. Click **Copy 12 emails** (the count reflects what's currently shown) to get a
   comma-separated list for a final note to everyone.

Two things worth knowing before you rely on it:

- **The CSV exports what is currently filtered.** If you have typed something
  into the search box, you export only matching rows. Clear the search first.
- **Sort by name** before printing — the default is newest-first, which is not
  the order you want when checking people in at the dock.

For dietary needs, the **Dietary flags** stat counts registrations with anything
in that field; the values are in the `Dietary` column of the CSV.

---

## Deploying to Vercel

1. **Push the branch.** This work is on `claude/presidio-middlebank-event-site-52kwrz`.
2. **Import the repo.** [vercel.com/new](https://vercel.com/new) → select this
   repository. Vercel detects Next.js; no build settings to change.
3. **Create the database.** In the Vercel project → *Storage* → *Create
   Database* → **Neon Postgres**. Vercel sets `DATABASE_URL` for you. (Or create
   it at Neon directly and paste the pooled string in yourself.)
4. **Add the other three variables.** *Settings* → *Environment Variables*, for
   Production and Preview:
   - `ADMIN_PASSCODE`
   - `ADMIN_SESSION_SECRET` (generate a fresh one — do not reuse the local value)
   - `EVENT_CAPACITY`
5. **Deploy.**
6. **Create the tables.** The schema is not applied automatically. Run it once
   against the production database from your machine:
   ```bash
   DATABASE_URL="<production pooled string>" npm run db:migrate
   ```
7. **Check it.** Visit `/`, submit one real registration, confirm it appears at
   `/admin`, then delete it with the row's **Delete** button.
8. **Do not seed production.** `npm run db:seed` is for development.

### After the trip

Delete the Vercel project and the Neon database. That removes every registrant's
contact details, which is the cleanest way to stop holding them.

---

## Sponsor logos

Komprise and Illumio are sponsors, styled as a secondary band rather than
co-host billing. Both files live in `public/logos/`, and the sizing lives in
`components/SponsorBand.tsx`.

**Why the two logos are deliberately different heights.** Komprise is a 200×200
stacked square; Illumio is a 738×186 horizontal lockup, close to 4:1. Sized to a
shared height, Illumio gets roughly four times the area; sized to a shared
width, Komprise towers. So they are sized by measured ink instead — the file
bounding boxes mislead, because Komprise carries about 15% padding on every side
(its ink is only 182×141) while Illumio's ink runs to its file edges.

With Illumio at 34px, the reference points are:

| Target | Komprise | Reads as |
| --- | --- | --- |
| Equal ink height | 49px | Komprise clearly subordinate |
| **Equal ink bbox area** | **85px** | **balanced — what's used (84px)** |
| Equal ink mass | 103px | Komprise starts to dominate |
| Equal wordmark size | 222px | absurd |

That last row is worth understanding before anyone "fixes" the sizes: Komprise
is an icon-dominant mark whose wordmark is only 7.5% of its file height, against
49% for Illumio's. The two wordmarks cannot be made the same size without one
mark swallowing the band, so overall presence is the right target, not type size.
The final 84px was chosen by rendering the candidates side by side and looking.

They align on a shared **ink** baseline, not a shared file edge — Komprise is
pulled down by its own bottom padding (`inkBottomInset`), because otherwise it
floats about 13px above Illumio's floor.

Both marks render exactly as supplied — no recolor, crop, filter or rounding, on
a plain white ground, with Next's image optimizer disabled so nothing
recompresses them. Komprise is a JPEG with a white background, which is part of
why the band is white: it blends invisibly. They belong to other companies;
please keep it that way if you adjust this section.

---

## Editing event details

Everything factual lives in **`lib/event.ts`** — times, address, boat name, the
RSVP deadline and its label, host contact details, sponsor URLs. Page copy, the
`.ics` file and the admin header all read from it, so a detail only needs
changing in one place.

Times are stored as ISO strings with an explicit `-04:00` offset (Eastern
Daylight Time, which is what late August is) and rendered through
`Intl.DateTimeFormat` pinned to `America/New_York`, so the boat sails on Eastern
time no matter where the server or the reader sits.

> **Note on the RSVP date.** The brief said "Friday, August 15", but August 15
> 2026 is a Saturday. Confirmed as **Friday, August 14**, which is what the code
> uses. Registration closes at midnight Eastern as Friday ends.

---

## How it works

```
app/
  page.tsx                  the public page (dynamic — "spots left" must be live)
  layout.tsx                fonts, metadata, site-wide noindex
  api/register/route.ts     POST: validate, rate-limit, persist
  api/calendar/route.ts     GET: the .ics download
  admin/page.tsx            passcode gate or roster
  admin/actions.ts          sign in / out, delete a row
components/
  SounderPanel.tsx          the depth-sounder schedule panel
  RegistrationForm.tsx      form, waitlist, closed and confirmation states
  SponsorBand.tsx           sponsor logos
  admin/                    PasscodeGate, Roster
lib/
  event.ts                  every fact about the trip; capacity from the env
  registration-schema.ts    the one zod schema the server validates against
  registrations.ts          queries
  rate-limit.ts             Postgres sliding window
  admin-auth.ts             passcode check and signed session cookie
  db.ts, format.ts
db/schema.sql               the tables
scripts/                    migrate.ts, seed.ts
```

### Things that are the way they are for a reason

**Capacity is decided inside a transaction behind an advisory lock.** Two people
submitting at the same instant cannot both claim the last seat. A party of two
never splits across the capacity line — if both seats don't fit, the party
waits.

**Duplicate emails are rejected case-insensitively**, via a unique index on
`lower(email)`, so `Bob@x.com` cannot double-book against `bob@x.com`.

**Rate limiting lives in Postgres, not memory.** On serverless, every cold start
is a fresh process, so in-memory counters are trivially bypassed. Redis would
work but is a second vendor for one table's worth of state. IPs are stored only
as a salted hash.

**The `.ics` starts at 3:30, not 4:00.** What belongs on a calendar is when to
be standing on the dock. It's a plain download — no invite, no email, nothing
sent on the registrant's behalf.

**CSV values starting with `=`, `+`, `-` or `@` get a leading apostrophe**, so a
notes field can't execute as a formula when the file opens in Excel.

### Privacy

Registrant details live in the database and the CSV export, and nowhere else.
Failures log the error, never the submission. The site sends `noindex`
everywhere and `/admin` is unlinked. Seed rows all use `example.com` addresses
and `555` numbers so they're unmistakable if they ever reach a real database.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply `db/schema.sql` (safe to re-run) |
| `npm run db:seed` | Add five fake registrations |
| `npm run db:seed -- --reset` | Wipe the table first, then seed |

## Dependencies

Next, React, Tailwind, and two runtime additions: **`pg`** (Postgres driver) and
**`zod`** (the shared validation schema). No CMS, no auth provider, no email
service, no component library.
