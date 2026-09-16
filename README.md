# Roya Events & Adventures

Roya Events & Adventures is a full-stack web application for discovering events, booking adventures, requesting custom experiences, and managing website content.

This project uses:

- **Next.js** for the application framework and backend features
- **React** for the user interface
- **TypeScript** for safer code
- **Tailwind CSS** for styling
- **Supabase** for the database, authentication, and file storage

The project is currently in the foundation stage. The routes and application structure are ready, while the Supabase database queries, authentication, and production booking integrations will be connected next.

---

## Getting Started

### 1. Install dependencies

From the project folder, run:

```bash
npm install
```

### 2. Create the local environment file

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Add the Supabase values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never commit `.env.local` or expose the service-role key in browser code. Environment files are ignored by Git.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

### 4. Check the project before committing

```bash
npm run lint
npx tsc --noEmit
npm run build
```

`lint` checks code style and common mistakes. `tsc` checks TypeScript types. `build` confirms that Next.js can create a production build.

---

## Project Structure

```text
trueus/
├── app/                              # Next.js routes and layouts
│   ├── (customer)/                   # Public customer-facing website
│   │   ├── page.tsx                  # Home page: /
│   │   ├── layout.tsx                # Header and footer for customer pages
│   │   ├── events/                   # Public events pages
│   │   ├── adventures/               # Public adventures pages
│   │   ├── custom-event/             # Custom event request page
│   │   ├── private-adventure/        # Private adventure request page
│   │   └── contact/                  # General contact page
│   │
│   ├── admin/                        # Admin content management pages
│   │   ├── layout.tsx                # Admin navigation and admin shell
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── events/                   # Manage events
│   │   ├── adventures/               # Manage adventures
│   │   ├── bookings/                 # Review bookings
│   │   ├── inquiries/                # Review customer inquiries
│   │   └── gallery/                  # Manage gallery media
│   │
│   ├── api/                          # Server HTTP endpoints
│   │   ├── inquiries/route.ts        # Inquiry endpoint
│   │   └── webhooks/route.ts         # Future payment/provider webhooks
│   │
│   ├── layout.tsx                    # Root layout for the entire application
│   └── globals.css                   # Global Tailwind styles and CSS variables
│
├── components/                       # Reusable visual React components
│   ├── forms/                        # Forms used by customer workflows
│   ├── site/                         # Header, footer, and public site shell
│   └── ui/                           # Generic UI components
│
├── features/                         # Business areas, also called domain modules
│   ├── events/                       # Event types and event queries
│   └── adventures/                   # Adventure types and adventure queries
│
├── lib/                              # Shared application and infrastructure code
│   └── supabase/                     # Supabase client configuration
│       ├── browser.ts                # Supabase client for browser components
│       └── server.ts                 # Supabase client for server code
│
├── types/                            # Shared TypeScript types
│   └── database.ts                   # Supabase database type definitions
│
├── public/                           # Static files served from the website root
├── .env.example                      # Required environment variable template
├── package.json                      # Dependencies and npm scripts
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
└── eslint.config.mjs                 # ESLint configuration
```

---

## How Next.js Routes Work

Next.js uses the folders inside `app/` to create URLs.

| File                                             | URL                                | Purpose                   |
| ------------------------------------------------ | ---------------------------------- | ------------------------- |
| `app/(customer)/page.tsx`                        | `/`                                | Home page                 |
| `app/(customer)/events/page.tsx`                 | `/events`                          | Browse events             |
| `app/(customer)/events/[slug]/page.tsx`          | `/events/summer-festival`          | Event details             |
| `app/(customer)/events/[slug]/checkout/page.tsx` | `/events/summer-festival/checkout` | Ticket checkout           |
| `app/(customer)/adventures/page.tsx`             | `/adventures`                      | Browse adventures         |
| `app/(customer)/adventures/[slug]/page.tsx`      | `/adventures/mountain-hike`        | Adventure details         |
| `app/(customer)/adventures/[slug]/book/page.tsx` | `/adventures/mountain-hike/book`   | Booking request           |
| `app/(customer)/custom-event/page.tsx`           | `/custom-event`                    | Custom event request      |
| `app/(customer)/private-adventure/page.tsx`      | `/private-adventure`               | Private adventure request |
| `app/(customer)/contact/page.tsx`                | `/contact`                         | General inquiry           |
| `app/admin/page.tsx`                             | `/admin`                           | Admin dashboard           |
| `app/api/inquiries/route.ts`                     | `/api/inquiries`                   | Inquiry API endpoint      |

### What does `(customer)` mean?

Parentheses create a **route group**. The folder helps organize related pages and lets them share `layout.tsx`, but the word `customer` does not appear in the URL.

For example:

```text
app/(customer)/events/page.tsx
```

becomes:

```text
/events
```

### What does `[slug]` mean?

Square brackets create a dynamic route. The same page can display different records based on the URL value:

```text
/events/summer-festival
/events/autumn-market
```

Inside the page, the value is available as `params.slug`.

---

## Frontend and Backend Responsibilities

This is one Next.js application, but it has both frontend and backend responsibilities.

### Frontend

Frontend code displays pages and handles browser interaction:

- `app/(customer)/.../page.tsx` displays customer pages.
- `components/` contains reusable React components.
- Files with `"use client"` can use React state, event handlers, and browser APIs.
- `components/forms/InquiryForm.tsx` is currently a client component because it manages form state in the browser.

### Backend

Backend code runs on the server and can safely use secrets:

- Server Components fetch data before rendering a page.
- Server Actions will handle trusted form mutations.
- `app/api/**/route.ts` contains HTTP endpoints and webhook endpoints.
- `lib/supabase/server.ts` creates a Supabase client for server-side code.
- Supabase will provide the database, authentication, and storage.

Do not put database queries or secret keys inside a visual component. A component should receive data through props or call a clearly named action.

---

## Supabase Client Rules

There are different Supabase clients because browser code and server code have different security requirements.

### `lib/supabase/browser.ts`

Use this client only in a Client Component when browser interaction needs Supabase directly.

```ts
import { createClient } from "@/lib/supabase/browser";
```

The browser client may use public Supabase credentials, but it must still be protected by Row Level Security policies.

### `lib/supabase/server.ts`

Use this client in Server Components, Server Actions, and server route handlers:

```ts
import { createClient } from "@/lib/supabase/server";
```

This client can read the authenticated user's cookies and should be the default for database operations.

### Service-role access

The service-role key is more powerful than the public key. It bypasses normal Row Level Security protections. It should only be used in trusted server-only code for tasks such as administrative jobs or controlled webhooks.

Never import a service-role client into a file marked `"use client"`. Never send the service-role key to the browser.

---

## Feature Modules

The `features/` directory groups code by business capability instead of putting every file into one large technical folder.

For example, the events feature owns event-specific code:

```text
features/events/
├── types.ts       # Event TypeScript type
├── queries.ts     # Functions that read event data
├── actions.ts     # Functions that create or update events later
├── schemas.ts     # Form validation rules later
└── components/    # Event-specific components later
```

This makes it easier to answer questions such as:

- Where does event data come from? `features/events/queries.ts`
- What does an event look like? `features/events/types.ts`
- Where will event creation be implemented? `features/events/actions.ts`
- Where are event-specific cards or tables? `features/events/components/`

The same pattern should be used for:

- `features/adventures/`
- `features/bookings/`
- `features/inquiries/`
- `features/gallery/`
- `features/auth/`

Keep generic buttons, inputs, and layout components in `components/`. Keep business-specific behavior in its feature module.

---

## Current Implementation Status

### Currently available

- Public customer route structure
- Customer header and footer
- Event and adventure browsing pages
- Event and adventure detail route placeholders
- Ticket checkout route placeholder
- Adventure booking request pages
- Custom event and private adventure inquiry pages
- Contact page
- Admin dashboard and CMS navigation
- Supabase browser/server client foundation
- Typed event, adventure, and inquiry database placeholders
- Inquiry and webhook API route placeholders

### Still needs to be connected

- Supabase database migrations
- Generated database types from the real Supabase schema
- Real event and adventure queries
- Server-side form validation
- Server Actions for inquiry and booking submissions
- Supabase Auth login and logout
- Admin authorization and protected routes
- Row Level Security policies
- Supabase Storage gallery uploads
- Payment provider and webhook verification
- Automated tests

Some pages currently show empty states because the query functions intentionally return empty arrays until the database schema is created.

---

## Recommended Development Workflow

When adding a new capability, follow this order:

1. Define the database table and Row Level Security policy in Supabase.
2. Update or regenerate `types/database.ts`.
3. Add domain types, queries, validation, and actions under `features/<feature-name>/`.
4. Add reusable visual components under the feature's `components/` folder.
5. Add the route page under `app/`.
6. Add loading, error, and empty states.
7. Test anonymous, authenticated, and administrator behavior.
8. Run lint, TypeScript, and the production build.

Example for a new event field:

```text
Supabase migration
        ↓
types/database.ts
        ↓
features/events/types.ts
        ↓
features/events/queries.ts
        ↓
app/(customer)/events/[slug]/page.tsx
```

This keeps the database, backend logic, and user interface consistent.

---

## Naming Conventions

- Use **PascalCase** for React component files: `EventCard.tsx`.
- Use **camelCase** for functions and variables: `getPublishedEvents`.
- Use **kebab-case** for URL folders: `private-adventure`.
- Use **kebab-case** for utility files: `event-service.ts`.
- Use **TypeScript types** for data contracts between backend and frontend.
- Prefer descriptive names over abbreviations.
- Keep components small and focused on one responsibility.

---

## Important Security Rules

- Do not commit `.env.local`.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Validate every form on the server, even if the browser also validates it.
- Check authentication and authorization inside every Server Action and API route.
- Use Row Level Security for database protection; frontend checks alone are not security.
- Verify signatures for payment provider webhooks before changing booking or payment data.

---

## Useful Commands

```bash
npm run dev       # Start the local development server
npm run lint      # Run ESLint
npx tsc --noEmit  # Check TypeScript without creating files
npm run build     # Create a production build
npm run start     # Run the production build locally
```

The project uses the `@/*` import alias, so this:

```ts
import { PageIntro } from "@/components/ui/PageIntro";
```

is preferred over a long relative import such as:

```ts
import { PageIntro } from "../../../components/ui/PageIntro";
```
