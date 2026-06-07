"""
Tests for Pydantic models in models/job.py.

Covers:
- BeautyParams: default values, field types, boundary values
- BeautyParams: invalid values (negative, >100)
- ProcessRequest: validation, nested model, default values
- Region: basic construction
- JobResponse: optional fields
"""

import pytest
from uuid import UUID, uuid4
from datetime import datetime

from models.job import Region, BeautyParams, ProcessRequest, JobResponse


# ──────────────────────────────────────────────
# BeautyParams
# ──────────────────────────────────────────────

class TestBeautyParams:
    """Tests for BeautyParams model."""

    # ── Default values ────────────────────────

    def test_default_values(self):
        """BeautyParams should have correct default values."""
        params = BeautyParams()
        assert params.smoothing == 50
        assert params.brightening == 30
        assert params.sharpening == 20
        assert params.blemish_removal == 0

    def test_default_instance_is_equivalent_to_explicit(self):
        """Explicit defaults should match BeautyParams()."""
        explicit = BeautyParams(smoothing=50, brightening=30, sharpening=20, blemish_removal=0)
        assert explicit == BeautyParams()

    # ── Type enforcement ──────────────────────

    def test_all_fields_are_int(self):
        params = BeautyParams()
        assert isinstance(params.brightening, int)
        assert isinstance(params.sharpening, int)
        assert isinstance(params.blemish_removal, int)

    def test_float_coerced_to_int(self):
        """Pydantic v2 strict: float → int fails with ValidationError."""
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            BeautyParams(smoothing=50.5)

    # ── "Invalid" values (accepted because no validators exist) ──

    def test_negative_values_accepted(self):
        """Negative values are stored as-is (no Field constraints)."""
        params = BeautyParams(smoothing=-10, brightening=-5, sharpening=-3, blemish_removal=-1)
        assert params.smoothing == -10
        assert params.brightening == -5
        assert params.sharpening == -3
        assert params.blemish_removal == -1

    def test_above_100_values_accepted(self):
        """Values > 100 are stored as-is (no Field constraints)."""
        params = BeautyParams(smoothing=150, brightening=200, sharpening=999, blemish_removal=500)
        assert params.smoothing == 150
        assert params.brightening == 200
        assert params.sharpening == 999
        assert params.blemish_removal == 500

    # ── Boundary values (0, 50, 100) ──────────

    @pytest.mark.parametrize("field", ["smoothing", "brightening", "sharpening", "blemish_removal"])
    def test_boundary_zero(self, field):
        params = BeautyParams(**{field: 0})
        assert getattr(params, field) == 0

    @pytest.mark.parametrize("field", ["smoothing", "brightening", "sharpening", "blemish_removal"])
    def test_boundary_fifty(self, field):
        params = BeautyParams(**{field: 50})
        assert getattr(params, field) == 50

    @pytest.mark.parametrize("field", ["smoothing", "brightening", "sharpening", "blemish_removal"])
    def test_boundary_hundred(self, field):
        params = BeautyParams(**{field: 100})
        assert getattr(params, field) == 100

    # ── Partial construction ───────────────────

    def test_partial_override_keeps_defaults(self):
        """Overriding one field should keep defaults for the rest."""
        params = BeautyParams(smoothing=80)
        assert params.smoothing == 80
        assert params.brightening == 30  # default
        assert params.sharpening == 20   # default
        assert params.blemish_removal == 0  # default

    # ── Serialization ─────────────────────────

    def test_model_dump(self):
        params = BeautyParams(smoothing=70, blemish_removal=15)
        dumped = params.model_dump()
        assert dumped == {"smoothing": 70, "brightening": 30, "sharpening": 20, "blemish_removal": 15}

    def test_model_dump_json(self):
        params = BeautyParams()
        json_str = params.model_dump_json()
        assert '"smoothing":50' in json_str
        assert '"brightening":30' in json_str


# ──────────────────────────────────────────────
# Region
# ──────────────────────────────────────────────

class TestRegion:
    def test_valid_region(self):
        r = Region(id="face", name="Face", x=10.0, y=20.0, width=100.0, height=80.0)
        assert r.id == "face"
        assert r.name == "Face"
        assert r.x == 10.0
        assert r.y == 20.0
        assert r.width == 100.0
        assert r.height == 80.0

    def test_zero_dimensions(self):
        r = Region(id="z", name="Zero", x=0.0, y=0.0, width=0.0, height=0.0)
        assert r.width == 0.0
        assert r.height == 0.0

    def test_negative_dimensions_accepted(self):
        """Negative width/height are accepted (no validators)."""
        r = Region(id="neg", name="Neg", x=0.0, y=0.0, width=-10.0, height=-5.0)
        assert r.width == -10.0


# ──────────────────────────────────────────────
# ProcessRequest
# ──────────────────────────────────────────────

class TestProcessRequest:
    def test_minimal_request(self):
        req = ProcessRequest(user_id="user-1", media_type="photo")
        assert req.user_id == "user-1"
        assert req.media_type == "photo"
        assert req.input_url == ""
        assert req.regions == []
        assert req.beauty_params == BeautyParams()

    def test_full_request(self):
        params = BeautyParams(smoothing=60, brightening=40)
        regions = [
            Region(id="r1", name="Eyes", x=0, y=0, width=50, height=50),
        ]
        req = ProcessRequest(
            user_id="user-2",
            media_type="video",
            input_url="https://example.com/video.mp4",
            regions=regions,
            beauty_params=params,
        )
        assert req.user_id == "user-2"
        assert req.media_type == "video"
        assert req.input_url == "https://example.com/video.mp4"
        assert len(req.regions) == 1
        assert req.regions[0].id == "r1"
        assert req.beauty_params.smoothing == 60

    def test_regions_empty_by_default(self):
        req = ProcessRequest(user_id="u", media_type="photo")
        assert req.regions == []

    def test_beauty_params_default_instance(self):
        req = ProcessRequest(user_id="u", media_type="photo")
        assert req.beauty_params.smoothing == 50
        assert req.beauty_params.brightening == 30

    def test_missing_required_user_id(self):
        with pytest.raises(Exception):
            ProcessRequest(media_type="photo")

    def test_missing_required_media_type(self):
        with pytest.raises(Exception):
            ProcessRequest(user_id="u")


# ──────────────────────────────────────────────
# JobResponse
# ──────────────────────────────────────────────

class TestJobResponse:
    @pytest.fixture
    def job_id(self):
        return uuid4()

    @pytest.fixture
    def now(self):
        return datetime.utcnow()

    def test_valid_job_response(self, job_id, now):
        resp = JobResponse(
            id=job_id,
            user_id="user-1",
            status="completed",
            input_url="https://example.com/img.jpg",
            output_url="https://example.com/out.jpg",
            media_type="photo",
            credit_cost=5,
            created_at=now,
            completed_at=now,
        )
        assert resp.id == job_id
        assert resp.status == "completed"
        assert resp.output_url == "https://example.com/out.jpg"
        assert resp.credit_cost == 5

    def test_output_url_optional(self, job_id, now):
        """output_url and completed_at can be None."""
        resp = JobResponse(
            id=job_id,
            user_id="u",
            status="processing",
            input_url="https://example.com/img.jpg",
            media_type="photo",
            credit_cost=3,
            created_at=now,
        )
        assert resp.output_url is None
        assert resp.completed_at is None

    def test_id_is_uuid(self, job_id, now):
        resp = JobResponse(
            id=job_id,
            user_id="u",
            status="queued",
            input_url="x",
            media_type="photo",
            credit_cost=1,
            created_at=now,
        )
        assert isinstance(resp.id, UUID)

    def test_created_at_is_datetime(self, job_id, now):
        resp = JobResponse(
            id=job_id,
            user_id="u",
            status="queued",
            input_url="x",
            media_type="photo",
            credit_cost=1,
            created_at=now,
        )
        assert isinstance(resp.created_at, datetime)
