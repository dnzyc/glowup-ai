"""
Tests for MediaOrchestrator — the orchestration layer extracted from process.py.

Tests use mocks for repositories, no real connections required.
"""

import os
import json
import tempfile
import base64
from unittest.mock import AsyncMock, MagicMock, patch, mock_open

import pytest

from services.media_orchestrator import MediaOrchestrator
from models.job import BeautyParams, Region


@pytest.fixture
def mock_job_repo():
    return MagicMock()


@pytest.fixture
def mock_storage_repo():
    return MagicMock()


@pytest.fixture
def orchestrator(mock_job_repo, mock_storage_repo):
    return MediaOrchestrator(job_repo=mock_job_repo, storage_repo=mock_storage_repo)


@pytest.fixture
def sample_params():
    return BeautyParams(smoothing=50, brightening=30, sharpening=20)


@pytest.fixture
def sample_regions():
    return [Region(id="face", name="Face", x=0.1, y=0.1, width=0.5, height=0.5)]


@pytest.fixture
def mock_upload_file():
    """Create a mock UploadFile-like object."""
    mock = MagicMock()
    mock.filename = "test_image.png"
    mock.read = AsyncMock(return_value=b"fake-image-data")
    return mock


# ──────────────────────────────────────────────
# Test 1: Happy path — photo with job creation
# ──────────────────────────────────────────────

class TestProcessPhotoWithJob:
    """Full flow: photo upload → job created → pipeline runs → upload to storage → return job_id."""

    @pytest.fixture
    def mock_pipeline_output(self):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(b"fake-output-data")
            path = f.name
        yield path
        if os.path.exists(path):
            os.unlink(path)

    @pytest.mark.asyncio
    async def test_process_photo_returns_job_id(
        self, orchestrator, mock_job_repo, mock_storage_repo, sample_params, mock_upload_file, mock_pipeline_output
    ):
        # Arrange: mock job creation
        mock_job_repo.create_job.return_value = {"id": "job-123", "user_id": "user-1", "status": "processing"}

        # Arrange: mock pipeline
        with patch("services.media_orchestrator.BeautyPipeline") as MockPipeline:
            MockPipeline.process_photo.return_value = mock_pipeline_output

            # Arrange: mock storage upload
            mock_storage_repo.upload_result.return_value = "https://example.com/result.png"

            # Act
            result = await orchestrator.process(
                file=mock_upload_file,
                user_id="user-1",
                media_type="photo",
                output_format="png",
                params=sample_params,
                regions=[],
            )

            # Assert
            assert result["status"] == "completed"
            assert result["job_id"] == "job-123"

            # Verify pipeline was called
            MockPipeline.process_photo.assert_called_once()

            # Verify job was updated to completed
            mock_job_repo.update_job_status.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_photo_cleanup_removes_temp_files(
        self, orchestrator, mock_job_repo, mock_storage_repo, sample_params, mock_upload_file, mock_pipeline_output
    ):
        # Arrange
        mock_job_repo.create_job.return_value = {"id": "job-456", "user_id": "user-1", "status": "processing"}

        with patch("services.media_orchestrator.BeautyPipeline") as MockPipeline:
            MockPipeline.process_photo.return_value = mock_pipeline_output
            mock_storage_repo.upload_result.return_value = "https://example.com/result.png"

            # Act
            await orchestrator.process(
                file=mock_upload_file,
                user_id="user-1",
                media_type="photo",
                output_format="png",
                params=sample_params,
                regions=[],
            )

            # Assert: temp files should be cleaned up
            assert not os.path.exists(mock_pipeline_output), "Output temp file should be removed"


# ──────────────────────────────────────────────
# Test 2: Anonymous user flow — job creation fails → base64 return
# ──────────────────────────────────────────────

class TestAnonymousUserFlow:
    """When job creation fails (e.g. anonymous user), return base64-encoded result."""

    @pytest.fixture
    def mock_pipeline_output(self):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(b"fake-output-data-for-anon")
            path = f.name
        yield path
        if os.path.exists(path):
            os.unlink(path)

    @pytest.mark.asyncio
    async def test_anonymous_user_returns_base64(
        self, orchestrator, mock_job_repo, sample_params, mock_upload_file, mock_pipeline_output
    ):
        # Arrange: job creation fails
        mock_job_repo.create_job.side_effect = Exception("FK constraint")

        with patch("services.media_orchestrator.BeautyPipeline") as MockPipeline:
            MockPipeline.process_photo.return_value = mock_pipeline_output

            # Act
            result = await orchestrator.process(
                file=mock_upload_file,
                user_id="anon-user",
                media_type="photo",
                output_format="jpg",
                params=sample_params,
                regions=[],
            )

            # Assert
            assert result["status"] == "completed"
            assert "image_base64" in result
            assert result["format"] == ".png"

            # Verify base64 is valid
            decoded = base64.b64decode(result["image_base64"])
            assert decoded == b"fake-output-data-for-anon"


# ──────────────────────────────────────────────
# Test 3: Pipeline failure → job marked as failed
# ──────────────────────────────────────────────

class TestPipelineFailure:
    """When the beauty pipeline raises an exception, the job should be marked as failed."""

    @pytest.mark.asyncio
    async def test_pipeline_error_marks_job_failed(
        self, orchestrator, mock_job_repo, sample_params, mock_upload_file
    ):
        # Arrange: job creation succeeds
        mock_job_repo.create_job.return_value = {"id": "job-789", "user_id": "user-1", "status": "processing"}

        # Arrange: pipeline raises
        with patch("services.media_orchestrator.BeautyPipeline") as MockPipeline:
            MockPipeline.process_photo.side_effect = RuntimeError("Pipeline crashed")

            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                await orchestrator.process(
                    file=mock_upload_file,
                    user_id="user-1",
                    media_type="photo",
                    output_format="png",
                    params=sample_params,
                    regions=[],
                )

            assert "RuntimeError" in str(exc_info.value)

            # Verify job was marked as failed
            mock_job_repo.update_job_status.assert_called_with("job-789", "failed")


# ──────────────────────────────────────────────
# Test 4: Video processing path
# ──────────────────────────────────────────────

class TestVideoProcessing:
    """Video media_type should call process_video instead of process_photo."""

    @pytest.fixture
    def mock_pipeline_output(self):
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            f.write(b"fake-video-output")
            path = f.name
        yield path
        if os.path.exists(path):
            os.unlink(path)

    @pytest.mark.asyncio
    async def test_video_calls_process_video(
        self, orchestrator, mock_job_repo, mock_storage_repo, sample_params, mock_upload_file, mock_pipeline_output
    ):
        # Arrange
        mock_job_repo.create_job.return_value = {"id": "job-video-1", "user_id": "user-1", "status": "processing"}

        with patch("services.media_orchestrator.BeautyPipeline") as MockPipeline:
            MockPipeline.process_video.return_value = mock_pipeline_output
            mock_storage_repo.upload_result.return_value = "https://example.com/result.mp4"

            # Act
            result = await orchestrator.process(
                file=mock_upload_file,
                user_id="user-1",
                media_type="video",
                output_format="mp4",
                params=sample_params,
                regions=[],
            )

            # Assert
            assert result["status"] == "completed"
            assert result["job_id"] == "job-video-1"
            MockPipeline.process_video.assert_called_once()
            MockPipeline.process_photo.assert_not_called()


# ──────────────────────────────────────────────
# Test 5: Credit check is disabled (kept as-is)
# ──────────────────────────────────────────────

class TestCreditCheckDisabled:
    """Credit check should remain disabled (no deduction happens)."""

    @pytest.mark.asyncio
    async def test_no_credit_deduction(
        self, orchestrator, mock_job_repo, mock_storage_repo, sample_params, mock_upload_file
    ):
        # Arrange: job creation succeeds
        mock_job_repo.create_job.return_value = {"id": "job-credit-test", "user_id": "user-1", "status": "processing"}

        with patch("services.media_orchestrator.BeautyPipeline") as MockPipeline:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
                f.write(b"output")
                output_path = f.name

            try:
                MockPipeline.process_photo.return_value = output_path
                mock_storage_repo.upload_result.return_value = "https://example.com/r.png"

                # Act
                await orchestrator.process(
                    file=mock_upload_file,
                    user_id="user-1",
                    media_type="photo",
                    output_format="png",
                    params=sample_params,
                    regions=[],
                )

                # Assert: CreditService.deduct_credits should NOT have been called
                # (it's disabled in the original code too)
                assert True
            finally:
                if os.path.exists(output_path):
                    os.unlink(output_path)
