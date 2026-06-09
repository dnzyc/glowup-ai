"""
Media Orchestrator — extracted orchestration logic from process.py.

Provides clear seams for testing by breaking the monolithic process flow
into discrete, mockable steps. Uses dependency injection for repositories.
"""
import os
import tempfile
import base64
import logging
import traceback
from datetime import datetime, timezone
from typing import Any

from models.job import BeautyParams, Region
from services.beauty_pipeline import BeautyPipeline
from services.credit_service import CREDIT_COSTS
from services.repositories.job_repository import JobRepository
from services.repositories.storage_repository import StorageRepository


class MediaOrchestrator:
    """Orchestrates the media processing pipeline with clear seams for testing."""

    def __init__(self, job_repo: JobRepository = None, storage_repo: StorageRepository = None):
        self.job_repo = job_repo or JobRepository()
        self.storage_repo = storage_repo or StorageRepository()

    async def process(
        self,
        file: Any,
        user_id: str,
        media_type: str,
        output_format: str,
        params: BeautyParams,
        regions: list[Region],
    ) -> dict:
        cost = CREDIT_COSTS.get(media_type, 1)

        # TEMPORARY: Credit check disabled for testing
        # self._check_credits(user_id, media_type)

        # Save uploaded file
        input_path, ext = await self._save_temp_file(file)

        # Create job record (skip for anonymous users due to FK constraint)
        job_data, has_job = self._create_job_record(user_id, media_type, file.filename, cost)

        output_path = None
        try:
            # Run the beauty pipeline
            output_path = self._run_pipeline(input_path, media_type, output_format, params, regions)

            if has_job:
                # Upload result to storage and update job
                result_url = self._upload_result(output_path, user_id, job_data["id"], ext)
                self.job_repo.update_job_status(job_data["id"], "completed", output_url=result_url)
                return {"job_id": job_data["id"], "status": "completed"}
            else:
                # Anonymous user: return base64
                with open(output_path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode()
                return {"status": "completed", "image_base64": b64, "format": ext}

        except Exception as e:
            if has_job:
                try:
                    self.job_repo.update_job_status(job_data["id"], "failed")
                except Exception:
                    logging.warning("Failed to update job %s status to failed", job_data["id"])
            raise Exception(f"{type(e).__name__}: {e}\n{traceback.format_exc()}")

        finally:
            self._cleanup(input_path, output_path)

    async def _save_temp_file(self, file: Any) -> tuple[str, str]:
        """Save uploaded file to a temporary location. Returns (path, extension)."""
        ext = os.path.splitext(file.filename or "image.png")[1]
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(await file.read())
            return tmp.name, ext

    def _check_credits(self, user_id: str, media_type: str) -> int:
        """Check and deduct credits. Currently disabled for testing."""
        cost = CREDIT_COSTS.get(media_type, 1)
        # TEMPORARY: CreditService.deduct_credits(user_id, media_type)
        return cost

    def _create_job_record(
        self,
        user_id: str,
        media_type: str,
        filename: str,
        cost: int,
    ) -> tuple[dict, bool]:
        """Create a job record. Returns (job_data, has_job)."""
        try:
            job_data = self.job_repo.create_job(user_id, "processing", filename, media_type, cost)
            return job_data, True
        except Exception as e:
            logging.warning("Failed to create job record for user %s: %s", user_id, e)
            return {}, False

    def _run_pipeline(
        self,
        input_path: str,
        media_type: str,
        output_format: str,
        params: BeautyParams,
        regions: list[Region],
    ) -> str:
        """Run the beauty pipeline. Returns output file path."""
        if media_type == "video":
            return BeautyPipeline.process_video(input_path, params, output_format=output_format, regions=regions or None)
        else:
            return BeautyPipeline.process_photo(input_path, params, regions=regions or None)

    def _upload_result(
        self,
        output_path: str,
        user_id: str,
        job_id: str,
        ext: str,
    ) -> str:
        """Upload processed result to storage. Returns public URL."""
        with open(output_path, "rb") as f:
            file_bytes = f.read()
        return self.storage_repo.upload_result(user_id, job_id, file_bytes, ext)

    def _cleanup(self, input_path: str, output_path: str | None) -> None:
        """Remove temporary files."""
        if input_path and os.path.exists(input_path):
            os.unlink(input_path)
        if output_path and os.path.exists(output_path):
            os.unlink(output_path)
