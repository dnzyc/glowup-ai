"""
Tests for the in-memory rate limiter in services/rate_limit.py.

Scenarios:
- Normal request passes through (no exception)
- Rate limit exceeded → HTTPException with status 429
- Different IPs tracked independently
- Window expiry: old timestamps are pruned
"""

import time
import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock

from services.rate_limit import RateLimiter


# ──────────────────────────────────────────────
# Helpers: build a fake FastAPI Request
# ──────────────────────────────────────────────

def _make_request(ip: str) -> MagicMock:
    """Return a mock FastAPI Request with a given client IP."""
    req = MagicMock()
    req.client = MagicMock()
    req.client.host = ip
    return req


# ──────────────────────────────────────────────
# Test class
# ──────────────────────────────────────────────

class TestRateLimiter:
    """Comprehensive tests for RateLimiter."""

    # ── Normal request passes ──────────────────

    def test_single_request_passes(self):
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        req = _make_request("192.168.1.1")
        # Should not raise
        limiter(req)

    def test_multiple_requests_within_limit_pass(self):
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        req = _make_request("192.168.1.2")
        for _ in range(5):
            limiter(req)  # all should pass silently

    def test_request_at_exact_limit_passes(self):
        """max_requests is tested with < (not ≤), so the Nth request passes."""
        # The code checks: if len(...) >= max_requests → raise
        # So request #1 through #max_requests pass, #max_requests+1 fails
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        req = _make_request("10.0.0.1")
        limiter(req)  # 1
        limiter(req)  # 2
        limiter(req)  # 3 — passes
        with pytest.raises(HTTPException) as exc_info:
            limiter(req)  # 4 — fails
        assert exc_info.value.status_code == 429

    # ── Rate limit exceeded → 429 ─────────────

    def test_exceeding_limit_raises_429(self):
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        req = _make_request("10.0.0.2")
        for _ in range(3):
            limiter(req)

        with pytest.raises(HTTPException) as exc_info:
            limiter(req)
        assert exc_info.value.status_code == 429
        assert "Too many requests" in exc_info.value.detail

    def test_429_raised_on_every_subsequent_call(self):
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        req = _make_request("10.0.0.3")
        limiter(req)
        limiter(req)

        # Every subsequent call should raise 429
        for _ in range(5):
            with pytest.raises(HTTPException) as exc_info:
                limiter(req)
            assert exc_info.value.status_code == 429

    # ── Different IPs are independent ──────────

    def test_different_ips_are_independent(self):
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        req_a = _make_request("192.168.1.100")
        req_b = _make_request("192.168.1.200")

        # Exhaust IP A
        limiter(req_a)
        limiter(req_a)

        # IP A should now be blocked
        with pytest.raises(HTTPException) as exc:
            limiter(req_a)
        assert exc.value.status_code == 429

        # IP B should still pass (independent)
        limiter(req_b)  # passes
        limiter(req_b)  # passes

        # IP B 3rd call → blocked
        with pytest.raises(HTTPException) as exc:
            limiter(req_b)
        assert exc.value.status_code == 429

    def test_many_different_ips_each_have_own_limit(self):
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        for i in range(20):
            req = _make_request(f"10.0.0.{i}")
            limiter(req)
            limiter(req)
            # 3rd call for each IP should fail
            with pytest.raises(HTTPException) as exc:
                limiter(req)
            assert exc.value.status_code == 429

    # ── Window expiry ──────────────────────────

    def test_old_timestamps_are_pruned(self):
        """After the window passes, stale timestamps are removed."""
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        req = _make_request("172.16.0.1")

        # Artificially insert old timestamps
        old_time = time.time() - 120  # 2 minutes ago
        limiter.requests["172.16.0.1"] = [old_time, old_time, old_time, old_time, old_time]

        # All old timestamps should be pruned, so request passes
        limiter(req)
        assert len(limiter.requests["172.16.0.1"]) == 1  # only the new one remains

    def test_partial_window_expiry(self):
        """Only timestamps older than window are removed."""
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        req = _make_request("172.16.0.2")

        now = time.time()
        limiter.requests["172.16.0.2"] = [
            now - 120,   # expired
            now - 90,    # expired
            now - 30,    # still valid
            now - 10,    # still valid
        ]

        limiter(req)
        # 2 expired removed, 2 valid + 1 new = 3
        assert len(limiter.requests["172.16.0.2"]) == 3

    # ── Custom window / max_requests ───────────

    def test_custom_max_requests(self):
        limiter = RateLimiter(max_requests=10, window_seconds=60)
        req = _make_request("10.0.0.10")
        for _ in range(10):
            limiter(req)  # all pass
        with pytest.raises(HTTPException) as exc:
            limiter(req)
        assert exc.value.status_code == 429

    def test_short_window(self):
        """With a very short window, limit is hit quickly."""
        limiter = RateLimiter(max_requests=3, window_seconds=1)
        req = _make_request("10.0.0.20")
        for _ in range(3):
            limiter(req)
        with pytest.raises(HTTPException) as exc:
            limiter(req)
        assert exc.value.status_code == 429

    def test_large_window(self):
        """Large window still respects max_requests."""
        limiter = RateLimiter(max_requests=2, window_seconds=3600)
        req = _make_request("10.0.0.30")
        limiter(req)
        limiter(req)
        with pytest.raises(HTTPException) as exc:
            limiter(req)
        assert exc.value.status_code == 429

    # ── Edge cases ─────────────────────────────

    def test_max_requests_zero_always_blocks(self):
        limiter = RateLimiter(max_requests=0, window_seconds=60)
        req = _make_request("10.0.0.99")
        with pytest.raises(HTTPException) as exc:
            limiter(req)
        assert exc.value.status_code == 429

    def test_max_requests_one(self):
        limiter = RateLimiter(max_requests=1, window_seconds=60)
        req = _make_request("10.0.0.50")
        limiter(req)  # passes
        with pytest.raises(HTTPException) as exc:
            limiter(req)
        assert exc.value.status_code == 429

    def test_unknown_client_ip(self):
        """Request with no client info uses 'unknown' as key."""
        limiter = RateLimiter(max_requests=1, window_seconds=60)
        req = MagicMock()
        req.client = None
        limiter(req)  # passes with key "unknown"
        with pytest.raises(HTTPException) as exc:
            limiter(req)
        assert exc.value.status_code == 429


# ──────────────────────────────────────────────
# Module-level rate_limiter instance
# ──────────────────────────────────────────────

class TestModuleLevelRateLimiter:
    """Test the pre-created rate_limiter singleton."""

    def test_default_instance_has_expected_config(self):
        from services.rate_limit import rate_limiter
        assert rate_limiter.max_requests == 100
        assert rate_limiter.window == 60

    def test_default_instance_works(self):
        from services.rate_limit import rate_limiter
        req = _make_request("192.168.200.1")
        rate_limiter(req)  # should not raise

        # Clean up — remove the IP we just added
        rate_limiter.requests.pop("192.168.200.1", None)
