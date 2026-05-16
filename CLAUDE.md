# CLAUDE.md — Voxire Client: Online Course Platform

> Source of truth for every AI session working on this project.
> Read this fully before touching any file. No exceptions.

> **BUSINESS OPERATIONS:** Before handling any pricing, proposal, or client question, read `VOXIRE_BUSINESS.md` in the voxire repo.

---

## HARD RULES

1. **Never use em dashes (—). Never replace them with a hyphen (-) either.**
   Applies everywhere: JSX copy, Go code comments, commit messages, alt text, documentation, proposals. Restructure the sentence or use a colon. No exceptions.
2. **Mobile-first CSS. Always.** Write the mobile base first, then `min-width` overrides. Never `max-width` for new code.
3. **pnpm add only.** Never `npm install <package>`. The lockfile must stay valid.
4. **No code before a scoped plan.** Especially no backend schema changes without a written data model first.
5. **No secrets in code.** All credentials and API keys in `.env`. Never committed.
6. **All prices in USD.** Never quote LBP or any other currency.
7. **Founder review before any proposal or price goes to Ahmad or the client.**

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| Project | Online Course Platform (client name TBD) |
| Client type | Voxire client — referred via Ahmad Gherawi (Techneyat) |
| Point of contact | Ahmad Gherawi — all communication goes through him, not directly to end client |
| GitHub repo | https://github.com/voxire/Courses-platform |
| Local path | /Users/abedamouneh/Development/Courses-platform |
| Status | Pre-build — research and proposal phase |
| Built by | Voxire — Abed El-Fattah Amouneh + Mohammad Homsi |
| Business email | info@voxire.com |
| WhatsApp | +961 3 940 708 |

### What We Know (as of May 2026)

The client wants an online platform where:
- Users can register and log in
- Users pay online to access courses
- After payment, users access course content (videos + materials)

**What we do not know yet (must gather through Ahmad):**
- Client name and business type
- Course niche / subject matter
- Approximate number of courses and videos at launch
- Expected number of users (month 1, year 1)
- Payment gateway they already have (they have one — we need the name)
- Whether courses are one-time purchase or subscription
- Whether content is live, pre-recorded, or both
- Whether Arabic or bilingual interface is needed
- Desired launch date and budget range

---

## 2. GIT WORKFLOW

1. **No force pushes. Ever.**
2. **Never commit `.md` files** except `CLAUDE.md`.
3. **Atomic commits** — one file or one logical unit per commit.
4. **Commit message format** — short imperative, no conventional prefixes:
   ```
   Add course schema
   Fix video player mobile layout
   Update env variable docs
   ```
5. Commit author: **Abed El-Fattah Amouneh**. No `Co-Authored-By` trailers.

---

## 3. TECH STACK

### Frontend

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 |
| Package manager | pnpm |
| Icons | Phosphor Icons (`@phosphor-icons/react`) |
| Video player | Custom wrapper around `react-player` or `video.js` |
| Forms | React Hook Form + Zod validation |
| HTTP client | axios or fetch wrapper |
| State | React context + server components where possible |

### Backend

Independent Go service — **separate from onion**, purpose-built for this platform.

| Layer | Tech |
|---|---|
| Language | Go 1.26+ |
| HTTP router | go-chi/chi v5 |
| Database | PostgreSQL (Supabase managed, or self-hosted) |
| Auth | JWT (HS256) — custom issued on login/register |
| Password hashing | bcrypt |
| IDs | UUID v4 |
| Email | Resend |
| Payments | Client's existing gateway (name TBD) |
| Video | See Section 6 |

The backend follows the same layered architecture as onion:
- `handlers/` — parse HTTP, call service, return response
- `services/` — business logic only
- `repository/` — SQL queries only
- `domain/` — types, errors, interfaces

### Dev commands (frontend)

```bash
pnpm install
pnpm dev          # Next.js dev server
pnpm build        # production build
pnpm lint
```

### Dev commands (backend)

```bash
go mod download
cp .env.example .env
go run ./cmd/api/
```

---

## 4. PLATFORM FEATURES

### Core (must ship for MVP)

| Feature | Notes |
|---|---|
| User registration + login | Email/password, JWT session |
| Email verification | Required before course access |
| Password reset | Email-based OTP or link |
| Course catalog page | Browse available courses |
| Course detail page | Description, curriculum, instructor, price |
| Payment checkout | Integrate client's gateway |
| Post-payment access | Course unlocks on confirmed payment |
| Course player | Video player + lesson list sidebar |
| User dashboard | My courses, progress, profile |
| Admin panel | Course CRUD, user management, payment records |

### Optional add-ons (present in proposal as upgrades)

| Feature | Complexity | Notes |
|---|---|---|
| Subscription / membership | Medium | Monthly or annual plan unlocks all courses |
| Course certificates | Low | PDF generated on completion |
| Progress tracking | Medium | Lesson completion state, % complete |
| Quizzes / assessments | High | Per-lesson or end-of-course quiz |
| Live sessions | High | Zoom or custom live via WebRTC |
| Affiliate / referral system | High | Coupon codes, referral tracking |
| Mobile app | High | React Native — separate project |
| Multi-instructor | Medium | Multiple creators upload their own courses |
| Blog / content marketing | Low | SEO-driven content alongside courses |
| Arabic / bilingual interface | Medium | RTL support, content translations |

---

## 5. AUTHENTICATION AND ACCESS CONTROL

- Every user has a role: `student` | `admin` | `instructor` (if multi-instructor)
- Course access is gated by a `purchases` table — one row per user-course pair
- JWT contains: `user_id`, `role`, `email`, `exp`
- Protected routes check JWT on every request
- Frontend middleware: redirect unauthenticated users to `/login`
- Admin routes only accessible to `role: admin`
- No social auth (Google/Facebook) in MVP — note as potential add-on

---

## 6. VIDEO AND MEDIA HANDLING

Video hosting is a critical architecture decision. **Do not commit to an approach without pricing the options.**

### Options to evaluate and present in proposal

| Option | Pros | Cons | Estimated cost |
|---|---|---|---|
| Bunny.net Stream | Cheap, fast CDN, Lebanon delivery | Less name recognition | ~$0.005/min stored + $0.01/GB delivery |
| Cloudflare Stream | Global CDN, easy R2 integration | Per-minute encoding cost | $5/1000 min stored + $1/1000 min delivered |
| Vimeo OTT | No API work, known platform | Expensive at scale | $200–500/mo at meaningful scale |
| AWS S3 + CloudFront | Full control | High DevOps cost | Variable — needs pricing |
| Self-hosted on VPS | Cheapest storage | No CDN, poor performance | Unpredictable |

**Recommendation to explore:** Bunny.net Stream for MVP. Cheap, fast, has a decent API.

### Video protection rules

- Signed URLs only — never expose raw video files publicly
- Signed URL expires after 4 hours (configurable)
- Domain-locked playback (embed only on the platform domain)
- No download option

---

## 7. PAYMENTS

The client already has a payment gateway. Before any implementation work:

1. Ask Ahmad: which gateway? (OMT, BOB Finance, PayPal, Stripe, Paymob, Areeba, Whish, other)
2. Get API documentation from the client
3. Confirm whether gateway supports webhooks (required for reliable payment confirmation)

**Critical pattern:** Never unlock course access on a successful frontend payment callback. Only unlock after a confirmed webhook from the gateway. Frontend callbacks can be spoofed.

### Payment flow

```
User clicks "Buy" →
Frontend: redirect to gateway checkout →
Gateway: processes payment →
Gateway: sends webhook to our backend →
Backend: verifies webhook signature →
Backend: creates purchase record →
Backend: sends confirmation email to user →
Frontend: user sees unlocked course on refresh
```

---

## 8. DATABASE

PostgreSQL. Core tables:

```sql
-- Users
users (id UUID, email, password_hash, role, is_verified, created_at)

-- Email verification / password reset
user_tokens (id UUID, user_id, type ENUM['verify','reset'], token, expires_at, used_at)

-- Courses
courses (id UUID, title, slug, description, thumbnail_url, price_usd, is_published, created_at)

-- Sections and lessons
sections (id UUID, course_id, title, position)
lessons (id UUID, section_id, title, video_id, duration_seconds, position)

-- Video references (stored on Bunny/Cloudflare, not in DB blob)
videos (id UUID, platform ENUM['bunny','cloudflare'], external_id, cdn_url, signed_url_base)

-- Access control
purchases (id UUID, user_id, course_id, gateway, gateway_ref, amount_usd, confirmed_at)

-- Progress (optional add-on)
lesson_progress (user_id, lesson_id, completed_at, last_watched_at)
```

---

## 9. SEO AND MARKETING LAYER

The platform has two distinct SEO concerns:

**Marketing pages (unauthenticated):** `/`, `/courses`, `/courses/[slug]`, `/about`, `/contact`
- Full Next.js metadata API: `<title>`, description, canonical, OG tags
- Schema markup: `Course`, `Product`, `Organization`, `WebSite`
- Blog (optional): for keyword content targeting
- Fast static generation (ISR) for course catalog

**App pages (authenticated):** `/dashboard`, `/courses/[slug]/learn`, `/settings`
- Not indexed (`noindex, nofollow`)
- No SEO work needed beyond accessibility

---

## 10. PERFORMANCE REQUIREMENTS

| Metric | Target |
|---|---|
| LCP (marketing pages) | ≤ 2.5s |
| CLS | ≤ 0.1 |
| INP | ≤ 200ms |
| Video start time | ≤ 3s on standard LB connection |
| Page weight (marketing) | ≤ 500KB |
| First video byte delivery | Via CDN closest to Lebanon |

---

## 11. INFRASTRUCTURE AND HOSTING

For the proposal, present two options:

### Option A — Managed (recommended for MVP)

| Service | Provider | Est. monthly cost (USD) |
|---|---|---|
| Frontend hosting | Vercel or Cloudflare Pages | $0–20 |
| Backend (Go API) | Render or Railway | $7–25 |
| Database | Supabase (PostgreSQL managed) | $0–25 |
| Video hosting | Bunny.net Stream | usage-based (~$10–50 at launch scale) |
| Email (transactional) | Resend | $0–20 |
| CDN | Included with Bunny or Cloudflare | — |
| Domain + SSL | Client owns | ~$15/yr |
| **Total estimate** | | **$20–140/mo at launch** |

### Option B — Self-hosted VPS (lower monthly, higher setup cost)

| Service | Provider | Est. monthly cost (USD) |
|---|---|---|
| VPS (frontend + backend) | Hetzner or DigitalOcean | $20–40 |
| Database | Self-managed PostgreSQL | included |
| Video hosting | Bunny.net (still recommended) | usage-based |
| Email | Resend | $0–20 |
| **Total estimate** | | **$25–70/mo** |

---

## 12. PROPOSAL DELIVERABLES

Two artifacts produced in the session:

1. **Proposal web page** — A designed, hosted HTML page (Voxire style: dark, professional) that presents the platform options visually. Ahmad opens the link and shares it with the client.

2. **PDF version** — Same content as the web page, exported as a Voxire-branded PDF using the standard proposal design.

**Proposal sections:**
1. The Problem / Opportunity
2. Our Solution (what we build)
3. Platform Options (MVP vs Full)
4. Feature Breakdown Table
5. How It Works (user journey)
6. Infrastructure and Running Costs (what the client pays to operate)
7. Timeline
8. Voxire's Pricing (one-time build fee, broken into option tiers)
9. What We Need From You (discovery questions section — shows professionalism)
10. Next Steps

---

## 13. DISCOVERY QUESTIONS BANK

These must be answered by the client (through Ahmad) before any contract is signed.

**Business:**
- What is the company or personal brand name?
- What subject matter / niche will the courses cover?
- Is this a new business or expanding an existing one?
- Who is your target learner (age, location, profession)?

**Content:**
- How many courses do you plan to launch with?
- Are courses pre-recorded videos or will you do live sessions?
- Who records and uploads the content — you or multiple instructors?
- What is the average video length per lesson?
- Approximate total hours of video content at launch?

**Business model:**
- Are courses sold individually (one-time purchase) or via a subscription?
- What price points are you considering for courses?
- Do you have any existing audience (email list, Instagram, WhatsApp group)?

**Technical:**
- Which payment gateway do you have? Can you share the name and whether it has a developer API?
- Do you have a domain already?
- Do you need Arabic language support, or English only?
- Do you have existing branding (logo, colors, fonts)?

**Timeline and budget:**
- When do you need to launch?
- What is your budget range for the build? (frame: helps us scope correctly)

---

## 14. SESSION STARTUP CHECKLIST

Before any work in this project:

```bash
cd /Users/abedamouneh/Development/Courses-platform
git pull origin main
ls
cat RESEARCH_NOTES.md 2>/dev/null || echo "Research not started yet"
```

Then read:
1. This CLAUDE.md
2. `VOXIRE_BUSINESS.md` — lives at `/Users/abedamouneh/Development/voxire/VOXIRE_BUSINESS.md` (pricing anchors, communication rules, proposal structure)
3. Any `RESEARCH_NOTES.md` present in this repo from prior sessions

---

_CLAUDE.md v1.0 — Courses Platform (Voxire Client)_
_Created: May 2026 — Abed El-Fattah Amouneh_
_Contact: Ahmad Gherawi / Techneyat (point of contact to client)_
