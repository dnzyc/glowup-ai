"""
Optional AI fallback pipeline using GFPGAN for cases where OpenCV beauty
is insufficient (e.g. very low quality photos, extreme blemishes).
Uses Replicate API — only charged when used, not part of standard pipeline.
"""
from typing import Optional


class AIFallbackService:
    """Optional premium AI enhancement. Available as paid addon."""
    
    @staticmethod
    def is_available() -> bool:
        try:
            from config import REPLICATE_API_TOKEN
            return bool(REPLICATE_API_TOKEN)
        except ImportError:
            return False
    
    @staticmethod
    def enhance_face(image_path: str, scale: int = 2) -> Optional[str]:
        """
        GFPGAN face enhancement via Replicate.
        Returns: output image path or None if unavailable.
        """
        if not AIFallbackService.is_available():
            return None
        try:
            import replicate
            from config import REPLICATE_API_TOKEN
            client = replicate.Client(api_token=REPLICATE_API_TOKEN)
            output = client.run(
                "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
                input={"img": open(image_path, "rb"), "scale": scale, "version": "v1.4"},
            )
            return output if isinstance(output, str) else (output[0] if output else None)
        except Exception:
            return None
