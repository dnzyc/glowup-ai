from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes import process, jobs, webhooks, stripe_routes
from services.rate_limit import rate_limiter

app = FastAPI(title="GlowUp AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


@app.get("/")
def root():
    return {"status": "ok", "service": "GlowUp AI"}
