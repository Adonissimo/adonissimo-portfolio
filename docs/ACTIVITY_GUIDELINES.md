# Activity: Build Your Own Full-Stack Portfolio Website

**Mentor:** Senior Full-Stack Software Engineer
**Mentee:** Junior Developer
**Duration:** 6 weeks (suggested, about 8–10 hours per week)
**Final output:** A live, production-grade portfolio website with a custom domain, an admin dashboard, and a public GitHub repository

---

## A Note From Your Mentor

A portfolio that is just a pretty landing page shows that you can write HTML. A portfolio that has **login, roles, real data, notifications, and a deployed backend** shows that you can build software.

This activity treats your portfolio like a real product. You will write requirements first, design the architecture second, and only then write code. That is how we work on real teams, and it is what hiring managers want to see.

**Rules for this activity:**

1. Do not skip the planning phases. Your design document is part of your grade.
2. Commit early and often. Small commits with clear messages.
3. Every phase ends with a checkpoint. Show me your work before moving on.
4. If you are stuck for more than 2 hours, ask. Being stuck is normal; staying stuck is wasted time.

---

## The Product: What You Are Building

You are building **"DevFolio"**, a personal portfolio with a built-in content management system.

| Area | Who sees it | What it does |
|---|---|---|
| **Public site** | Everyone | Home, About, Projects, Blog, Contact |
| **Admin dashboard** | You and approved users | Manage projects, posts, messages, and users |

Visitors browse your work and send you messages. You log in to a private dashboard to manage everything without touching code.

---

## Phase 1 — The Engineering Perspective (Week 1)

> **Goal:** Define *what* the app does and *how well* it must do it before writing any code.

### 1.1 Functional Requirements (What the app does)

Functional requirements describe features: the behaviors a user can see and use.

#### A. User Authentication & Access

| ID | Requirement |
|---|---|
| FR-01 | A user can sign up and log in with email and password. |
| FR-02 | A user can log in with a third-party provider (GitHub or Google). |
| FR-03 | A user can reset a forgotten password through an email link. |
| FR-04 | Sessions expire after a period of inactivity, and the user can log out. |
| FR-05 | Unauthenticated users are redirected away from `/admin` routes. |

#### B. Role-Based Access Control (RBAC)

Define three roles. Permissions must be enforced **on the server**, not just hidden in the UI.

| Role | Can do |
|---|---|
| **Owner** (you) | Everything: manage users, change roles, edit site settings, delete any content |
| **Editor** | Create and edit projects and blog posts; cannot delete users or change roles |
| **Viewer** | Read-only access to the dashboard (useful for a recruiter demo account) |
| **Guest** (not logged in) | View public pages, submit the contact form |

| ID | Requirement |
|---|---|
| FR-06 | Each user has exactly one role. New sign-ups default to Viewer. |
| FR-07 | Only the Owner can promote or demote users. |
| FR-08 | The API rejects any action the user's role does not allow, returning `403 Forbidden`. |
| FR-09 | The dashboard hides buttons the current role cannot use. |

#### C. Core Business Logic

| ID | Requirement |
|---|---|
| FR-10 | **Projects:** Create, read, update, and delete projects (title, description, tech stack tags, images, live link, repo link). |
| FR-11 | **Projects:** A project can be marked as Draft or Published. Only Published projects appear on the public site. |
| FR-12 | **Projects:** Visitors can filter projects by tech stack tag. |
| FR-13 | **Blog:** Write posts in Markdown with a live preview. Each post has a unique, URL-friendly slug. |
| FR-14 | **Contact:** Visitors submit a message (name, email, subject, body). Messages are saved and shown in an admin inbox. |
| FR-15 | **Contact:** Admins can mark messages as Read, Archived, or Spam. |
| FR-16 | **Media:** Admins can upload images. The app resizes and stores them in object storage. |
| FR-17 | **Audit log:** Every create, update, and delete action records who did it and when. |

#### D. Notifications

| ID | Requirement |
|---|---|
| FR-18 | When a contact message arrives, the Owner receives an **email**. |
| FR-19 | The dashboard shows an **in-app notification badge** with the count of unread messages. |
| FR-20 | The sender receives an automatic **confirmation email** ("Thanks, I'll reply within 48 hours"). |
| FR-21 | The Owner can turn each notification type on or off in Settings. |

---

### 1.2 Non-Functional Requirements (How well the app does it)

Non-functional requirements describe quality. They are measurable targets, not features.

#### A. Performance & Latency

| ID | Target | How you will measure it |
|---|---|---|
| NFR-01 | Lighthouse Performance score of 90 or higher on mobile | Chrome Lighthouse |
| NFR-02 | Largest Contentful Paint (LCP) under 2.5 seconds | Vercel Speed Insights |
| NFR-03 | API responses under 300 ms at the 95th percentile | Server logs or Render metrics |
| NFR-04 | Public pages are statically generated or cached at the edge | Check the response headers for cache hits |
| NFR-05 | Images are served in modern formats (WebP or AVIF) and lazy-loaded | Use `next/image` |

#### B. Scalability

| ID | Target |
|---|---|
| NFR-06 | The frontend is stateless so it scales automatically on Vercel. |
| NFR-07 | Database queries on lists use pagination. No query returns more than 50 rows at a time. |
| NFR-08 | Frequently filtered columns (slug, status, tags) have database indexes. |
| NFR-09 | Slow work (sending emails, resizing images) runs outside the request cycle, through a queue, background job, or webhook. |

#### C. Security & Compliance

| ID | Target |
|---|---|
| NFR-10 | All traffic uses HTTPS. HTTP requests redirect to HTTPS. |
| NFR-11 | Passwords are never stored in plain text. Use the auth provider or a strong hashing algorithm (bcrypt or argon2). |
| NFR-12 | Secrets (API keys, database URLs) live in environment variables and are never committed to Git. |
| NFR-13 | All user input is validated on the server (use a schema library such as Zod). |
| NFR-14 | The contact form is protected from bots with Cloudflare Turnstile and rate limiting. |
| NFR-15 | Security headers are set: Content-Security-Policy, X-Frame-Options, Strict-Transport-Security. |
| NFR-16 | The app follows basic data privacy practice: a Privacy Policy page, and a way to delete stored contact messages on request. (Relevant law here: Philippine Data Privacy Act of 2012.) |
| NFR-17 | Check your app against the OWASP Top 10 and document the result. |

#### D. Availability & Reliability

| ID | Target |
|---|---|
| NFR-18 | Target uptime of 99.5%, monitored by a free uptime checker (for example, UptimeRobot or Better Stack). |
| NFR-19 | The backend exposes a `/health` endpoint that checks the database connection. |
| NFR-20 | The database is backed up daily (automatic on Supabase or Render paid tiers; document your approach on free tiers). |
| NFR-21 | Errors are logged and tracked (for example, with Sentry). |
| NFR-22 | If the backend is down, public pages still load from cache and show a friendly message instead of crashing. |

### Phase 1 Deliverable

Create `docs/REQUIREMENTS.md` in your repo containing:

- [ ] All functional requirements, in your own words, with any you add or remove
- [ ] All non-functional requirements with measurable targets
- [ ] An RBAC permission matrix (roles × actions)
- [ ] At least **3 user stories** in the format: *"As a [role], I want to [action] so that [benefit]."*

**Mentor checkpoint questions:**
1. Why must RBAC be enforced on the server and not only in the UI?
2. Which NFR is hardest to meet on a free tier, and why?
3. What is the difference between "the contact form works" and "the contact form is reliable"?

---

## Phase 2 — The Infrastructure Perspective: Client-Side vs. Server-Side (Week 1–2)

> **Goal:** Decide what runs in the browser, what runs on a server, and how they talk to each other.

### 2.1 Understand the Split

| | Client-Side (Browser) | Server-Side |
|---|---|---|
| **Runs on** | The visitor's device | Your servers (Vercel functions, Render, Supabase) |
| **Responsible for** | Rendering UI, user interactions, form state, animations | Business rules, authentication checks, database access, sending emails |
| **Trust level** | **Never trusted.** Anyone can change client code. | Trusted. This is where rules are enforced. |
| **Secrets allowed?** | No. Anything sent to the browser is public. | Yes, through environment variables. |
| **Examples in DevFolio** | Project filter UI, Markdown preview, dark mode toggle | Saving a project, checking the user's role, sending notification emails |

### 2.2 Rendering Strategies in Next.js

Choose the right strategy per page and justify each choice.

| Strategy | When to use it | DevFolio example |
|---|---|---|
| **SSG** (Static Site Generation) | Content rarely changes | About page |
| **ISR** (Incremental Static Regeneration) | Content changes sometimes; must be fast | Project list, blog posts |
| **SSR** (Server-Side Rendering) | Data is personal or must always be fresh | Admin dashboard |
| **CSR** (Client-Side Rendering) | Highly interactive, after the page loads | Markdown editor, notification badge |

### 2.3 Reference Architecture

```
                         ┌─────────────────────────────┐
   Visitor / Admin ────▶ │        Cloudflare           │
                         │  DNS · CDN · WAF · Turnstile│
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │      Vercel (Frontend)       │
                         │  Next.js · React · Tailwind  │
                         │  Server Components + Route   │
                         │  Handlers / Server Actions   │
                         └──────┬───────────────┬───────┘
                                │               │
              ┌─────────────────▼───┐     ┌─────▼──────────────────┐
              │  Option A: Supabase │ OR  │  Option B: Render      │
              │  Postgres · Auth ·  │     │  Your own API          │
              │  Storage · RLS ·    │     │  (Node/NestJS, .NET,   │
              │  Edge Functions     │     │  etc.) + Postgres      │
              └─────────┬───────────┘     └─────┬──────────────────┘
                        │                       │
                        └──────────┬────────────┘
                                   ▼
                        ┌─────────────────────┐
                        │  Email (Resend)      │
                        │  Images (Cloudflare  │
                        │  R2 or Supabase      │
                        │  Storage)            │
                        └─────────────────────┘
```

### Phase 2 Deliverable

Create `docs/ARCHITECTURE.md` containing:

- [ ] Your own architecture diagram (draw.io, Excalidraw, or Mermaid)
- [ ] A table listing every page and its rendering strategy, with one sentence of reasoning each
- [ ] A list of what runs client-side vs. server-side
- [ ] Your **database schema** (Entity Relationship Diagram) covering at least: `users`, `roles`, `projects`, `tags`, `project_tags`, `posts`, `messages`, `notifications`, `audit_logs`
- [ ] Your **API contract**: every endpoint with method, path, required role, request body, and response

Example API contract row:

| Method | Path | Role required | Purpose |
|---|---|---|---|
| `GET` | `/api/projects?tag=react&page=1` | Public | List published projects |
| `POST` | `/api/projects` | Editor, Owner | Create a project |
| `DELETE` | `/api/projects/:id` | Owner | Delete a project |
| `POST` | `/api/contact` | Public (Turnstile token required) | Submit a message |

**Mentor checkpoint questions:**
1. Why is the admin dashboard SSR and not SSG?
2. Where exactly does the role check happen when an Editor tries to delete a project?
3. What would break if you put your database password in a `NEXT_PUBLIC_` variable?

---

## Phase 3 — Frontend Technologies: The Client-Side (Week 2–3)

> **Goal:** Build the public site and the dashboard UI.

### 3.1 Stack

| Priority | Technology | Why |
|---|---|---|
| Required | **React** | Component-based UI; the industry standard |
| Required | **Next.js (App Router)** | Routing, server components, rendering strategies, API routes in one framework |
| Required | **Tailwind CSS** | Fast, consistent styling without writing large CSS files |
| Required | **TypeScript** | Catch bugs before runtime; expected in professional codebases |
| Recommended | shadcn/ui | Accessible, copy-paste components built on Tailwind |
| Recommended | React Hook Form + Zod | Form handling with shared validation schemas |
| Recommended | TanStack Query | Caching and refetching for client-side data |

> If you are more comfortable in another frontend language or framework, you may use it, but explain your choice in the README. React, Next.js, and Tailwind are strongly preferred because they match current job postings.

### 3.2 Tasks

**Public site**
- [ ] Layout with responsive navbar, footer, and dark/light mode
- [ ] Home page: hero section, short intro, featured projects
- [ ] Projects page: grid with tag filtering and pagination
- [ ] Project detail page: `/projects/[slug]`
- [ ] Blog list and blog post pages: `/blog/[slug]` with Markdown rendering
- [ ] Contact page with form validation and Turnstile widget
- [ ] Custom 404 and error pages
- [ ] SEO: page titles, meta descriptions, Open Graph images, `sitemap.xml`, `robots.txt`

**Admin dashboard (`/admin`)**
- [ ] Login, sign-up, and forgot-password pages
- [ ] Protected layout using Next.js middleware to redirect guests
- [ ] Projects table with create, edit, delete, and publish toggle
- [ ] Blog editor with Markdown live preview
- [ ] Messages inbox with read, archive, and spam actions
- [ ] Notification bell with unread count
- [ ] Users page (Owner only) to change roles
- [ ] Settings page for notification preferences

**Quality**
- [ ] Mobile-first responsive design (test at 375px, 768px, and 1280px)
- [ ] Accessibility: keyboard navigation, alt text, proper labels, color contrast
- [ ] Loading states (skeletons) and empty states for every list

### Phase 3 Checkpoint

Deploy a preview to Vercel (it is fine if data is still mocked). Send me the preview link. I will review the UI on my phone.

---

## Phase 4 — Backend Technologies: The Server-Side (Week 3–4)

> **Goal:** Build the API, database, authentication, RBAC, and notifications.

### 4.1 Choose Your Track

Use the backend language you are most comfortable with. Pick **one** track.

#### Track A — Supabase (Backend-as-a-Service)

Best if you want to move fast and learn Postgres security deeply.

| Concern | How you solve it |
|---|---|
| Database | Supabase Postgres |
| Authentication | Supabase Auth (email + GitHub/Google OAuth) |
| RBAC | `role` column on a `profiles` table + **Row Level Security (RLS) policies** |
| Business logic | Next.js Server Actions / Route Handlers, plus Postgres functions where needed |
| File storage | Supabase Storage |
| Notifications | Database webhook or Edge Function → Resend email; Supabase Realtime for the in-app badge |

**Key learning:** Writing RLS policies, for example: *"Editors can update rows in `projects`; only Owners can delete."*

#### Track B — Render (Your Own API Server)

Best if you want to show you can build and deploy a backend from scratch.

| Concern | How you solve it |
|---|---|
| Language/framework | Your choice: Node.js (NestJS or Express), C# (.NET Web API), Python (FastAPI), Java (Spring Boot), or Go |
| Database | Render Postgres (or Supabase Postgres used only as a database) |
| ORM | Prisma / Drizzle (Node), Entity Framework Core (.NET), SQLAlchemy (Python) |
| Authentication | JWT access tokens + refresh tokens in HttpOnly cookies, or an auth provider |
| RBAC | Middleware or guards/attributes, e.g. `@Roles('Owner')` or `[Authorize(Roles = "Owner")]` |
| File storage | Cloudflare R2 |
| Notifications | Background job (BullMQ, Hangfire, or a Render Cron Job) → Resend email |

**Key learning:** Layered architecture (Controller → Service → Repository), middleware, and deploying a long-running server.

> **Note on Render's free tier:** free web services sleep after inactivity, so the first request can be slow. Document this in your README and show how your frontend handles it (NFR-22).

### 4.2 Tasks (Both Tracks)

- [ ] Database migrations checked into Git (no manual table creation)
- [ ] Seed script that creates an Owner account and sample data
- [ ] Authentication flows: sign-up, login, logout, password reset, OAuth
- [ ] RBAC enforced on every protected endpoint or table
- [ ] All CRUD endpoints for projects, posts, tags, and messages
- [ ] Server-side validation with clear error responses (`400`, `401`, `403`, `404`, `422`, `500`)
- [ ] Rate limiting on `/api/contact` and auth endpoints
- [ ] Email notifications via Resend (new message to Owner, confirmation to sender)
- [ ] In-app notifications table and unread count endpoint
- [ ] Audit log written on every create, update, and delete
- [ ] `/health` endpoint
- [ ] Automated tests: at least **5 unit tests** for business logic and **3 tests** proving RBAC blocks unauthorized roles

### Phase 4 Checkpoint

Walk me through a live demo:
1. Log in as a Viewer and try to delete a project. Show me the `403`.
2. Submit the contact form. Show me both emails arriving and the badge updating.
3. Show me the audit log entry for an edit you made.

---

## Phase 5 — Tools & Deployment (Week 5)

> **Goal:** Ship it to production the way a professional team would.

### 5.1 Vercel (Frontend Hosting)

- [ ] Connect the GitHub repository to Vercel
- [ ] Every pull request gets an automatic **preview deployment**
- [ ] `main` branch deploys to production
- [ ] Environment variables set separately for Preview and Production
- [ ] Enable Vercel Analytics and Speed Insights

### 5.2 Cloudflare (Edge, DNS, Security)

- [ ] Buy or connect a custom domain and manage DNS in Cloudflare
- [ ] Point the domain to Vercel (follow Vercel's custom domain instructions; if you proxy through Cloudflare, use **Full (strict)** SSL mode)
- [ ] Enable **Always Use HTTPS**
- [ ] Add **Turnstile** to the contact form and verify the token on the server
- [ ] Add a basic **WAF / rate limiting rule** for the contact and login routes
- [ ] (Track B) Use **Cloudflare R2** for image storage

### 5.3 Render or Supabase (Backend Hosting)

**If Supabase:**
- [ ] Separate projects for development and production (or use branching)
- [ ] RLS enabled on **every** table; verify with the Supabase security advisor
- [ ] Auth redirect URLs set to your production domain
- [ ] Never expose the `service_role` key to the browser

**If Render:**
- [ ] Web service deployed from GitHub with auto-deploy on `main`
- [ ] Render Postgres connected through an environment variable
- [ ] Health check path set to `/health`
- [ ] CORS configured to allow only your frontend domain

### 5.4 CI/CD Pipeline (GitHub Actions)

- [ ] On every pull request: install, lint, type-check, run tests
- [ ] Block merging to `main` if any check fails
- [ ] Add status badges to your README

### 5.5 Monitoring

- [ ] Uptime monitor pinging your site and `/health` endpoint
- [ ] Error tracking with Sentry on frontend and backend

---

## Phase 6 — Documentation, Polish & Presentation (Week 6)

> **Goal:** Make your work easy for a recruiter or senior engineer to understand in 5 minutes.

### 6.1 README.md must include

- [ ] Live link and a demo Viewer account (read-only credentials)
- [ ] Screenshots or a short GIF of the public site and the dashboard
- [ ] Tech stack with a one-line reason for each choice
- [ ] Architecture diagram
- [ ] How to run locally (step by step, including `.env.example`)
- [ ] Links to `REQUIREMENTS.md` and `ARCHITECTURE.md`
- [ ] **Trade-offs and lessons learned:** what you would do differently with more time or budget

### 6.2 Verify Your Non-Functional Requirements

Fill in this table with real measurements and screenshots as proof:

| NFR | Target | Actual result | Pass/Fail |
|---|---|---|---|
| Lighthouse Performance (mobile) | ≥ 90 | | |
| LCP | < 2.5 s | | |
| API p95 latency | < 300 ms | | |
| Security headers grade (securityheaders.com) | A | | |
| Uptime over 7 days | ≥ 99.5% | | |
| RBAC tests passing | 3 / 3 | | |

### 6.3 Final Presentation (15 minutes)

1. **2 min** — What problem DevFolio solves
2. **5 min** — Live demo as Guest, Viewer, Editor, and Owner
3. **5 min** — Architecture walkthrough and one hard problem you solved
4. **3 min** — NFR results and what you would improve next

---

## Grading Rubric

| Category | Weight | Excellent (full marks) |
|---|---|---|
| Requirements & design docs | 15% | Clear, measurable, matches the final build |
| Authentication & RBAC | 20% | Enforced server-side, tested, no bypasses |
| Core business logic | 20% | All CRUD flows work, validated, audited |
| Notifications | 10% | Email and in-app both work reliably |
| Frontend quality | 15% | Responsive, accessible, fast, polished |
| Deployment & infrastructure | 10% | Custom domain, CI/CD, Cloudflare security, monitoring |
| Documentation & presentation | 10% | A stranger can understand and run the project |

**Passing:** 75%. **Portfolio-ready:** 90% and above.

---

## Stretch Goals (Optional)

Pick one or two only after everything above is done.

- [ ] Two-factor authentication (TOTP)
- [ ] Full-text search across projects and blog posts
- [ ] Internationalization (English and Filipino)
- [ ] A small AI feature: an "Ask about my work" chatbot that answers from your project data
- [ ] Analytics dashboard: page views per project
- [ ] End-to-end tests with Playwright
- [ ] Docker setup for local development

---

## Weekly Mentor Sync Template

Copy this into your weekly update message:

```
Week #:
Done this week:
-
Planned for next week:
-
Blockers / questions:
-
One thing I learned:
-
```

---

## Suggested Resources

- Next.js documentation — App Router, rendering, Server Actions
- Tailwind CSS documentation
- Supabase documentation — Auth and Row Level Security
- Render documentation — Web Services and Postgres
- Cloudflare documentation — DNS, Turnstile, R2
- Vercel documentation — Deployments and environment variables
- OWASP Top 10 — web security risks
- web.dev — Core Web Vitals

---

> **Final word from your mentor:** The goal is not to finish fast. The goal is to be able to explain every decision you made. If an interviewer points at any part of this project and asks "why?", you should have an answer. Good luck. Ship it.
