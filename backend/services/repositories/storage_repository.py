"""
Storage Repository — encapsulates Supabase storage operations.
"""

from services.repositories.base_repository import BaseRepository


class StorageRepository(BaseRepository):
    """Repository for Supabase storage operations."""

    def upload_result(self, user_id: str, job_id: str, file_bytes: bytes, ext: str) -> str:
        """Upload a result file to Supabase storage. Returns the public URL."""
        result_filename = f"{user_id}/{job_id}_result{ext}"

        self.supabase.storage.from_("results").upload(result_filename, file_bytes)

        return self.supabase.storage.from_("results").get_public_url(result_filename)
