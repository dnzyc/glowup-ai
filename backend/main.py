from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes import process, jobs, webhooks, stripe_routes, admin
from services.rate_limit import rate_limiter

app = FastAPI(title="GlowUp AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://glowup-ai-chi.vercel.app",
        "https://glowup-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    rate_limiter(request)
    response = await call_next(request)
    return response

app.include_router(process.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(stripe_routes.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "service": "GlowUp AI"}


@app.get("/debug")
def debug():
    import config
    return {
        "supabase_url": bool(config.SUPABASE_URL),
        "supabase_key": bool(config.SUPABASE_KEY),
        "stripe_key": bool(config.STRIPE_SECRET_KEY),
        "frontend_url": config.FRONTEND_URL,
    }


@app.get("/debug-db")
def debug_db():
    import traceback
    from supabase import create_client
    import config
    try:
        supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
        return {"client": "created"}
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}", "trace": traceback.format_exc()}
