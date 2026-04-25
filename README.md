# LogiCal

Slotting calendar for warehouse / dock / storage clerks. Live at **https://slottingcal.com**.

Clerks (grouped into an org by their email domain — everyone `@acmestorage.com` shares one calendar) create time-bound slots tagged with a company name and manage them on a Day / Week / Month calendar with the ergonomics of Google or Apple Calendar.

## Clerk dashboard

- **Calendar** with three views — Day, Week, Month — and a `Today` button. The active view persists across refreshes.
- **All-day strip** above the hour grid in Day/Week. Multi-day slots span as a single bar across covered days; in Month they render as a continuous bar across cells (rounded only on the first/last day of the span).
- **Day/Week hour grid** runs 7am–10pm, with the visible window capped to 5pm by default and scroll for later hours. A red "now" line marks the current time on today's column.
- **Calendar height matches the right column** via `ResizeObserver`, so the calendar's bottom edge always lines up with the bottom of the Find slots widget.
- **Click any day** to open a popup of that day's slots with inline edit + delete.
- **Mobile** swaps the calendar grid for an upcoming-day agenda list (multi-day slots fan out across each day they cover).

## Slot creation

- Start day + time and end day + time (single-day or multi-day).
- Optional company name and size (sqft).
- **Autocomplete from history** — both the slot label and company-name inputs surface a dropdown of the top 3 past values you've used (prefix matches first, then contains matches). Click to fill, or press Tab when there's exactly one match to commit it and move on.

## Find slots

- Live, debounced search across slot label OR company name.
- Returns the top 3 matching non-expired slots with their org, label, company, time range, and size.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- NextAuth (credentials provider, role-gated)

## Local dev

```bash
cp .env.example .env
# edit DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npm install
npx prisma db push
npm run dev
# http://localhost:3001
```

## Routes

- `/` — landing, pick customer or clerk
- `/clerk/signup`, `/clerk/signin`, `/clerk/dashboard`
- `/customer/signup`, `/customer/signin`, `/customer/dashboard`

API:

- `POST /api/register` — signup for either role
- `GET|POST /api/slots` — list / create slots (clerk-scoped)
- `PATCH|DELETE /api/slots/:id` — edit or delete a slot (org-scoped)
- `GET /api/slots/search?q=…` — search live slots by label or company (clerk-only)
- `GET /api/slots/suggestions` — distinct labels and companies the clerk has used before (powers autocomplete)
- `GET|POST /api/holds`, `PATCH|DELETE /api/holds/:id`, `GET|POST /api/holds/:id/messages` — customer hold + messaging endpoints (the visible Holds list has been removed from the clerk UI; the API remains)

## Deploy

Hosted on DigitalOcean droplet `104.248.12.129` (shared with Polinear, which runs on port 3000). LogiCal runs on port 3001 under pm2, reverse-proxied by nginx with a Let's Encrypt cert for `slottingcal.com` + `www.slottingcal.com`.

Deploy flow:

```bash
# from the droplet
cd /root/LogiCal
git pull --ff-only origin main
npx prisma db push --accept-data-loss --skip-generate
npx prisma generate
npm run build
pm2 restart logical
```
