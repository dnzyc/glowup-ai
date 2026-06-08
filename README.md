<p align="center">
  <img src="https://via.placeholder.com/120x120/09090b/fafafa?text=G" alt="GlowUp AI Logo" width="120" />
</p>

<h1 align="center">GlowUp AI</h1>
<p align="center"><strong>Flame-Grade Beauty Retouching. Zero GPU Cost. Pure CPU.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi" alt="Backend" />
  <img src="https://img.shields.io/badge/frontend-Next.js_16-000000?style=flat-square&logo=next.js" alt="Frontend" />
  <img src="https://img.shields.io/badge/mobile-Expo_SDK_52-4630EB?style=flat-square&logo=expo" alt="Mobile" />
  <img src="https://img.shields.io/badge/vision-OpenCV_4.10-5C3EE8?style=flat-square&logo=opencv" alt="OpenCV" />
  <img src="https://img.shields.io/badge/payments-Stripe-635BFF?style=flat-square&logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/database-Supabase-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
</p>

---

## Overview

GlowUp AI is a full-stack **AI-assisted beauty retouching SaaS** that delivers Flame Matchbox / Nuke Gizmo-quality results using **deterministic CPU-only OpenCV**. No GPU. No per-use API cost. No subscription bloat.

Upload a photo or video, select up to **8 body regions** (face, eyes, skin, body, background, and custom rectangles), dial in intensity sliders, and get a professionally retouched result in seconds. The pipeline runs locally on the backend with **7 gradeable beauty algorithms** — the same compositing techniques used in high-end VFX suites.

### Why OpenCV Instead of GPU AI?

| Concern | Solution |
|---|---|
| **Cost** | Zero GPU overhead — runs on a $6/month VPS |
| **Determinism** | Same input → same output, every time |
| **Speed** | Sub-second photo processing, real-time video per-frame |
| **Control** | Gradeable 0–100% sliders, not black-box AI |
| **Privacy** | No data sent to external AI providers |

An optional **GFPGAN fallback** via Replicate is available for extreme low-quality inputs — but the core pipeline never touches a GPU.

---

## Features

### Beauty Pipeline
- **7 compositing algorithms** modeled after Flame Beauty Box and Nuke Gizmo
- **Frequency Separation** — split low/high frequency for independent control
- **Bilateral Surface Blur** — edge-preserving skin smoothing
- **Edge-Preserving Polish** — Nuke EdgeBlur equivalent
- **High Pass Sharpen** — Flame HPSharpen with threshold masking
- **Unsharp Mask** — classic Nuke UnsharpMask
- **Blemish Removal** — median + edge-aware multi-stage filtering
- **Inpainting Spot Removal** — Nuke RotoPaint clone-brush equivalent

### Region Masking (8 Zones)
Apply beauty effects to specific regions — equivalent to Flame GMask / Nuke Roto:
Face · Eyes · Lips · Skin · Body · Background · Neck · Custom rectangles (x, y, w, h)

### Video Support
- **MP4** (H.264) via OpenCV `VideoWriter`
- **ProRes 422** (.mov) via ffmpeg `prores_ks` profile 2
- **ProRes 4444** via ffmpeg `prores_ks` profile 3
- Frame-by-frame beauty with precomputed region masks

### Platform Coverage
| Platform | Stack | Routes / Screens |
|---|---|---|
| **Web** | Next.js 16 + React 19 + shadcn/ui + Tailwind v4 | 5 routes |
| **Backend** | FastAPI + OpenCV 4.10 + NumPy | 7 REST endpoints |
| **Mobile** | Expo SDK 52 + React Native 0.76 | 5 tabs + auth |

### Business
- **Credit-based billing** — pay per use, not per month
- **Stripe Checkout** — 3 one-time purchase tiers (Starter $5 / Pro $20 / Studio $50)
- **Stripe Webhooks** — automatic credit delivery on `checkout.session.completed`
- **Supabase Auth** — email/password with Row Level Security
- **Rate Limiting** — per-IP, 100 req/min in-memory sliding window
- **Admin Dashboard** — job stats, revenue tracking, recent jobs feed

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │  Next.js 16 Web  │  │  Expo Mobile App  │                  │
│  │  (shadcn/ui)     │  │  (iOS / Android)  │                  │
│  └───────┬─────────┘  └────────┬─────────┘                  │
│          │   HTTP/REST         │   HTTP/REST                 │
└──────────┼─────────────────────┼────────────────────────────┘
           │                     │
           ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                       API GATEWAY                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              FastAPI (Python 3.11)                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────────┐ │    │
│  │  │ Process  │ │  Jobs    │ │ Stripe + Webhooks     │ │    │
│  │  │ Router   │ │  Router  │ │ Router                │ │    │
│  │  └────┬─────┘ └────┬─────┘ └──────────┬────────────┘ │    │
│  │       │             │                  │               │    │
│  │       ▼             ▼                  ▼               │    │
│  │  ┌────────────────────────────────────────────────┐    │    │
│  │  │              SERVICE LAYER                      │    │    │
│  │  │  ┌───────────────┐  ┌──────────────────────┐   │    │    │
│  │  │  │ BeautyPipeline │  │ CreditService         │   │    │    │
│  │  │  │ (7 algorithms) │  │ (deduct / add / get)  │   │    │    │
│  │  │  └───────┬───────┘  └──────────────────────┘   │    │    │
│  │  │          │                                      │    │    │
│  │  │  ┌───────┴───────────────────────────────────┐ │    │    │
│  │  │  │  FlameBeautyBox  ·  FlameDetailEnhance    │ │    │    │
│  │  │  │  FlameBlemishRemoval  ·  GFPGAN (optional) │ │    │    │
│  │  │  └───────────────────────────────────────────┘ │    │    │
│  │  └────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  ┌──────────────────────┐   ┌────────────────────────────┐  │
│  │     Supabase          │   │     Stripe                 │  │
│  │  ┌─────────────────┐  │   │  ┌──────────────────────┐  │  │
│  │  │ profiles        │  │   │  │ Checkout Sessions    │  │  │
│  │  │ jobs            │  │   │  │ Webhooks             │  │  │
│  │  │ credit_txns     │  │   │  │ Price IDs            │  │  │
│  │  │ Storage buckets │  │   │  └──────────────────────┘  │  │
│  │  │ RLS policies    │  │   │                            │  │
│  │  └─────────────────┘  │   └────────────────────────────┘  │
│  └──────────────────────┘                                    │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow — Photo Processing

```
User → Upload → POST /api/process → CreditService.deduct()
                                   → BeautyPipeline.process_photo()
                                   →   surface_blur()    (bilateral)
                                   →   remove_blemishes()  (median + edge)
                                   →   high_pass_sharpen() (HPSharpen)
                                   →   HSV brighten()
                                   →   edge_preserving_smooth() (EdgeBlur)
                                   →   region masking (GMask equivalent)
                                   →   composite with original
                                   → Supabase Storage upload
                                   → Job status → completed
                                   → User downloads result
```

---

## Project Structure

```
glowup-ai/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Environment variable loader
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Production container
│   ├── routes/
│   │   ├── process.py             # POST /api/process
│   │   ├── jobs.py                # GET /api/jobs, GET /api/jobs/{id}
│   │   ├── stripe_routes.py       # POST /api/stripe/checkout
│   │   ├── webhooks.py            # POST /api/stripe/webhook
│   │   └── admin.py               # GET /api/admin/stats
│   ├── services/
│   │   ├── beauty_pipeline.py     # 7 Flame-grade beauty algorithms
│   │   ├── credit_service.py      # Credit deduction & purchase logic
│   │   ├── ai_fallback.py         # Optional GFPGAN via Replicate
│   │   └── rate_limit.py          # Per-IP sliding window rate limiter
│   └── models/
│       └── job.py                 # Pydantic models (Region, BeautyParams, Job)
│
├── frontend/
│   ├── app/                       # Next.js 16 App Router
│   │   ├── page.tsx               # Landing page
│   │   ├── upload/page.tsx        # Upload + beauty editor
│   │   ├── dashboard/page.tsx     # User job history
│   │   ├── pricing/page.tsx       # Stripe pricing tiers
│   │   ├── admin/page.tsx         # Admin stats & job feed
│   │   ├── layout.tsx             # Root layout + Header
│   │   └── globals.css            # Tailwind v4 + shadcn/ui theme
│   ├── components/                # shadcn/ui + custom components
│   ├── lib/                       # Utilities (cn(), env)
│   ├── types/                     # TypeScript type definitions
│   └── package.json               # Next.js 16, React 19, shadcn/ui
│
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx            # Expo Router root layout
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # Home / feed
│   │   │   ├── camera.tsx         # Camera capture
│   │   │   ├── dashboard.tsx      # Job history
│   │   │   ├── editor.tsx         # Beauty editor
│   │   │   └── settings.tsx       # Account settings
│   │   └── auth/login.tsx         # Sign in modal
│   ├── components/                # Shared mobile UI
│   ├── stores/                    # Zustand state management
│   ├── lib/                       # API client, Supabase client
│   └── package.json               # Expo SDK 52, React Native 0.76
│
├── docs/
│   ├── supabase-setup.sql         # Database schema, RLS policies, triggers
│   └── stripe-setup.md            # Stripe product & webhook configuration
│
├── .env.example                   # Environment variable template
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.11+** (backend)
- **Node.js 20+** (frontend & mobile)
- **ffmpeg** (video processing — install via `brew install ffmpeg` or `apt install ffmpeg`)
- **Supabase** account (database, auth, storage)
- **Stripe** account (payments)

### 1. Clone & Environment

```bash
git clone https://github.com/your-org/glowup-ai.git
cd glowup-ai
cp .env.example frontend/.env.local
# Fill in Supabase + Stripe keys in frontend/.env.local
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_KEY="eyJh..."
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
export FRONTEND_URL="http://localhost:3000"

# Start the server
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`.

#### Docker (Production)

```bash
cd backend
docker build -t glowup-backend .
docker run -p 8000:8000 \
  -e SUPABASE_URL="..." \
  -e SUPABASE_SERVICE_KEY="..." \
  -e STRIPE_SECRET_KEY="..." \
  -e STRIPE_WEBHOOK_SECRET="..." \
  -e FRONTEND_URL="https://glowup-ai-chi.vercel.app" \
  glowup-backend
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:3000`. The dev server proxies API calls to `http://localhost:8000` (configured via `NEXT_PUBLIC_API_URL` in `.env.local`).

#### Production Build

```bash
npm run build   # Output: standalone (optimized for Vercel / Docker)
npm run start
```

### 4. Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Press i for iOS simulator, a for Android emulator
# Or scan QR code with Expo Go on physical device
```

### 5. Database Setup

Run the SQL migration in Supabase SQL Editor:

```bash
# Copy the contents of docs/supabase-setup.sql
# Paste into: https://supabase.com/dashboard/project/_/sql/new
# Click "Run"
```

This creates:
- `profiles` table (extends `auth.users`, auto-created via trigger, 10 free credits on signup)
- `jobs` table (tracks all processing jobs)
- `credit_transactions` table (audit trail for all credit movements)
- Row Level Security policies on all tables
- Indexes on `user_id`, `status`, `created_at`

Then create two **Storage Buckets** in the Supabase dashboard (Storage → New Bucket):
- `uploads` — user uploaded originals (public read, authenticated insert)
- `results` — processed outputs (public read, service insert)

### 6. Stripe Setup

1. Create **3 one-time products** in [Stripe Dashboard](https://dashboard.stripe.com/products):
   | Product | Price | Credits | Metadata |
   |---------|-------|---------|----------|
   | Starter | $5.00 | 10 | `credits: 10` |
   | Pro | $20.00 | 50 | `credits: 50` |
   | Studio | $50.00 | 150 | `credits: 150` |

2. Copy the generated Price IDs into `frontend/.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxx
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx
   NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID=price_xxx
   ```

3. Set up webhook forwarding:
   ```bash
   stripe listen --forward-to http://localhost:8000/api/stripe/webhook
   ```
   For production, add the webhook endpoint in Stripe Dashboard pointing to `https://your-api.example.com/api/stripe/webhook` with event `checkout.session.completed`.

See `docs/stripe-setup.md` for detailed instructions.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJh...` |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key (backend-only) | `eyJh...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` | Stripe price ID for Starter tier | `price_xxx` |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro tier | `price_xxx` |
| `NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID` | Stripe price ID for Studio tier | `price_xxx` |
| `FRONTEND_URL` | Web app URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

### Backend (environment or `.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `FRONTEND_URL` | Web app URL (for CORS + Stripe redirects) |
| `REPLICATE_API_TOKEN` | (Optional) Replicate API key for GFPGAN fallback |

---

## API Reference

Base URL: `http://localhost:8000`

### Health

```
GET /
```
**Response** `200`
```json
{ "status": "ok", "service": "GlowUp AI" }
```

---

### Process Media

```
POST /api/process
Content-Type: multipart/form-data
```

| Form Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `file` | file | Yes | — | Image (PNG/JPG) or video (MP4/MOV) |
| `user_id` | string | Yes | — | Supabase auth user UUID |
| `media_type` | string | No | `photo` | `photo` or `video` |
| `output_format` | string | No | `mp4` | `mp4`, `mov`, or `prores` (video only) |
| `smoothing` | int | No | `50` | Skin smoothing intensity (0–100) |
| `brightening` | int | No | `30` | HSV brightness boost (0–100) |
| `sharpening` | int | No | `20` | High-pass sharpening (0–100) |
| `blemish_removal` | int | No | `0` | Spot/blemish removal (0–100) |

**Pipeline executed in order:**
1. Bilateral Surface Blur (skin smoothing)
2. Blemish Removal (multi-stage median + edge-aware)
3. High Pass Sharpen (detail restoration)
4. HSV Brightening
5. Edge-Preserving Polish (final smooth)

**Credit Cost:** 1 for photo, 5 for video.

**Response** `200`
```json
{ "job_id": "550e8400-e29b-41d4-a716-446655440000", "status": "completed" }
```

**Errors:**
| Status | Detail |
|---|---|
| `402` | `Insufficient credits` |
| `500` | Processing pipeline error |

---

### Jobs

```
GET /api/jobs?user_id={uuid}
```
Returns the 50 most recent jobs for the given user.

**Response** `200`
```json
[
  {
    "id": "550e8400-...",
    "user_id": "abc123-...",
    "status": "completed",
    "input_url": "photo.jpg",
    "output_url": "https://...supabase.co/.../result.png",
    "media_type": "photo",
    "credit_cost": 1,
    "created_at": "2026-06-06T12:00:00Z",
    "completed_at": "2026-06-06T12:00:03Z"
  }
]
```

---

```
GET /api/jobs/{job_id}
```
Fetch a single job by UUID.

**Response** `200` — Single job object (same shape as above).  
**Response** `200` — `{ "error": "Job not found" }` if missing.

---

### Stripe

```
POST /api/stripe/checkout
Content-Type: application/json
```
```json
{
  "price_id": "price_xxx_pro",
  "user_id": "abc123-..."
}
```
**Response** `200`
```json
{ "url": "https://checkout.stripe.com/pay/cs_..." }
```
Redirect the user to `url` to complete payment.

---

```
POST /api/stripe/webhook
Content-Type: application/json
Stripe-Signature: <header>
```
Internal endpoint — called by Stripe. Credits the user when `checkout.session.completed` fires.

**Response** `200`
```json
{ "status": "ok" }
```

---

### Admin

```
GET /api/admin/stats
```
**Response** `200`
```json
{
  "totalJobs": 1523,
  "completedJobs": 1490,
  "failedJobs": 33,
  "totalRevenue": 1840.50,
  "recentJobs": [ ... ]
}
```

---

## Pricing

| Tier | Price | Credits | Cost per Photo | Cost per Video |
|---|---|---|---|---|
| **Starter** | $5 | 10 | $0.50 | $2.50 |
| **Pro** | $20 | 50 | $0.40 | $2.00 |
| **Studio** | $50 | 150 | $0.33 | $1.67 |

New users receive **10 free credits** on signup.

---

## Development Commands

### Backend
```bash
cd backend
uvicorn main:app --reload --port 8000              # Dev server
pip install -r requirements.txt                     # Install deps
python -c "import cv2; print(cv2.__version__)"      # Verify OpenCV
docker build -t glowup-backend .                    # Build container
```

### Frontend
```bash
cd frontend
npm run dev              # Next.js dev server (port 3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint check
```

### Mobile
```bash
cd mobile
npx expo start           # Expo dev server
npx expo start --ios     # iOS simulator
npx expo start --android # Android emulator
npx expo prebuild        # Generate native projects
```

### Stripe
```bash
stripe listen --forward-to http://localhost:8000/api/stripe/webhook  # Local webhook relay
stripe trigger checkout.session.completed                             # Test webhook
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Beauty Engine** | OpenCV 4.10 + NumPy (7 deterministic algorithms) |
| **API Server** | FastAPI (Python 3.11), Uvicorn, Pydantic v2 |
| **Web Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **UI Library** | shadcn/ui (base-nova style), Tailwind CSS v4 |
| **Mobile** | Expo SDK 52, React Native 0.76, Expo Router v4 |
| **Mobile State** | Zustand v5 |
| **Database** | Supabase (PostgreSQL) with Row Level Security |
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (upload + result buckets) |
| **Payments** | Stripe Checkout + Webhooks |
| **AI Fallback** | Replicate (GFPGAN, optional premium add-on) |
| **Container** | Docker (Python 3.11-slim) |
| **Video Export** | ffmpeg (ProRes 422/4444), OpenCV (H.264 MP4) |

---

## License

MIT © 2026 GlowUp AI

---

<p align="center">
  <sub>Built with ❤️ using OpenCV, FastAPI, Next.js, and Expo</sub>
</p>
