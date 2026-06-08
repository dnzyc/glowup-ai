"""
Flame Matchbox / Nuke Gizmo — Gradeable Beauty Pipeline
Pure OpenCV + NumPy. No GPU needed. Deterministic. Zero API cost.

Algorithms:
- Frequency Separation (Flame Beauty Box / Nuke FrequencySep)
- Bilateral Surface Blur (Flame Surface Blur / Nuke Bilateral)
- Edge-Preserving Smoothing (Nuke EdgeBlur)
- High Pass Sharpen (Flame HPSharpen / Nuke UnsharpMask)
- Blemish Removal via Inpainting (Flame Paint / Nuke RotoPaint equivalent)
- Region Masked Blending (Flame GMask / Nuke Roto)
"""

import os
import cv2
import numpy as np
from typing import List, Optional, Tuple, Union
from models.job import Region, BeautyParams


class FlameBeautyBox:
    """
    Replicates Flame's Beauty Box using Frequency Separation.
    Visual representation of the algorithm:
    
      Original ── LowPass(Gaussian) ──► Smooth(LowPass) ──┐
         │                                                   ├──► Beauty(Original, Detail) ──► Result
         └── HighPass(Original - LowPass) ──► Detail ───────┘
    """

    @staticmethod
    def frequency_separation(
        image: np.ndarray,
        blur_radius: float = 8.0,
        detail_amount: float = 0.5,
    ) -> np.ndarray:
        """
        Flame Beauty Box core: frequency separation.
        
        Args:
            image: BGR or grayscale image
            blur_radius: Gaussian blur sigma for low pass
            detail_amount: 0.0 = full smooth, 1.0 = original detail
        """
        low_pass = cv2.GaussianBlur(image, (0, 0), blur_radius)
        high_pass = cv2.subtract(image, low_pass)
        result = cv2.addWeighted(low_pass, 1.0, high_pass, detail_amount, 0)
        return np.clip(result, 0, 255).astype(np.uint8)

    @staticmethod
    def surface_blur(
        image: np.ndarray,
        d: int = 9,
        sigma_color: float = 75,
        sigma_space: float = 75,
    ) -> np.ndarray:
        """
        Flame Surface Blur / Nuke Bilateral equivalent.
        Edge-preserving blur that smooths skin but preserves edges.
        
        Args:
            d: Diameter of pixel neighborhood
            sigma_color: Filter sigma in color space (higher = more smoothing)
            sigma_space: Filter sigma in coordinate space
        """
        return cv2.bilateralFilter(image, d, sigma_color, sigma_space)

    @staticmethod
    def edge_preserving_smooth(
        image: np.ndarray,
        strength: float = 50,
        edge_preserve: float = 0.4,
    ) -> np.ndarray:
        """
        Nuke EdgeBlur equivalent.
        Smooths flat areas while preserving sharp edges.
        
        Args:
            strength: 0-100, smoothing strength
            edge_preserve: 0-1, how much to preserve edges
        """
        # Scale parameters for cv2.edgePreservingFilter
        flags = 1  # RECURS_FILTER = 1, NORMCONV_FILTER = 2
        sigma_s = max(1, int(strength * 2))  # Spatial sigma
        sigma_r = max(0.01, edge_preserve)    # Range sigma
        return cv2.edgePreservingFilter(image, flags, sigma_s, sigma_r)


class FlameDetailEnhance:
    """
    Replicates Flame's HPSharpen / Nuke's UnsharpMask / DetailTransfer.
    """

    @staticmethod
    def high_pass_sharpen(
        image: np.ndarray,
        radius: float = 3.0,
        amount: float = 0.3,
        threshold: float = 0.0,
    ) -> np.ndarray:
        """
        Flame HPSharpen equivalent.
        High-pass filter + add back to original.
        
        Args:
            radius: Blur radius for high pass extraction
            amount: Sharpening intensity (0-1)
            threshold: Ignore differences below this (reduces noise)
        """
        blurred = cv2.GaussianBlur(image, (0, 0), radius)
        high_pass = cv2.subtract(image, blurred)

        # Convert both to float32 before blending
        img_float = image.astype(np.float32)
        hp_float = high_pass.astype(np.float32)

        if threshold > 0:
            mask = np.abs(hp_float) > threshold
            hp_float = hp_float * mask.astype(np.float32)

        sharpened = cv2.addWeighted(img_float, 1.0, hp_float, amount, 0)
        return np.clip(sharpened, 0, 255).astype(np.uint8)

    @staticmethod
    def detail_enhance(
        image: np.ndarray,
        sigma_s: float = 10,
        sigma_r: float = 0.15,
    ) -> np.ndarray:
        """
        OpenCV's built-in detailEnhance (Nuke DetailTransfer).
        Handles both grayscale and 3-channel images.
        """
        if image.ndim == 2:
            gray_3ch = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            enhanced = cv2.detailEnhance(gray_3ch, sigma_s, sigma_r)
            return cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
        return cv2.detailEnhance(image, sigma_s, sigma_r)

    @staticmethod
    def unsharp_mask(
        image: np.ndarray,
        sigma: float = 1.0,
        amount: float = 1.5,
    ) -> np.ndarray:
        """
        Classic unsharp mask (Nuke UnsharpMask).
        Most widely used sharpening in professional compositing.
        """
        blurred = cv2.GaussianBlur(image, (0, 0), sigma)
        return cv2.addWeighted(image, 1.0 + amount, blurred, -amount, 0)


class FlameBlemishRemoval:
    """
    Replicates Flame's Paint node and Nuke's RotoPaint for spot removal.
    Uses inpainting and local median filtering.
    """

    @staticmethod
    def remove_blemishes(
        image: np.ndarray,
        strength: float = 50,
    ) -> np.ndarray:
        """
        Blemish removal using multi-stage filtering.
        Combines median filtering (for small spots) with edge-aware smoothing.
        
        Args:
            strength: 0-100, removal intensity
        """
        ksize = max(3, int(strength / 10) * 2 + 1)
        median_smoothed = cv2.medianBlur(image, ksize)

        if image.ndim == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        elif image.ndim == 2:
            gray = image
        else:
            gray = image.squeeze()

        edges = cv2.Canny(gray, 15, 50)

        blend = strength / 100.0
        edge_mask = cv2.GaussianBlur(edges.astype(np.float32), (5, 5), 2) / 255.0
        edge_mask = 1.0 - edge_mask

        # Match edge_mask dimensions to image channels
        if image.ndim == 3:
            edge_mask = edge_mask[:, :, np.newaxis]

        result = image.astype(np.float32) * (1 - blend * (1 - edge_mask)) + \
                 median_smoothed.astype(np.float32) * blend * (1 - edge_mask)
        return np.clip(result, 0, 255).astype(np.uint8)

    @staticmethod
    def inpaint_spot(
        image: np.ndarray,
        mask: np.ndarray,
        radius: int = 3,
    ) -> np.ndarray:
        """
        Inpainting-based spot removal.
        Equivalent to Nuke's RotoPaint clone/paint brush.
        
        Args:
            image: Input image
            mask: Binary mask of spots to remove (255 = remove)
            radius: Inpainting radius
        """
        return cv2.inpaint(image, mask, radius, cv2.INPAINT_TELEA)


class BeautyPipeline:
    """
    Complete beauty pipeline matching Flame Matchbox / Nuke Gizmo quality.
    All operations are gradeable (0-100% intensity).
    """

    @staticmethod
    def generate_region_mask(
        image_shape: Tuple[int, int],
        regions: List[Region],
    ) -> np.ndarray:
        """
        Generate a binary mask from selected regions.
        Equivalent to Flame GMask / Nuke Roto node.
        """
        h, w = image_shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        for region in regions:
            x1 = max(0, int(region.x))
            y1 = max(0, int(region.y))
            x2 = min(w, int(region.x + region.width))
            y2 = min(h, int(region.y + region.height))
            if x2 > x1 and y2 > y1:
                mask[y1:y2, x1:x2] = 255
        return mask

    @staticmethod
    def process_photo(
        image_path: str,
        params: BeautyParams,
        regions: Optional[List[Region]] = None,
    ) -> str:
        """
        Full beauty processing pipeline for a photo.
        
        Pipeline:
        1. Load image
        2. Skin smoothing (bilateral + edge-preserving)
        3. Blemish removal (median + edge-aware)
        4. High pass sharpen (detail enhancement)
        5. Brightness/contrast
        6. Region masking (apply only to selected areas)
        7. Composite with original
        8. Save result
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot load image: {image_path}")

        original = img.copy()
        result = img.copy()

        # --- Stage 1: Skin Smoothing ---
        smoothing = params.smoothing / 100.0
        if smoothing > 0:
            d = max(3, int(smoothing * 15) | 1)  # odd number 3-15
            sigma_color = smoothing * 150
            sigma_space = smoothing * 150
            bilateral_result = FlameBeautyBox.surface_blur(
                result, d=d, sigma_color=sigma_color, sigma_space=sigma_space
            )

            blur_radius = smoothing * 12
            freq_result = FlameBeautyBox.frequency_separation(
                result, blur_radius=blur_radius, detail_amount=smoothing
            )

            # Blend both methods
            result = cv2.addWeighted(bilateral_result, 0.7, freq_result, 0.3, 0)

        # --- Stage 2: Blemish Removal ---
        if params.blemish_removal > 0:
            result = FlameBlemishRemoval.remove_blemishes(
                result, strength=params.blemish_removal
            )

        # --- Stage 2b: Inpainting Spot Removal ---
        if params.inpaint_spot > 0:
            result = FlameBlemishRemoval.inpaint_spot(
                result, strength=params.inpaint_spot
            )

        # --- Stage 3: High Pass Sharpen ---
        sharpening = params.sharpening / 100.0
        if sharpening > 0:
            radius = max(1.0, sharpening * 5)
            amount = sharpening * 0.5
            result = FlameDetailEnhance.high_pass_sharpen(
                result, radius=radius, amount=amount, threshold=2.0
            )

        # --- Stage 3b: Detail Enhancement ---
        if params.detail_enhance > 0:
            result = FlameDetailEnhance.detail_enhance(
                result, strength=params.detail_enhance
            )

        # --- Stage 3c: Unsharp Mask ---
        if params.unsharp_mask > 0:
            result = FlameDetailEnhance.unsharp_mask(
                result, strength=params.unsharp_mask
            )

        # --- Stage 4: Brightening ---
        brightening = params.brightening / 100.0
        if brightening > 0:
            hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV).astype(np.float32)
            hsv[:, :, 2] = np.clip(hsv[:, :, 2] * (1.0 + brightening * 0.4), 0, 255)
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

        # --- Stage 5: Edge-Preserving Polish ---
        if smoothing > 0.3:
            result = FlameBeautyBox.edge_preserving_smooth(
                result, strength=smoothing * 80, edge_preserve=0.3
            )

        # --- Region Masking ---
        if regions and len(regions) > 0:
            mask = BeautyPipeline.generate_region_mask(result.shape, regions)
            mask = cv2.GaussianBlur(mask, (15, 15), 8)  # Feather edges
            mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR).astype(np.float32) / 255.0
            # Beauty-processed result INSIDE mask, original OUTSIDE mask
            result = (result.astype(np.float32) * mask_3ch +
                      original.astype(np.float32) * (1.0 - mask_3ch))
            result = np.clip(result, 0, 255).astype(np.uint8)

        # --- Save Result ---
        base, ext = os.path.splitext(image_path)
        output_path = f"{base}_beauty{ext}"
        cv2.imwrite(output_path, result)
        return output_path

    @staticmethod
    def process_video(
        video_path: str,
        params: BeautyParams,
        regions: Optional[List[Region]] = None,
        output_format: str = "mp4",
    ) -> str:
        """
        Frame-by-frame beauty processing for video.
        Uses ffmpeg for ProRes export, OpenCV for MP4.
        
        Supported formats: mp4 (H.264), mov (ProRes 422), prores (ProRes 4444)
        """
        import subprocess, tempfile, os

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 24
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Detect input format from extension
        input_ext = os.path.splitext(video_path)[1].lower()
        is_prores_input = input_ext in (".mov", ".prores")

        output_path = video_path.replace(input_ext, f"_beauty{'.mov' if output_format != 'mp4' else '.mp4'}")

        # Precompute region mask
        if regions and len(regions) > 0:
            mask = BeautyPipeline.generate_region_mask((height, width), regions)
            mask = cv2.GaussianBlur(mask, (15, 15), 8)
            mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR).astype(np.float32) / 255.0
        else:
            mask_3ch = None

        if output_format in ("prores", "mov"):
            # ProRes export via ffmpeg pipe
            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-f", "rawvideo", "-vcodec", "rawvideo",
                "-s", f"{width}x{height}", "-pix_fmt", "bgr24",
                "-r", str(fps), "-i", "pipe:0",
                "-c:v", "prores_ks",
                "-profile:v", "3" if output_format == "prores" else "2",
                "-pix_fmt", "yuv422p10le",
                "-vendor", "ap10",
                output_path,
            ]
            proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                processed = BeautyPipeline._beauty_frame(frame, params)
                if mask_3ch is not None:
                    processed = (processed.astype(np.float32) * mask_3ch +
                                 frame.astype(np.float32) * (1.0 - mask_3ch))
                    processed = np.clip(processed, 0, 255).astype(np.uint8)
                proc.stdin.write(processed.tobytes())
                frame_count += 1

            proc.stdin.close()
            proc.wait()

        else:
            # MP4 export via OpenCV
            fourcc = cv2.VideoWriter_fourcc(*"avc1")
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                processed = BeautyPipeline._beauty_frame(frame, params)
                if mask_3ch is not None:
                    processed = (processed.astype(np.float32) * mask_3ch +
                                 frame.astype(np.float32) * (1.0 - mask_3ch))
                    processed = np.clip(processed, 0, 255).astype(np.uint8)
                out.write(processed)

            out.release()

        cap.release()
        return output_path

    @staticmethod
    def _beauty_frame(frame: np.ndarray, params: BeautyParams) -> np.ndarray:
        """Apply beauty effects to a single frame (without region masking)."""
        result = frame.copy()
        smoothing = params.smoothing / 100.0
        if smoothing > 0:
            d = max(3, int(smoothing * 15) | 1)
            result = FlameBeautyBox.surface_blur(result, d=d, sigma_color=smoothing * 150, sigma_space=smoothing * 150)
        if params.blemish_removal > 0:
            result = FlameBlemishRemoval.remove_blemishes(result, strength=params.blemish_removal)
        if params.inpaint_spot > 0:
            result = FlameBlemishRemoval.inpaint_spot(result, strength=params.inpaint_spot)
        sharpening = params.sharpening / 100.0
        if sharpening > 0:
            result = FlameDetailEnhance.high_pass_sharpen(result, radius=max(1.0, sharpening * 5), amount=sharpening * 0.5, threshold=2.0)
        if params.detail_enhance > 0:
            result = FlameDetailEnhance.detail_enhance(result, strength=params.detail_enhance)
        if params.unsharp_mask > 0:
            result = FlameDetailEnhance.unsharp_mask(result, strength=params.unsharp_mask)
        brightening = params.brightening / 100.0
        if brightening > 0:
            hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV).astype(np.float32)
            hsv[:, :, 2] = np.clip(hsv[:, :, 2] * (1.0 + brightening * 0.4), 0, 255)
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        return result


# Convenience: expose classes at module level for direct API
FrequencySeparation = FlameBeautyBox.frequency_separation
SurfaceBlur = FlameBeautyBox.surface_blur
EdgePreservingSmooth = FlameBeautyBox.edge_preserving_smooth
HighPassSharpen = FlameDetailEnhance.high_pass_sharpen
UnsharpMask = FlameDetailEnhance.unsharp_mask
RemoveBlemishes = FlameBlemishRemoval.remove_blemishes
InpaintSpot = FlameBlemishRemoval.inpaint_spot
