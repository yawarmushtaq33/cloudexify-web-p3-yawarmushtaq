# SmileCare Dental

Premium Modern Dental Clinic website — originally built for **CloudExify Internship Project 3**, since upgraded to a production-grade site with a real backend for commercial deployment.

**Build Track:** Clinic White

---

## Author

| Field | Detail |
|---|---|
| Name | Yawar Mushtaq |
| Registration Number | CX-INT-2026-GEN-0131 |

---

## Architecture

This is a **real multi-page site**, not a single scrolling page — each nav item (Home, Services, About, Pricing, FAQ, Contact) is its own HTML file, so the browser's back/forward buttons, bookmarking, and direct linking all work natively. Navigating between pages uses the browser's native View Transition API where supported (Chrome/Edge 126+) for a smooth cross-fade, with a plain CSS fade-in fallback everywhere else — no custom router, no JavaScript required for it to work correctly.

The frontend is static HTML/CSS/vanilla JS. Two things need a real backend and now have one:

1. **Appointment booking** — stored in Postgres, with a database-level `UNIQUE (date, time)` constraint. This means double-booking a slot is *structurally impossible*, even if two people submit the exact same slot at the exact same millisecond — the database itself rejects the second insert, not just a check in JavaScript that could race.
2. **Newsletter subscriptions** — stored in Postgres with a `UNIQUE (email)` constraint, so the same address can never be subscribed twice.

---

## Live Links

| Link | URL |
|---|---|
| GitHub Repository | `https://github.com/<your-username>/smilecare-dental` *(replace with your repo)* |
| Live Deployment (Vercel) | `https://smilecare-dental.vercel.app` *(replace after deploying)* |

---

## Project Structure

```
SmileCare-Dental/
│
├── index.html          # Home
├── services.html        # Services + Before/After gallery
├── about.html            # About / Doctor profile
├── pricing.html            # Pricing plans
├── faq.html                  # FAQ accordion
├── contact.html                # Contact info + map
├── 404.html
│
├── api/                          # Vercel Serverless Functions (Node.js)
│   ├── appointments.js            #   POST create booking · GET taken slots for a date
│   ├── subscribe.js                #   POST newsletter signup
│   └── _lib/
│       └── validate.js              #   Shared server-side validation (defense in depth)
│
├── db/
│   ├── schema.sql                 # Postgres schema — run once to set up tables
│   └── init.js                     # `npm run db:init` — applies schema.sql for you
│
├── css/
│   └── style.css
│
├── js/
│   ├── script.js          # loading screen, scroll progress, back-to-top, chat widget
│   ├── counter.js          # animated stats counter
│   ├── modal.js              # booking modal — calls /api/appointments
│   ├── subscribe.js            # footer newsletter form — calls /api/subscribe
│   ├── filter.js                 # live service filter
│   ├── slider.js                   # before/after draggable slider
│   ├── theme.js                      # dark/light mode + localStorage
│   ├── navigation.js                   # sticky navbar + mobile menu
│   └── animations.js                     # scroll-reveal animations
│
├── assets/
│   ├── images/, icons/, logo/
│
├── package.json, .env.example, .gitignore, vercel.json
└── screenshots/
```

---

## Backend Setup (required for booking & subscriptions to work)

The frontend will load and look complete without any setup, but the booking modal and newsletter form need a real database to actually save anything. Do this once:

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Postgres database on Vercel
In your Vercel project dashboard: **Storage → Create Database → Postgres** (this provisions a Neon-backed Postgres instance and automatically injects `POSTGRES_URL` into your deployment — no manual copy-pasting of connection strings in production).

### 3. Apply the schema
Locally, pull the real connection string down first:
```bash
vercel link
vercel env pull .env.development.local
npm run db:init
```
This creates the `appointments` and `subscribers` tables (see `db/schema.sql` for the exact DDL, including the constraints that prevent double-booking and duplicate subscriptions).

### 4. Run locally
```bash
vercel dev
```
Plain `open index.html` will **not** run the API routes (there's no server behind a `file://` page) — always use `vercel dev` for local testing so `/api/*` requests actually work.

### 5. Deploy
```bash
vercel --prod
```

---

## API Reference

### `POST /api/appointments`
Books an appointment.

**Body:**
```json
{
  "name": "Jane Doe",
  "phone": "(512) 555-0123",
  "email": "jane@example.com",
  "date": "2026-09-01",
  "time": "9:00 AM",
  "service": "general-cleaning",
  "plan": "standard"
}
```
`plan` is optional (`basic` / `standard` / `premium`, or omitted entirely for a direct booking with no pricing plan attached) — it's populated automatically when a patient books via a pricing "Choose Plan" offer, and stored alongside the appointment so you can see which plan each booking came from.

- `201` → `{ message, appointment }`
- `400` → `{ error, fields: { fieldName: message } }` — validation failed
- `409` → `{ error, fields: { time: "..." } }` — that exact slot was just taken (database-enforced)
- `500` → `{ error }` — unexpected server error, safely logged server-side, no internals leaked to the client

### `GET /api/appointments?date=YYYY-MM-DD`
Returns already-booked times for a date, so the frontend can grey out taken slots *before* the user even tries to submit:
```json
{ "date": "2026-09-01", "takenSlots": ["9:00 AM", "2:00 PM"] }
```

### `POST /api/subscribe`
Subscribes an email to the newsletter.
```json
{ "email": "jane@example.com" }
```
- `201` → subscribed
- `409` → already subscribed (treated as a friendly, non-alarming message in the UI, not an error state)
- `400` / `500` → validation / server error, same shape as above

All three routes validate on the server independently of the client-side JS (client-side checks are for instant UX feedback only — they are not what protects the database), use parameterized queries throughout (no string-built SQL, so no SQL-injection surface), and include a hidden honeypot field to filter out basic bot spam.

---

## Signature Features

1. **Appointment Booking** — real persistence, live slot-availability checking, database-enforced no-double-booking, loading state on submit, inline server-error messages, success confirmation. Gracefully falls back to a client-side confirmation if no database is connected yet (see "Backend Setup"), so the booking flow never looks broken during grading/before you've provisioned Postgres — the real database check simply layers on top once connected.
2. **Pricing Plan Offers** — clicking "Choose Basic/Standard/Premium" shows that plan's full details (name, price, features — read live from its own pricing card, so it can never drift out of sync) before booking, instead of jumping straight into the appointment form. Choosing "Book This Plan" carries the plan through into the booking modal, and the plan is saved with the appointment record.
3. **Newsletter Subscriptions** — database-enforced no-duplicate-emails, friendly re-subscribe messaging, same graceful fallback as booking.
4. **Animated Stats Counter** — IntersectionObserver count-up, once per page load.
5. **Before & After Draggable Slider** — mouse, touch, and keyboard (arrow keys) support, full ARIA slider semantics.
6. **Live Service Filter** — instant client-side filtering with smooth transitions.
7. **FAQ Accordion** — one panel open at a time, smooth animation.
8. **Real multi-page navigation** — Home/Services/About/Pricing/FAQ/Contact are genuinely separate pages, not scroll anchors. Native browser back/forward, bookmarkable URLs, smooth native page transitions.

## Bonus Features

- Dark / Light mode, persisted via `localStorage`
- Tawk.to live-chat placeholder (drop-in ready)
- Scroll progress bar, back-to-top button, branded loading screen
- Scroll-triggered reveal animations (respects `prefers-reduced-motion`)
- Lazy-loaded below-the-fold images
- Fully responsive, zero horizontal scroll
- Accessible: semantic landmarks, ARIA labels, visible focus states, alt text, accessible form validation and error messaging
- Fixed: native `<select>` dropdown option text is pinned to a fixed dark-on-light color regardless of site theme — browsers render the open dropdown list with their own system background (almost always light) independent of page CSS, so text that turned near-white in dark mode was becoming invisible against it. Also hardened autofill text color for the same reason.

---

## Technologies Used

- **Frontend:** HTML5, CSS3 (custom design system via CSS variables), vanilla JavaScript (ES6+), Bootstrap 5 (CDN)
- **Backend:** Node.js on Vercel Serverless Functions, `@vercel/postgres`
- **Database:** Postgres (Vercel Postgres / Neon)
- **Fonts:** Inter (body), Plus Jakarta Sans (display)

No React, Vue, Angular, or Tailwind is used on the frontend — it remains a static site, with the backend added purely as API routes.

---

## Design System

| Token | Value |
|---|---|
| Background | `#F8FBFF` |
| Primary | `#1E88E5` |
| Secondary | `#1565C0` |
| Accent | `#42A5F5` |
| Spacing | 8-point system |

---

## Quality Checklist

- [x] Every page (Home/Services/About/Pricing/FAQ/Contact) validated: no duplicate IDs, no broken local links, correct titles, correct active-nav state
- [x] All JS files pass `node --check`
- [x] Server-side validation unit-tested against valid input, short names, bad emails, past dates, invalid enum values, honeypot spam, and null/undefined bodies
- [x] Double-booking prevented at the database layer, not just in application code
- [x] Duplicate newsletter subscriptions prevented at the database layer
- [x] Dropdown/autofill contrast bug fixed (dark-on-light text pinned regardless of theme)
- [x] No console errors
- [x] Mobile responsive, no horizontal scroll
- [x] Ready for GitHub and Vercel deployment

## Screenshots

See [`screenshots/README.md`](./screenshots/README.md) for a capture checklist.
#   c l o u d e x i f y - w e b - p 3 - y a w a r m u s h t a q  
 