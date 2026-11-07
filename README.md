# Roya Events & Adventures

Roya Events & Adventures is a full-stack web application for discovering events, buying event tickets, requesting adventure bookings and custom events, and managing website content.

Tech stack:

- **Next.js 16** (App Router) and **React 19** for the application and backend features
- **TypeScript** and **Tailwind CSS 4**
- **Prisma 7** with PostgreSQL (via `@prisma/adapter-pg`) for data access
- **Supabase** for authentication (email/password and password reset) and file storage (event cover images)
- **Stripe** hosted Checkout (CAD) for event tickets
- **Zod** for server-side validation

> This version of Next.js has breaking changes from older releases. Before changing framework-level code, read the relevant guide in `node_modules/next/dist/docs/` (see `AGENTS.md`).

---

## Prerequisites

- **Node.js** v24 (includes npm) - https://nodejs.org/en/download
- **Git** - https://git-scm.com/downloads
- **Visual Studio Code** (recommended) - https://code.visualstudio.com/
- A **Supabase** project and a **Stripe** account (test mode is fine)
- **Stripe CLI** (optional, for testing webhooks locally)
- **Supabase CLI** (optional, for local Supabase; `supabase/config.toml` is included)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

`postinstall` runs `prisma generate`, which creates the Prisma client in `generated/prisma`.

### 2. Create the local environment file

Create `.env.local` in the project root (environment files are ignored by Git):

```env
# Database (Prisma)
DATABASE_URL=your-pooled-postgresql-connection-string
DIRECT_URL=your-direct-postgresql-connection-string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-test-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-signing-secret

# App URL (used for Stripe redirect URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `DIRECT_URL` is used by the Prisma CLI for migrations (`prisma.config.ts`); `DATABASE_URL` is used by the running app.
- In Vercel, set `PRD_NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin. Checkout uses `NEXT_PUBLIC_APP_URL` in development and `PRD_NEXT_PUBLIC_APP_URL` otherwise.
- Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` / `STRIPE_SECRET_KEY` in browser code.

### 3. Apply database migrations

```bash
npx prisma migrate dev     # local development
npx prisma migrate deploy  # cloud / production (not run automatically on Vercel)
```

Optional seed data is in `supabase/seed-events.sql` and `supabase/seed-adventures.sql`; run them in the Supabase SQL editor.

### 4. Supabase setup

- **Storage:** create the event cover bucket (name is defined as `EVENT_COVER_BUCKET` in `features/events/constants.ts`). It is public for reads; uploads happen server-side with the service-role key.
- **Auth redirect URLs:** add `<app url>/auth/callback` to the allowed redirect URLs so password-reset emails work.

### 5. Stripe ticket checkout

Ticket payments use Stripe-hosted Checkout in CAD. Ticket inventory is reserved when checkout begins; the webhook confirms paid bookings and releases inventory when a Checkout session expires or its asynchronous payment fails. Checkout works for signed-in customers and guests.

To receive payment confirmations locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET` and restart the dev server. In production, configure a webhook endpoint at `/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Check the project before committing

```bash
npm run lint
npx tsc --noEmit
npm run build
```

---

## Project Structure

```text
├── app/                              # Next.js routes and layouts
│   ├── (customer)/                   # Public and customer-facing pages
│   │   ├── page.tsx                  # Home: /
│   │   ├── events/                   # Event list, detail, checkout, checkout success
│   │   ├── adventures/               # Adventure list, detail, booking request
│   │   ├── custom-event/             # Custom/private event request
│   │   ├── contact/                  # General inquiry
│   │   ├── search/                   # Search
│   │   ├── tickets/                  # Customer tickets
│   │   ├── dashboard/                # Customer / admin dashboard (by role)
│   │   ├── login/  signup/           # Authentication pages
│   │   └── forgot-password/  reset-password/   # Password reset flow
│   ├── admin/                        # Admin pages (events, adventures, bookings, inquiries, gallery)
│   ├── auth/callback/route.ts        # Exchanges emailed Supabase code for a session
│   ├── api/                          # HTTP endpoints
│   │   ├── auth/signup/              # Sign-up
│   │   ├── bookings/  checkout/      # Booking and Stripe Checkout creation
│   │   ├── events/  schedule/        # Event and schedule endpoints
│   │   ├── inquiries/                # Inquiry endpoint
│   │   └── webhooks/stripe/          # Stripe webhook (signature verified)
│   ├── layout.tsx  globals.css  manifest.ts
│
├── components/                       # Shared visual components
│   ├── site/                         # Header and footer
│   └── ui/                           # Generic UI (PageIntro, form feedback)
│
├── features/                         # Business modules (queries, actions, schemas, components)
│   ├── auth/                         # Login, signup, password reset, current profile
│   ├── events/                       # Event CRUD, filtering, cover images, slugs, dates
│   ├── adventures/                   # Adventure queries and cards
│   ├── bookings/                     # Ticket checkout, reservations, validation
│   └── dashboard/                    # Admin/customer dashboards, schedule, users, permissions
│
├── lib/
│   ├── stripe/server.ts              # Stripe server client
│   ├── supabase/                     # browser, server, admin (service-role) and Prisma clients
│   └── validation/                   # Shared Zod field helpers, messages, error formatting
│
├── server/                           # Shared server helpers (HTTP responses, locations)
├── prisma/                           # schema.prisma and migrations
├── generated/prisma/                 # Generated Prisma client (do not edit)
├── supabase/                         # Supabase CLI config and SQL seed files
├── types/                            # Shared TypeScript types
├── public/                           # Static assets
├── .github/workflows/                # GitHub Actions (create merge PR)
├── prisma.config.ts  next.config.ts  eslint.config.mjs  tsconfig.json
└── AGENTS.md  CLAUDE.md              # Instructions for AI coding assistants
```

---

## Routes

| Route                              | Purpose                          |
| ---------------------------------- | -------------------------------- |
| `/`                                | Home page                        |
| `/events`                          | Browse and filter events         |
| `/events/[slug]`                   | Event details                    |
| `/events/[slug]/checkout`          | Ticket checkout                  |
| `/events/[slug]/checkout/success`  | Post-payment confirmation        |
| `/adventures`, `/adventures/[slug]`| Browse adventures, details       |
| `/adventures/[slug]/book`          | Adventure booking request        |
| `/custom-event`                    | Custom event request             |
| `/contact`                         | General inquiry                  |
| `/search`                          | Search                           |
| `/tickets`, `/dashboard`           | Signed-in customer pages         |
| `/login`, `/signup`                | Authentication                   |
| `/forgot-password`, `/reset-password` | Password reset                |
| `/admin/*`                         | Admin management                 |

`(customer)` is a route group: it shares a layout but does not appear in the URL. `[slug]` is a dynamic segment.

---

## Frontend and Backend Responsibilities

- **Server Components** fetch data before rendering. Files marked `"use client"` hold browser state and event handlers.
- **Server Actions** (`features/*/actions.ts`, `features/*/server/actions.ts`) handle trusted form mutations.
- **Route handlers** (`app/api/**/route.ts`) serve HTTP endpoints and webhooks.
- Do not put database queries or secrets in visual components; pass data through props or call a named action.

## Supabase Clients

| File                      | Use                                                                 |
| ------------------------- | ------------------------------------------------------------------- |
| `lib/supabase/browser.ts` | Client Components only; public key, protected by Row Level Security |
| `lib/supabase/server.ts`  | Server Components, Server Actions, route handlers; reads user cookies |
| `lib/supabase/admin.ts`   | Service-role client for trusted server-only work (e.g. cover uploads) |
| `lib/supabase/prisma.ts`  | Prisma client for database access                                   |

Never import the admin client into a `"use client"` file.

## Data Model

Defined in `prisma/schema.prisma`: `Profile`, `Role`, `Location`, `EventAdventure` (events and adventures), and `Booking`. After changing the schema, create a migration with `npx prisma migrate dev` and regenerate the client with `npx prisma generate`.

---

## Current Implementation Status

### Available

- Public event and adventure browsing with filtering and search
- Event detail pages and Stripe-hosted ticket checkout with inventory reservation and webhook confirmation
- Adventure booking requests, custom event requests, and contact inquiries
- Supabase Auth: sign-up, login, forgot/reset password
- Customer dashboard and admin dashboard (events, bookings, schedule, users, permissions)
- Event cover image upload to Supabase Storage
- Prisma schema with migrations and SQL seed data

### Still to do

- Production Stripe credentials and webhook configuration
- Running `prisma migrate deploy` and creating the storage bucket in the cloud project
- Row Level Security policy review
- Automated tests

---

## Development Workflow

When adding a capability:

1. Update `prisma/schema.prisma` and create a migration.
2. Add types, queries, validation (Zod), and actions under `features/<feature-name>/`.
3. Add reusable components under the feature's `components/` folder.
4. Add the route under `app/`, with loading, error, and empty states.
5. Test anonymous, customer, and admin behavior.
6. Run lint, TypeScript, and the production build.

## Conventions

- **PascalCase** or **kebab-case** matching the surrounding folder for component files; **camelCase** for functions and variables; **kebab-case** for URL folders and utility files.
- Explicit types on functions, JSDoc with `@param` / `@returns`, early returns, and braces on all `if` blocks.
- Prefer types derived from Prisma over hand-written duplicates.
- Reuse the shared validation helpers in `lib/validation/`.
- Use the `@/*` import alias instead of long relative paths.

## Security Rules

- Do not commit `.env.local`.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to the browser.
- Validate every form on the server, even if the browser also validates it.
- Check authentication and authorization inside every Server Action and API route.
- Verify Stripe webhook signatures before changing booking or payment data.

## Useful Commands

```bash
npm run dev            # Start the development server
npm run lint           # Run ESLint
npx tsc --noEmit       # Type-check
npm run build          # prisma generate + production build
npm run start          # Run the production build locally
npx prisma migrate dev # Create/apply migrations locally
npx prisma generate    # Regenerate the Prisma client
```
