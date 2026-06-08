"""
Process routes — local OpenCV beauty pipeline.
No external API. No GPU server. No per-use cost.
"""
import os
import json
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from models.job import ProcessRequest, BeautyParams, Region
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
    detail_enhance: int = Form(0),
    unsharp_mask: int = Form(0),
    inpaint_spot: int = Form(0),
    regions: str = Form("[]"),
):
    try:
        return await _process_media_impl(
            file, user_id, media_type, output_format,
            smoothing, brightening, sharpening, blemish_removal,
            detail_enhance, unsharp_mask, inpaint_spot, regions
        )
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())


async def _process_media_impl(
    file: UploadFile,
    user_id: str,
    media_type: str,
    output_format: str,
    smoothing: int,
    brightening: int,
    sharpening: int,
    blemish_removal: int,
    detail_enhance: int,
    unsharp_mask: int,
    inpaint_spot: int,
    regions: str,
):
    """
    Process uploaded photo/video through the Flame-grade beauty pipeline.
    
    Pipeline (same order as Flame Beauty Box):
    1. Bilateral Surface Blur (skin smoothing)
    2. Blemish Removal (spot cleanup)
    3. Inpainting Spot Removal (RotoPaint clone-brush)
    4. Detail Enhancement (texture restore)
    5. High Pass Sharpen (detail restoration)
    6. Unsharp Mask (classic photographic sharpening)
    7. Brightening (brightness in HSV space)
    8. Edge-Preserving Polish (final smooth)
    
    Region masking limits effects to user-selected zones (face, body, custom rectangles).
    No AI. No GPU. Pure math. Instant.
    """
    cost = CREDIT_COSTS.get(media_type, 1)
    
    supabase = _get_supabase()
    
    # Allow processing for all users (credit check is non-blocking)
    import uuid as _uuid
    try:
        _uuid.UUID(user_id)
    except ValueError:
        user_id = str(_uuid.uuid4())
    
    # TEMPORARY: Credit check disabled for testing
    # CreditService.deduct_credits(user_id, media_type)

    params = BeautyParams(
        smoothing=smoothing,
        brightening=brightening,
        sharpening=sharpening,
        blemish_removal=blemish_removal,
        detail_enhance=detail_enhance,
        unsharp_mask=unsharp_mask,
        inpaint_spot=inpaint_spot,
    )

    region_list = [Region(**r) for r in json.loads(regions)] if regions and regions != "[]" else []

    # Save uploaded file
    ext = os.path.splitext(file.filename or "image.png")[1]
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(await file.read())
        input_path = tmp.name

    # Create job record (skip for anonymous users due to FK constraint)
    try:
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
        has_job = True
    except Exception:
        has_job = False

    try:
        if media_type == "video":
            output_path = BeautyPipeline.process_video(input_path, params, output_format=output_format, regions=region_list or None)
        else:
            output_path = BeautyPipeline.process_photo(input_path, params, regions=region_list or None)

        if has_job:
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
        else:
            # Return base64 result for anonymous users
            import base64
            with open(output_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
            return {"status": "completed", "image_base64": b64, "format": ext}

    except Exception as e:
        import traceback
        if has_job:
            supabase.table("jobs").update({"status": "failed"}).eq("id", job_data["id"]).execute()
        raise Exception(f"{type(e).__name__}: {e}\n{traceback.format_exc()}")

    finally:
        # Cleanup temp files
        if os.path.exists(input_path):
            os.unlink(input_path)
        if "output_path" in locals() and os.path.exists(output_path):
            os.unlink(output_path)

    return {"job_id": job_data["id"], "status": "completed"}
