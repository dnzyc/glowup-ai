"""
Credit Repository — encapsulates all credit-related Supabase operations.
"""

import logging

from services.repositories.base_repository import BaseRepository


class CreditRepository(BaseRepository):
    """Repository for credit/profile operations."""

    def get_credits(self, user_id: str) -> int:
        """Get credit balance for a user."""
        result = (
            self.supabase.table("profiles")
            .select("credits")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return result.data.get("credits", 0) if result.data else 0

    def deduct_credits(self, user_id: str, amount: int) -> bool:
        """Deduct credits from user. Returns True if successful, False if insufficient.

        NOTE: This uses a best-effort read-then-write pattern. For true atomicity,
        this should be replaced with a Supabase RPC / database-side function that
        performs the decrement with a CHECK constraint (credits >= 0).
        """
        credits = self.get_credits(user_id)
        if credits < amount:
            return False

        self.supabase.table("profiles").update(
            {"credits": credits - amount}
        ).eq("id", user_id).execute()

        self.supabase.table("credit_transactions").insert({
            "user_id": user_id,
            "amount": -amount,
            "type": "usage",
        }).execute()

        logging.warning(
            "deduct_credits used non-atomic read-then-write for user %s. "
            "Consider migrating to a DB-side RPC for true atomicity.",
            user_id,
        )
        return True

    def add_credits(self, user_id: str, amount: int, session_id: str) -> None:
        """Add credits to user profile and record transaction."""
        credits = self.get_credits(user_id)

        self.supabase.table("profiles").update(
            {"credits": credits + amount}
        ).eq("id", user_id).execute()

        self.supabase.table("credit_transactions").insert({
            "user_id": user_id,
            "amount": amount,
            "type": "purchase",
            "stripe_session_id": session_id,
        }).execute()

    def record_transaction(self, user_id: str, amount: int, type: str) -> None:
        """Record a credit transaction without modifying balance."""
        self.supabase.table("credit_transactions").insert({
            "user_id": user_id,
            "amount": amount,
            "type": type,
        }).execute()
