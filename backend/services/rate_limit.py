"""Rate limiting and error handling middleware."""
from fastapi import Request, HTTPException
from collections import defaultdict
import time


class RateLimiter:
    """Simple in-memory rate limiter. Per-IP, 100 req/min."""

    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < self.window]
        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(status_code=429, detail="Too many requests. Try again later.")
        self.requests[client_ip].append(now)


rate_limiter = RateLimiter(max_requests=100)
