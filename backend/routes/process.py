"""
Process routes — local OpenCV beauty pipeline.
No external API. No GPU server. No per-use cost.
"""
import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from models.job import ProcessRequest, BeautyParams
from services.beauty_pipeline import BeautyPipeline
from services.credit_service import CreditService, CREDIT_COSTS
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.post("/process")
async def process_media(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    media_type: str = Form("photo"),
    output_format: str = Form("mp4"),
    smoothing: int = Form(50),
    brightening: int = Form(30),
    sharpening: int = Form(20),
    blemish_removal: int = Form(0),
):
    """
    Process uploaded photo/video through the Flame-grade beauty pipeline.
    
    Pipeline (same order as Flame Beauty Box):
    1. Bilateral Surface Blur (skin smoothing)
    2. Blemish Removal (spot cleanup)
    3. High Pass Sharpen (detail restoration)
    4. Brightening (brightness in HSV space)
    5. Edge-Preserving Polish (final smooth)
    
    No AI. No GPU. Pure math. Instant.
    """
    cost = CREDIT_COSTS.get(media_type, 1)
    if not CreditService.deduct_credits(user_id, media_type):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    params = BeautyParams(
        smoothing=smoothing,
        brightening=brightening,
        sharpening=sharpening,
        blemish_removal=blemish_removal,
    )

    # Save uploaded file
    ext = os.path.splitext(file.filename or "image.png")[1]
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(await file.read())
        input_path = tmp.name

    # Create job record
    supabase = _get_supabase()
    job = (
        supabase.table("jobs")
        .insert({
            "user_id": user_id,
            "status": "processing",
            "input_url": file.filename,
            "media_type": media_type,
            "credit_cost": cost,
        })
        .execute()
    )
    job_data = job.data[0]

    try:
        if media_type == "video":
            output_path = BeautyPipeline.process_video(input_path, params, output_format=output_format)
        else:
            output_path = BeautyPipeline.process_photo(input_path, params)

        # Upload result to Supabase Storage
        result_filename = f"{user_id}/{job_data['id']}_result{ext}"
        with open(output_path, "rb") as f:
            supabase.storage.from_("results").upload(result_filename, f.read())
        result_url = supabase.storage.from_("results").get_public_url(result_filename)

        supabase.table("jobs").update({
            "status": "completed",
            "output_url": result_url,
            "completed_at": "now()",
        }).eq("id", job_data["id"]).execute()

    except Exception as e:
        supabase.table("jobs").update({"status": "failed"}).eq("id", job_data["id"]).execute()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Cleanup temp files
        if os.path.exists(input_path):
            os.unlink(input_path)
        if "output_path" in locals() and os.path.exists(output_path):
            os.unlink(output_path)

    return {"job_id": job_data["id"], "status": "completed"}
