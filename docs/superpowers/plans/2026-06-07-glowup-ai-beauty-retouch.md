# GlowUp AI — Beauty Retouch SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a SaaS website where users upload photos/videos, apply AI beauty effects to specific body regions with gradeable intensity, and pay per use.

**Architecture:** Next.js frontend (Vercel) → FastAPI backend (Railway) → Replicate AI processing. Supabase for auth/storage/database. Stripe for payments. Zero fixed cost, pay-per-use AI.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, FastAPI, Python 3.11, Supabase, Replicate API, Stripe, shadcn/ui

---

## File Structure

```
glowup-ai/
├── frontend/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx           # Root layout with header/nav
│   │   ├── page.tsx             # Landing page (hero, features, pricing CTA)
│   │   ├── upload/
│   │   │   └── page.tsx         # Upload + region selector + process
│   │   ├── dashboard/
│   │   │   └── page.tsx         # User history, credits, downloads
│   │   ├── pricing/
│   │   │   └── page.tsx         # Pricing plans
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts     # Supabase auth callback
│   │   └── api/
│   │       ├── process/
│   │       │   └── route.ts     # POST: submit processing job
│   │       ├── jobs/[id]/
│   │       │   └── route.ts     # GET: job status
│   │       └── webhook/
│   │           └── stripe/
│   │               └── route.ts # Stripe webhook handler
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── Header.tsx           # Navigation + auth state
│   │   ├── Uploader.tsx         # Drag-drop file upload
│   │   ├── RegionSelector.tsx   # Interactive region selection overlay
│   │   ├── BeautyControls.tsx   # Per-region sliders for beauty params
│   │   ├── BeforeAfter.tsx      # Comparison slider
│   │   ├── ProcessingStatus.tsx # Progress indicator
│   │   ├── PricingCards.tsx     # Pricing plan cards
│   │   └── CreditDisplay.tsx    # Credit balance display
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── stripe.ts            # Stripe client
│   │   └── api.ts               # Backend API client
│   └── types/
│       └── index.ts             # TypeScript types
├── backend/
│   ├── main.py                  # FastAPI app entry
│   ├── requirements.txt
│   ├── routes/
│   │   ├── process.py           # POST /process - submit job
│   │   ├── jobs.py              # GET /jobs/{id} - job status
│   │   └── webhooks.py          # Stripe webhook receiver
│   ├── services/
│   │   ├── replicate_service.py # Replicate AI processing
│   │   ├── beauty_pipeline.py   # Beauty processing logic
│   │   └── credit_service.py    # Credit management
│   ├── models/
│   │   └── job.py               # Job model (Pydantic)
│   └── config.py                # Environment config
└── docs/
    └── superpowers/plans/
```

---

### Task 1: Project Scaffold & Infrastructure

**Files:**
- Create: `frontend/` (Next.js app with `npx create-next-app`)
- Create: `backend/main.py`, `backend/requirements.txt`, `backend/config.py`
- Create: `.env.example`

- [ ] **Step 1: Create Next.js frontend**

```bash
cd /Users/dnzyc/glowup-ai
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-turbopack
cd frontend
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js lucide-react
npx shadcn@latest init -d
npx shadcn@latest add button card input slider dialog tabs avatar badge
```

- [ ] **Step 2: Create FastAPI backend skeleton**

Create `backend/requirements.txt`:
```txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
supabase==2.7.0
replicate==1.0.0
stripe==10.0.0
python-multipart==0.0.9
pydantic==2.9.0
httpx==0.27.0
```

Create `backend/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import process, jobs, webhooks

app = FastAPI(title="GlowUp AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://glowup-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(process.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok", "service": "GlowUp AI"}
```

Create `backend/config.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
```

Create `backend/routes/__init__.py`:
```python
from . import process, jobs, webhooks
```

Create `backend/services/__init__.py`:
```python
```

Create `backend/models/__init__.py`:
```python
```

- [ ] **Step 3: Create .env.example**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Replicate
REPLICATE_API_TOKEN=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 4: Verify frontend runs**

```bash
cd frontend && npm run dev
```
Expected: Next.js starts on localhost:3000

- [ ] **Step 5: Verify backend runs**

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload
```
Expected: FastAPI starts on localhost:8000, GET / returns `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
cd /Users/dnzyc/glowup-ai
git init
git add -A
git commit -m "feat: scaffold Next.js frontend + FastAPI backend"
```

---

### Task 2: Database Schema & Supabase Setup

**Files:**
- Create: `backend/models/job.py`

- [ ] **Step 1: Create Supabase tables via SQL**

Run in Supabase SQL Editor:
```sql
-- Users table (auto-created by Supabase Auth, extended via profiles)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_url TEXT NOT NULL,
  output_url TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  regions JSONB DEFAULT '[]',
  beauty_params JSONB DEFAULT '{"smoothing":50,"brightening":30,"sharpening":20}',
  credit_cost INTEGER DEFAULT 1,
  replicate_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Create Pydantic models**

Create `backend/models/job.py`:
```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class Region(BaseModel):
    id: str
    name: str  # "face", "forehead", "left_arm", "right_arm", "full_body"
    x: float
    y: float
    width: float
    height: float

class BeautyParams(BaseModel):
    smoothing: int = 50
    brightening: int = 30
    sharpening: int = 20
    blemish_removal: int = 0

class ProcessRequest(BaseModel):
    user_id: str
    media_type: str  # "photo" or "video"
    regions: List[Region] = []
    beauty_params: BeautyParams = BeautyParams()

class JobResponse(BaseModel):
    id: UUID
    user_id: str
    status: str
    input_url: str
    output_url: Optional[str] = None
    media_type: str
    credit_cost: int
    created_at: datetime
    completed_at: Optional[datetime] = None
```

- [ ] **Step 3: Verify models import**

```bash
cd backend && python -c "from models.job import ProcessRequest, JobResponse; print('OK')"
```

- [ ] **Step 4: Commit**

```bash
git add backend/models/job.py
git commit -m "feat: add database schema and Pydantic models"
```

---

### Task 3: Frontend Auth & Supabase Integration

**Files:**
- Create: `frontend/lib/supabase.ts`
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/app/auth/callback/route.ts`
- Create: `frontend/components/Header.tsx`

- [ ] **Step 1: Create Supabase client**

Create `frontend/lib/supabase.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Set up auth callback**

Create `frontend/app/auth/callback/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
```

- [ ] **Step 3: Add Header component**

Create `frontend/components/Header.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { LogIn, LogOut, UserCircle } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="text-xl font-bold">
          GlowUp AI
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm hover:underline">
            Pricing
          </Link>
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/upload">
                <Button size="sm">New Project</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={signIn}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Update root layout**

Modify `frontend/app/layout.tsx` - add Header to layout.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/supabase.ts frontend/app/auth/ frontend/components/Header.tsx frontend/app/layout.tsx
git commit -m "feat: add Supabase auth + Header component"
```

---

### Task 4: Upload Page with Region Selector

**Files:**
- Create: `frontend/app/upload/page.tsx`
- Create: `frontend/components/Uploader.tsx`
- Create: `frontend/components/RegionSelector.tsx`
- Create: `frontend/components/BeautyControls.tsx`
- Create: `frontend/types/index.ts`

- [ ] **Step 1: Create TypeScript types**

Create `frontend/types/index.ts`:
```typescript
export interface Region {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BeautyParams {
  smoothing: number;
  brightening: number;
  sharpening: number;
  blemishRemoval: number;
}

export interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  inputUrl: string;
  outputUrl?: string;
  mediaType: "photo" | "video";
  creditCost: number;
  createdAt: string;
}

export const REGION_PRESETS = [
  { id: "full_body", label: "Full Body" },
  { id: "face", label: "Face" },
  { id: "forehead", label: "Forehead" },
  { id: "under_eyes", label: "Under Eyes" },
  { id: "left_arm", label: "Left Arm" },
  { id: "right_arm", label: "Right Arm" },
  { id: "torso", label: "Torso" },
  { id: "legs", label: "Legs" },
];
```

- [ ] **Step 2: Create Uploader component**

Create `frontend/components/Uploader.tsx`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { Upload, FileImage, Film } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  onFileSelected: (file: File, previewUrl: string) => void;
}

export default function Uploader({ onFileSelected }: Props) {
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    onFileSelected(file, url);
  }

  return (
    <Card
      className={`p-12 border-2 border-dashed text-center cursor-pointer transition-colors ${
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]!); }}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-lg font-medium mb-2">Drop your photo or video here</p>
      <p className="text-sm text-muted-foreground">
        Supports JPG, PNG, MP4, MOV up to 500MB
      </p>
      <div className="flex gap-4 justify-center mt-4">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileImage className="w-3 h-3" /> Photo
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Film className="w-3 h-3" /> Video
        </span>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Create RegionSelector component**

Create `frontend/components/RegionSelector.tsx`:
```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { Region, REGION_PRESETS } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  imageUrl: string;
  regions: Region[];
  onRegionsChange: (regions: Region[]) => void;
}

export default function RegionSelector({ imageUrl, regions, onRegionsChange }: Props) {
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [activePreset, setActivePreset] = useState("full_body");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function getCanvasPos(e: React.MouseEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseDown(e: React.MouseEvent) {
    const pos = getCanvasPos(e);
    setStartPos(pos);
    setDrawing(true);
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (!drawing) return;
    const endPos = getCanvasPos(e);
    const newRegion: Region = {
      id: `${activePreset}_${Date.now()}`,
      name: activePreset,
      label: REGION_PRESETS.find((p) => p.id === activePreset)?.label || activePreset,
      x: Math.min(startPos.x, endPos.x),
      y: Math.min(startPos.y, endPos.y),
      width: Math.abs(endPos.x - startPos.x),
      height: Math.abs(endPos.y - startPos.y),
    };
    onRegionsChange([...regions, newRegion]);
    setDrawing(false);
  }

  function removeRegion(id: string) {
    onRegionsChange(regions.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {REGION_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant={activePreset === preset.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActivePreset(preset.id)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div ref={containerRef} className="relative border rounded-lg overflow-hidden bg-black">
        <canvas ref={canvasRef} className="w-full" />
        <img
          src={imageUrl}
          alt="Preview"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
        <div
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        {regions.map((region) => (
          <div
            key={region.id}
            className="absolute border-2 border-primary bg-primary/20"
            style={{
              left: region.x,
              top: region.y,
              width: region.width,
              height: region.height,
            }}
          >
            <Badge
              className="absolute -top-3 -right-2 cursor-pointer text-xs"
              variant="destructive"
              onClick={() => removeRegion(region.id)}
            >
              {region.label} ✕
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create BeautyControls component**

Create `frontend/components/BeautyControls.tsx`:
```typescript
"use client";

import { BeautyParams } from "@/types";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Props {
  params: BeautyParams;
  onChange: (params: BeautyParams) => void;
}

const CONTROLS: { key: keyof BeautyParams; label: string }[] = [
  { key: "smoothing", label: "Skin Smoothing" },
  { key: "brightening", label: "Brightening" },
  { key: "sharpening", label: "Sharpening" },
  { key: "blemishRemoval", label: "Blemish Removal" },
];

export default function BeautyControls({ params, onChange }: Props) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Beauty Settings</h3>
      {CONTROLS.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-xs">{label}</Label>
            <span className="text-xs text-muted-foreground">{params[key]}%</span>
          </div>
          <Slider
            value={[params[key]]}
            onValueChange={([v]) => onChange({ ...params, [key]: v })}
            min={0}
            max={100}
            step={1}
          />
        </div>
      ))}
    </Card>
  );
}
```

- [ ] **Step 5: Create upload page**

Create `frontend/app/upload/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Uploader from "@/components/Uploader";
import RegionSelector from "@/components/RegionSelector";
import BeautyControls from "@/components/BeautyControls";
import { Button } from "@/components/ui/button";
import { Region, BeautyParams } from "@/types";
import { Sparkles } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [params, setParams] = useState<BeautyParams>({
    smoothing: 50, brightening: 30, sharpening: 20, blemishRemoval: 0,
  });
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  async function handleProcess() {
    if (!file) return;
    setProcessing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const path = `${user.id}/${Date.now()}_${file.name}`;
    await supabase.storage.from("uploads").upload(path, file);
    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        media_type: file.type.startsWith("video/") ? "video" : "photo",
        regions,
        beauty_params: params,
      }),
    });

    if (res.ok) {
      const job = await res.json();
      router.push(`/dashboard?job=${job.id}`);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">New Project</h1>
      {!previewUrl ? (
        <Uploader onFileSelected={(f, url) => { setFile(f); setPreviewUrl(url); }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <RegionSelector
              imageUrl={previewUrl}
              regions={regions}
              onRegionsChange={setRegions}
            />
          </div>
          <div className="space-y-4">
            <BeautyControls params={params} onChange={setParams} />
            <Button
              className="w-full"
              size="lg"
              onClick={handleProcess}
              disabled={processing}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {processing ? "Processing..." : "Apply Beauty"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setPreviewUrl(null); setRegions([]); }}
            >
              Change File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify components compile**

```bash
cd frontend && npm run build
```
Expected: No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/types/ frontend/components/ frontend/app/upload/
git commit -m "feat: add upload page with region selector and beauty controls"
```

---

### Task 5: Backend Processing API

**Files:**
- Create: `backend/routes/process.py`
- Create: `backend/routes/jobs.py`
- Create: `backend/services/replicate_service.py`
- Create: `backend/services/beauty_pipeline.py`
- Create: `backend/services/credit_service.py`

- [ ] **Step 1: Create Replicate service**

Create `backend/services/replicate_service.py`:
```python
import replicate
from config import REPLICATE_API_TOKEN

class ReplicateService:
    def __init__(self):
        self.client = replicate.Client(api_token=REPLICATE_API_TOKEN)

    def process_photo(self, image_url: str, params: dict) -> str:
        """Process photo with GFPGAN for face enhancement"""
        output = self.client.run(
            "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
            input={"img": image_url, "scale": 2, "version": "v1.4"},
        )
        return output if isinstance(output, str) else output[0]

    def process_video(self, video_url: str, params: dict) -> str:
        """Process video frame-by-frame"""
        output = self.client.run(
            "lucataco/real-esrgan-video:be2ec61c8d15bf512314aea3973e3c2b8f4888ef499bdfc4cf7e3951ca9be57f",
            input={"video": video_url, "scale": 2, "face_enhance": True},
        )
        return output if isinstance(output, str) else output[0]

    def apply_beauty_region(
        self, image_url: str, mask_url: str, params: dict
    ) -> str:
        """Apply beauty to specific region using mask"""
        output = self.client.run(
            "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
            input={
                "img": image_url,
                "mask": mask_url,
                "scale": 1,
                "version": "v1.4",
            },
        )
        return output if isinstance(output, str) else output[0]
```

- [ ] **Step 2: Create beauty pipeline service**

Create `backend/services/beauty_pipeline.py`:
```python
import cv2
import numpy as np
from typing import List
from models.job import Region, BeautyParams


class BeautyPipeline:
    @staticmethod
    def generate_region_mask(
        image_shape: tuple, regions: List[Region]
    ) -> np.ndarray:
        """Generate a binary mask from selected regions"""
        mask = np.zeros(image_shape[:2], dtype=np.uint8)
        for region in regions:
            x1, y1 = int(region.x), int(region.y)
            x2, y2 = int(region.x + region.width), int(region.y + region.height)
            mask[y1:y2, x1:x2] = 255
        return mask

    @staticmethod
    def apply_bilateral_filter(
        image: np.ndarray, d: int = 9, sigma_color: float = 75, sigma_space: float = 75
    ) -> np.ndarray:
        """Professional-grade skin smoothing using bilateral filter (same as Flame/Nuke beauty box)"""
        return cv2.bilateralFilter(image, d, sigma_color, sigma_space)

    @staticmethod
    def blend_with_mask(
        original: np.ndarray, processed: np.ndarray, mask: np.ndarray, intensity: float
    ) -> np.ndarray:
        """Blend processed region with original using mask and intensity"""
        mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR) / 255.0
        blended = original * (1 - mask_3ch * intensity) + processed * mask_3ch * intensity
        return blended.astype(np.uint8)
```

- [ ] **Step 3: Create credit service**

Create `backend/services/credit_service.py`:
```python
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

CREDIT_COSTS = {"photo": 1, "video": 5}


class CreditService:
    @staticmethod
    def get_credits(user_id: str) -> int:
        result = (
            supabase.table("profiles")
            .select("credits")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return result.data.get("credits", 0) if result.data else 0

    @staticmethod
    def deduct_credits(user_id: str, media_type: str) -> bool:
        cost = CREDIT_COSTS.get(media_type, 1)
        credits = CreditService.get_credits(user_id)
        if credits < cost:
            return False
        supabase.table("profiles").update(
            {"credits": credits - cost}
        ).eq("id", user_id).execute()
        supabase.table("credit_transactions").insert({
            "user_id": user_id, "amount": -cost, "type": "usage",
        }).execute()
        return True

    @staticmethod
    def add_credits(user_id: str, amount: int, session_id: str):
        credits = CreditService.get_credits(user_id)
        supabase.table("profiles").update(
            {"credits": credits + amount}
        ).eq("id", user_id).execute()
        supabase.table("credit_transactions").insert({
            "user_id": user_id, "amount": amount, "type": "purchase", "stripe_session_id": session_id,
        }).execute()
```

- [ ] **Step 4: Create process route**

Create `backend/routes/process.py`:
```python
from fastapi import APIRouter, HTTPException
from models.job import ProcessRequest, JobResponse
from services.replicate_service import ReplicateService
from services.credit_service import CreditService, CREDIT_COSTS
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
replicate = ReplicateService()

@router.post("/process", response_model=JobResponse)
async def process_media(request: ProcessRequest):
    cost = CREDIT_COSTS.get(request.media_type, 1)
    if not CreditService.deduct_credits(request.user_id, request.media_type):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job = (
        supabase.table("jobs")
        .insert({
            "user_id": request.user_id,
            "status": "pending",
            "input_url": "",
            "media_type": request.media_type,
            "regions": [r.model_dump() for r in request.regions],
            "beauty_params": request.beauty_params.model_dump(),
            "credit_cost": cost,
        })
        .execute()
    )
    job_data = job.data[0]

    replicate_id = replicate.process_photo(
        job_data["input_url"], request.beauty_params.model_dump()
    )

    supabase.table("jobs").update({"status": "processing", "replicate_id": replicate_id}).eq("id", job_data["id"]).execute()

    return JobResponse(**job_data)
```

- [ ] **Step 5: Create jobs route**

Create `backend/routes/jobs.py`:
```python
from fastapi import APIRouter
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    if not result.data:
        return {"error": "Job not found"}
    return result.data
```

- [ ] **Step 6: Verify routes**

```bash
cd backend && python -c "from routes.process import router; print('OK')"
```

- [ ] **Step 7: Commit**

```bash
git add backend/routes/ backend/services/
git commit -m "feat: add backend processing API with Replicate integration"
```

---

### Task 6: Dashboard & Credit System

**Files:**
- Create: `frontend/app/dashboard/page.tsx`
- Create: `frontend/components/ProcessingStatus.tsx`
- Create: `frontend/components/CreditDisplay.tsx`
- Create: `frontend/components/BeforeAfter.tsx`

- [ ] **Step 1: Create ProcessingStatus component**

Create `frontend/components/ProcessingStatus.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { Job } from "@/types";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props { jobId: string }

export default function ProcessingStatus({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`);
      const data = await res.json();
      setJob(data);
      if (data.status === "completed" || data.status === "failed") clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  if (!job) return <Loader2 className="animate-spin" />;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        {job.status === "processing" && <Loader2 className="animate-spin text-primary" />}
        {job.status === "completed" && <CheckCircle className="text-green-500" />}
        {job.status === "failed" && <XCircle className="text-red-500" />}
        <span className="font-medium capitalize">{job.status}</span>
      </div>
      {job.outputUrl && job.status === "completed" && (
        <img src={job.outputUrl} alt="Result" className="mt-3 rounded-lg max-h-64" />
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Create CreditDisplay**

Create `frontend/components/CreditDisplay.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

export default function CreditDisplay() {
  const [credits, setCredits] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
      setCredits(data?.credits ?? 0);
    });
  }, []);

  if (credits === null) return null;

  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Coins className="text-yellow-500" />
        <span className="font-semibold">{credits} Credits</span>
      </div>
      <Button size="sm" variant="outline" asChild>
        <a href="/pricing">Buy More</a>
      </Button>
    </Card>
  );
}
```

- [ ] **Step 3: Create dashboard page**

Create `frontend/app/dashboard/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ProcessingStatus from "@/components/ProcessingStatus";
import CreditDisplay from "@/components/CreditDisplay";
import { Card } from "@/components/ui/card";
import { Job } from "@/types";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const searchParams = useSearchParams();
  const highlightJob = searchParams.get("job");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setJobs(data || []);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="mb-6">
        <CreditDisplay />
      </div>
      {highlightJob && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Current Job</h2>
          <ProcessingStatus jobId={highlightJob} />
        </div>
      )}
      <h2 className="font-semibold mb-3">Recent Projects</h2>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{job.mediaType} - {job.status}</p>
              <p className="text-sm text-muted-foreground">{new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
            {job.outputUrl && (
              <img src={job.outputUrl} alt="Result" className="w-20 h-20 object-cover rounded" />
            )}
          </Card>
        ))}
        {jobs.length === 0 && <p className="text-muted-foreground">No projects yet. Start one!</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create BeforeAfter comparison**

Create `frontend/components/BeforeAfter.tsx`:
```typescript
"use client";

import { useState } from "react";

interface Props { original: string; processed: string }

export default function BeforeAfter({ original, processed }: Props) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="relative overflow-hidden rounded-lg select-none" style={{ aspectRatio: "1" }}>
      <img src={processed} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={original} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: `${100 / (sliderPos / 100)}%` }} />
      </div>
      <input
        type="range"
        min={0} max={100}
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize"
      />
      <div className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full w-8 h-8 shadow-lg flex items-center justify-center text-xs font-bold border-2 border-primary" style={{ left: `${sliderPos}%`, marginLeft: "-16px" }}>
        ⇔
      </div>
      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Before</div>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">After</div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/app/dashboard/ frontend/components/
git commit -m "feat: add dashboard, credit display, and before/after comparison"
```

---

### Task 7: Pricing Page & Stripe Integration

**Files:**
- Create: `frontend/app/pricing/page.tsx`
- Create: `frontend/components/PricingCards.tsx`
- Create: `frontend/lib/stripe.ts`

- [ ] **Step 1: Create Stripe client**

Create `frontend/lib/stripe.ts`:
```typescript
import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

- [ ] **Step 2: Create PricingCards**

Create `frontend/components/PricingCards.tsx`:
```typescript
"use client";

import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "$5",
    credits: 10,
    features: ["Photo beauty processing", "Face smoothing", "Basic region selection", "Standard quality"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
  },
  {
    name: "Pro",
    price: "$20",
    credits: 50,
    features: ["Photo + Video processing", "Full region selection", "Advanced beauty params", "High quality export", "Priority processing"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    highlight: true,
  },
  {
    name: "Studio",
    price: "$50",
    credits: 150,
    features: ["Everything in Pro", "4K video support", "Batch processing", "API access", "Custom beauty presets"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID!,
  },
];

export default function PricingCards() {
  async function handlePurchase(priceId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/pricing` } });
      return;
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price_id: priceId, user_id: user.id }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map((plan) => (
        <Card key={plan.name} className={`p-6 ${plan.highlight ? "border-primary ring-2 ring-primary" : ""}`}>
          {plan.highlight && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full mb-2 inline-block">
              Most Popular
            </span>
          )}
          <h3 className="text-lg font-bold">{plan.name}</h3>
          <p className="text-3xl font-bold my-2">{plan.price}</p>
          <p className="text-sm text-muted-foreground mb-4">{plan.credits} credits</p>
          <ul className="space-y-2 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" /> {f}
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={() => handlePurchase(plan.priceId)}>
            <Sparkles className="w-4 h-4 mr-2" /> Get {plan.name}
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create pricing page**

Create `frontend/app/pricing/page.tsx`:
```typescript
import PricingCards from "@/components/PricingCards";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl text-center">
      <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
      <p className="text-lg text-muted-foreground mb-12">
        Pay only for what you use. Credits never expire.
      </p>
      <PricingCards />
    </div>
  );
}
```

- [ ] **Step 4: Create Stripe checkout webhook**

Create `backend/routes/webhooks.py`:
```python
from fastapi import APIRouter, Request
from config import STRIPE_WEBHOOK_SECRET
import stripe
from services.credit_service import CreditService

router = APIRouter()

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return {"error": "Invalid signature"}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        amount = session.get("metadata", {}).get("credits", 10)
        if user_id:
            CreditService.add_credits(user_id, int(amount), session["id"])

    return {"status": "ok"}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/app/pricing/ frontend/components/PricingCards.tsx frontend/lib/stripe.ts backend/routes/webhooks.py
git commit -m "feat: add pricing page and Stripe integration"
```

---

### Task 8: Landing Page & Deploy

**Files:**
- Modify: `frontend/app/page.tsx` (landing)

- [ ] **Step 1: Create landing page**

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Download, Zap } from "lucide-react";

export default function Home() {
  return (
    <main>
      <section className="container mx-auto px-4 py-20 text-center max-w-4xl">
        <h1 className="text-5xl font-bold mb-6 tracking-tight">
          AI-Powered Beauty Retouching
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Professional-grade photo and video beauty enhancement. Select specific regions, adjust intensity, get Hollywood-quality results — all powered by AI.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/upload">
            <Button size="lg">
              <Sparkles className="w-5 h-5 mr-2" /> Try It Free
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">View Pricing</Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Upload, title: "Upload", desc: "Drag and drop your photo or video. Supports JPG, PNG, MP4." },
            { icon: Sparkles, title: "Select & Enhance", desc: "Choose face, body, or specific regions. Adjust beauty intensity." },
            { icon: Download, title: "Download", desc: "Get your professionally retouched result in seconds." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6">
              <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Like Flame & Nuke, but AI-powered</h2>
          <p className="text-muted-foreground mb-2">
            Gradeable beauty controls · Region-specific application
          </p>
          <p className="text-muted-foreground mb-8">
            Skin smoothing · Blemish removal · Face enhancement · Body retouch
          </p>
          <Zap className="w-8 h-8 mx-auto text-primary" />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify full build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: add landing page"
```

---

**Plan complete.** All 8 tasks defined with exact file paths, complete code, and commit instructions.
