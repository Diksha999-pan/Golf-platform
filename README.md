# GolfGives — Golf Charity Subscription Platform

A full-stack subscription platform combining golf performance tracking, monthly prize draws, and charity fundraising.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Backend | Next.js API Routes + Node.js/Express (cron) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe (Subscriptions + Webhooks) |
| Deployment | Vercel (web) + Railway/Render (server) |

---

## Project Structure

```
golf-platform/
├── apps/web/          — Next.js frontend + API routes
│   ├── app/           — App Router pages
│   │   ├── page.tsx               ← Landing page
│   │   ├── auth/login/            ← Login
│   │   ├── auth/signup/           ← Signup + plan + charity
│   │   ├── dashboard/             ← User dashboard
│   │   │   ├── page.tsx           ← Overview
│   │   │   ├── scores/            ← Score management
│   │   │   ├── draws/             ← Draw history
│   │   │   ├── charity/           ← Charity selection
│   │   │   ├── subscription/      ← Plan management
│   │   │   └── winners/[id]/      ← Proof upload
│   │   ├── admin/                 ← Admin panel
│   │   │   ├── page.tsx           ← Overview
│   │   │   ├── users/             ← User management
│   │   │   ├── draws/             ← Draw engine
│   │   │   ├── charities/         ← Charity management
│   │   │   └── winners/           ← Winner verification
│   │   └── api/
│   │       └── stripe/            ← Stripe API routes
│   ├── lib/
│   │   ├── supabase.ts            ← Supabase clients
│   │   ├── stripe.ts              ← Stripe helpers
│   │   └── draw-engine.ts         ← Core draw logic
│   └── types/database.ts          ← TypeScript types
├── server/            — Express cron server
│   └── src/index.ts               ← Monthly draw scheduler
└── supabase/
    └── migrations/001_initial_schema.sql
```

---

## Setup Guide

### 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Go to **Storage** → Create a bucket named `proofs` (set to public)
4. Copy your **Project URL** and **anon key** from Settings → API

### 2. Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two products in the Stripe Dashboard:
   - **Monthly Plan** — £9.99/month recurring
   - **Yearly Plan** — £89.99/year recurring
3. Copy the **Price IDs** for each plan
4. Set up a webhook endpoint pointing to: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`

### 3. Environment Variables

Copy `.env.example` to `.env.local` in `apps/web/`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in all values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_...

NEXTAUTH_URL=http://localhost:3000
```

### 4. Install & Run

```bash
# Install all dependencies
cd apps/web && npm install
cd ../../server && npm install

# Run frontend (from apps/web/)
npm run dev

# Run cron server (from server/)
npm run dev
```

Visit `http://localhost:3000`

---

## Creating an Admin User

1. Sign up normally through the app
2. In Supabase SQL Editor, run:
   ```sql
   update public.users set role = 'admin' where email = 'your@email.com';
   ```
3. Sign in — you'll be redirected to `/admin`

---

## Deployment to Vercel

1. Create a **new Vercel account** (as per PRD requirements)
2. Import the `apps/web` directory
3. Add all environment variables in Vercel dashboard
4. Set up Stripe webhook to point to your Vercel URL

---

## Key Features

### Score System
- Stableford format: 1–45 points
- Rolling 5-score window (oldest auto-removed)
- Minimum 3 scores to enter draws

### Draw Engine (`lib/draw-engine.ts`)
- **Random mode**: Standard lottery-style selection
- **Weighted mode**: Biases toward most/least frequent scores
- Simulation mode (preview without publishing)
- Jackpot rollover when no 5-match winner

### Prize Distribution
| Match | Pool Share | Rollover? |
|-------|-----------|-----------|
| 5 numbers | 40% | Yes (jackpot) |
| 4 numbers | 35% | No |
| 3 numbers | 25% | No |

### Charity System
- Minimum 10% of subscription to charity
- Users can increase to 50%
- Automatic donation calculation on each payment (Stripe webhook)

---

## Test Credentials

After setup, create accounts via `/auth/signup`.
Promote to admin via SQL as shown above.

**Stripe test cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry, any CVC
