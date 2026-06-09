"""
Base Repository — holds Supabase client and provides factory fallback.
"""

from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY


def _get_supabase():
    """Factory function for creating Supabase client."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


class BaseRepository:
    """Base repository that holds the Supabase client via DI."""

    def __init__(self, supabase=None):
        self.supabase = supabase or _get_supabase()
