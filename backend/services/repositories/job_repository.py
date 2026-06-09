"""
Job Repository — encapsulates all job-related Supabase operations.
"""

from datetime import datetime, timezone

from services.repositories.base_repository import BaseRepository


class JobRepository(BaseRepository):
    """Repository for job table operations."""

    def create_job(self, user_id: str, status: str, input_url: str, media_type: str, credit_cost: int) -> dict:
        """Create a new job record. Returns the created job dict."""
        result = (
            self.supabase.table("jobs")
            .insert({
                "user_id": user_id,
                "status": status,
                "input_url": input_url,
                "media_type": media_type,
                "credit_cost": credit_cost,
            })
            .execute()
        )
        if not result.data:
            raise ValueError("create_job returned empty data from Supabase")
        return result.data[0]

    def update_job_status(self, job_id: str, status: str, output_url: str = None, completed_at: str = None) -> None:
        """Update job status and optionally output_url and completed_at."""
        update_data = {"status": status}
        if output_url is not None:
            update_data["output_url"] = output_url
            if completed_at is None:
                update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        elif completed_at is not None:
            update_data["completed_at"] = completed_at

        self.supabase.table("jobs").update(update_data).eq("id", job_id).execute()

    def get_job(self, job_id: str) -> dict | None:
        """Get a single job by ID."""
        result = (
            self.supabase.table("jobs")
            .select("*")
            .eq("id", job_id)
            .single()
            .execute()
        )
        return result.data if result.data else None
