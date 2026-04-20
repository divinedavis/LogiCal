# LogiCal

Logistics calendar for customers to request and hold warehouse slots. Two-sided web app: customers place holds, clerks (grouped by email domain into an org) accept, decline, reschedule, and message back.

## Sides

- **Customer** — sign up / sign in, pick a facility and slot, drag a date range on a calendar, place a multi-day hold (overlap allowed, no max length), chat with the clerk.
- **Clerk** — sign up / sign in on a separate page. Clerks are grouped into an org by their email domain (e.g. everyone at `@acmestorage.com` sees the same calendar). Manage slots, accept / decline / reschedule customer holds, message customers.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- NextAuth (credentials provider, role-gated)
- Poll-based messaging (4s) — can be swapped to Socket.IO later

## Local dev

```bash
cp .env.example .env
# edit DATABASE_URL and NEXTAUTH_SECRET
npm install
npx prisma db push
npm run dev
# http://localhost:3001
```

## Routes

- `/` — landing, pick customer or clerk
- `/customer/signup`, `/customer/signin`, `/customer/dashboard`
- `/clerk/signup`, `/clerk/signin`, `/clerk/dashboard`
- `POST /api/register` — signup for either role
- `GET|POST /api/slots` — list / create slots (clerk)
- `GET|POST /api/holds` — list / create holds
- `PATCH|DELETE /api/holds/:id` — update status or reschedule / cancel
- `GET|POST /api/holds/:id/messages` — thread messages between customer and clerk

## Deploy

Hosted on DigitalOcean droplet `104.248.12.129` (shared with Polinear, which runs on port 3000). LogiCal runs on port 3001 under pm2, reverse-proxied by nginx. See `deploy/` for server config.
