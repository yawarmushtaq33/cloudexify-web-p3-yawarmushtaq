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
| GitHub Repository | https://github.com/yawarmushtaq33/cloudexify-web-p3-yawarmushtaq |
| Live Deployment (Vercel) | https://cloudexify-web-p3-yawarmushtaq.vercel.app/ |

---

## Project Structure

```text
SmileCare-Dental/

│
├── index.html              # Home
├── services.html           # Services + Before/After gallery
├── about.html              # About / Doctor profile
├── pricing.html            # Pricing plans
├── faq.html                # FAQ accordion
├── contact.html            # Contact info + map
├── 404.html
│
├── api/                    # Vercel Serverless Functions (Node.js)
│   ├── appointments.js     # POST create booking · GET taken slots for a date
│   ├── subscribe.js        # POST newsletter signup
│   └── _lib/
│       └── validate.js     # Shared server-side validation (defense in depth)
│
├── db/
│   ├── schema.sql          # Postgres schema — run once to set up tables
│   └── init.js             # npm run db:init — applies schema.sql for you
│
├── css/
│   └── style.css
│
├── js/
│   ├── script.js           # loading screen, scroll progress, back-to-top, chat widget
│   ├── counter.js          # animated stats counter
│   ├── modal.js            # booking modal — calls /api/appointments
│   ├── subscribe.js        # footer newsletter form — calls /api/subscribe
│   ├── filter.js           # live service filter
│   ├── slider.js           # before/after draggable slider
│   ├── theme.js            # dark/light mode + localStorage
│   ├── navigation.js       # sticky navbar + mobile menu
│   └── animations.js       # scroll-reveal animations
│
├── assets/
│   ├── images/, icons/, logo/
│
├── package.json
├── .env.example
├── .gitignore
├── vercel.json
│
└── screenshots/