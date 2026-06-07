from fastapi import APIRouter
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()

def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

@router.get("/admin/stats")
async def admin_stats():
    supabase = _get_supabase()
    
    total = supabase.table("jobs").select("id", count="exact").execute()
    completed = supabase.table("jobs").select("id", count="exact").eq("status", "completed").execute()
    failed = supabase.table("jobs").select("id", count="exact").eq("status", "failed").execute()
    
    # Mock revenue: 1 credit = $0.50
    transactions = supabase.table("credit_transactions").select("amount").eq("type", "purchase").execute()
    revenue = sum(t.get("amount", 0) for t in (transactions.data or [])) * 0.5
    
    recent = supabase.table("jobs").select("*").order("created_at", {"ascending": False}).limit(50).execute()
    
    return {
        "totalJobs": total.count if total.count else 0,
        "completedJobs": completed.count if completed.count else 0,
        "failedJobs": failed.count if failed.count else 0,
        "totalRevenue": round(revenue, 2),
        "recentJobs": recent.data or [],
    }
