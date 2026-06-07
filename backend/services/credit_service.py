from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

CREDIT_COSTS = {"photo": 1, "video": 5}


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


class CreditService:
    @staticmethod
    def get_credits(user_id: str) -> int:
        supabase = _get_supabase()
        result = (
            supabase.table("profiles")
            .select("credits")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return result.data.get("credits", 0) if result.data else 0

    @staticmethod
    def deduct_credits(user_id: str, media_type: str) -> bool:
        supabase = _get_supabase()
        cost = CREDIT_COSTS.get(media_type, 1)
        credits = CreditService.get_credits(user_id)
        if credits < cost:
            return False
        supabase.table("profiles").update(
            {"credits": credits - cost}
        ).eq("id", user_id).execute()
        supabase.table("credit_transactions").insert({
            "user_id": user_id, "amount": -cost, "type": "usage",
        }).execute()
        return True

    @staticmethod
    def add_credits(user_id: str, amount: int, session_id: str):
        supabase = _get_supabase()
        credits = CreditService.get_credits(user_id)
        supabase.table("profiles").update(
            {"credits": credits + amount}
        ).eq("id", user_id).execute()
        supabase.table("credit_transactions").insert({
            "user_id": user_id, "amount": amount, "type": "purchase", "stripe_session_id": session_id,
        }).execute()
