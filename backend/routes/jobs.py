from fastapi import APIRouter
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.get("/jobs")
async def list_jobs(user_id: str = None):
    supabase = _get_supabase()
    query = supabase.table("jobs").select("*").order("created_at", {"ascending": False}).limit(50)
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.execute()
    return result.data or []


@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    supabase = _get_supabase()
    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    if not result.data:
        return {"error": "Job not found"}
    return result.data
