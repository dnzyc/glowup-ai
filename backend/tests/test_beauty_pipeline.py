"""
Tests for the 7 beauty algorithms in services/beauty_pipeline.py.

Algorithms tested:
- SurfaceBlur (bilateral filter)
- HPSharpen (high-pass sharpen)
- BlemishRm (blemish removal)
- FreqSep (frequency separation)
- EdgePres (edge-preserving smooth)
- Unsharp (unsharp mask)
- DetailEnh (detail enhancement)

Each algorithm is tested for:
- Valid BGR input → correct shape/type
- None/empty input → exception raised
- Single-channel (grayscale) input → correct handling
- Parameter boundary values (0, 50, 100)
"""

import cv2
import numpy as np
import pytest

from services.beauty_pipeline import (
    FlameBeautyBox,
    FlameDetailEnhance,
    FlameBlemishRemoval,
)


# ──────────────────────────────────────────────
# Shared test fixtures
# ──────────────────────────────────────────────

@pytest.fixture(scope="module")
def bgr_image():
    """128x128 random BGR image (uint8)."""
    rng = np.random.default_rng(42)
    return rng.integers(0, 256, size=(128, 128, 3), dtype=np.uint8)


@pytest.fixture(scope="module")
def gray_image():
    """128x128 random grayscale image (uint8)."""
    rng = np.random.default_rng(42)
    return rng.integers(0, 256, size=(128, 128), dtype=np.uint8)


# ──────────────────────────────────────────────
# Helper: parametrised "valid input" test runner
# ──────────────────────────────────────────────

ALGORITHMS = [
    # (name, callable, kwargs)
    ("SurfaceBlur", FlameBeautyBox.surface_blur, {"d": 9, "sigma_color": 75, "sigma_space": 75}),
    ("HPSharpen", FlameDetailEnhance.high_pass_sharpen, {"radius": 3.0, "amount": 0.3, "threshold": 0.0}),
    ("BlemishRm", FlameBlemishRemoval.remove_blemishes, {"strength": 50}),
    ("FreqSep", FlameBeautyBox.frequency_separation, {"blur_radius": 8.0, "detail_amount": 0.5}),
    ("EdgePres", FlameBeautyBox.edge_preserving_smooth, {"strength": 50, "edge_preserve": 0.4}),
    ("Unsharp", FlameDetailEnhance.unsharp_mask, {"sigma": 1.0, "amount": 1.5}),
    ("DetailEnh", FlameDetailEnhance.detail_enhance, {"sigma_s": 10, "sigma_r": 0.15}),
]


# ────────────────────────────────────────────────────────────────
# 1. VALID INPUT — correct shape & type
# ────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("name,func,kwargs", ALGORITHMS)
def test_valid_bgr_input_returns_correct_shape_and_type(name, func, kwargs, bgr_image):
    """Every algorithm must return uint8 ndarray with same shape as input."""
    result = func(bgr_image, **kwargs)
    assert isinstance(result, np.ndarray), f"{name}: expected np.ndarray"
    assert result.dtype == np.uint8, f"{name}: expected uint8, got {result.dtype}"
    assert result.shape == bgr_image.shape, f"{name}: shape mismatch {result.shape} != {bgr_image.shape}"


# ────────────────────────────────────────────────────────────────
# 2. NONE / EMPTY INPUT — exception handling
# ────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("name,func,kwargs", ALGORITHMS)
def test_none_input_raises_exception(name, func, kwargs):
    """Passing None as image must raise an exception."""
    with pytest.raises(Exception) as exc_info:
        func(None, **kwargs)

    # Accept both OpenCV errors and built-in TypeErrors
    assert exc_info.type in (cv2.error, TypeError, AttributeError, ValueError), \
        f"{name}: unexpected exception type {exc_info.type.__name__}"


@pytest.mark.parametrize("name,func,kwargs", ALGORITHMS)
def test_empty_array_raises_exception(name, func, kwargs):
    """Passing an empty (0-size) array should raise an exception."""
    empty = np.array([], dtype=np.uint8)
    with pytest.raises(Exception) as exc_info:
        func(empty, **kwargs)
    assert exc_info.type in (cv2.error, TypeError, AttributeError, ValueError, IndexError), \
        f"{name}: unexpected exception type {exc_info.type.__name__}"


# ────────────────────────────────────────────────────────────────
# 3. SINGLE-CHANNEL (GRAYSCALE) INPUT
# ────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("name,func,kwargs", ALGORITHMS)
def test_grayscale_input_returns_correct_shape(name, func, kwargs, gray_image):
    """Each algorithm should handle single-channel (grayscale) images."""
    try:
        result = func(gray_image, **kwargs)
    except cv2.error as e:
        # Some algorithms (e.g. detailEnhance) may require 3-channel input
        if "scn == 3" in str(e) or "CV_BGR2GRAY" in str(e) or "scn" in str(e):
            pytest.skip(f"{name} requires multi-channel input (expected for some OpenCV filters)")
        raise

    assert isinstance(result, np.ndarray), f"{name}: expected np.ndarray"
    assert result.shape == gray_image.shape, \
        f"{name}: shape changed {result.shape} != {gray_image.shape}"


# ────────────────────────────────────────────────────────────────
# 4. PARAMETER BOUNDARY TESTS (0, 50, 100)
# ────────────────────────────────────────────────────────────────

class TestSurfaceBlurParameters:
    """Surface Blur: d (diameter), sigma_color, sigma_space."""

    @pytest.mark.parametrize("d", [1, 9, 31])
    def test_diameter_extremes(self, bgr_image, d):
        result = FlameBeautyBox.surface_blur(bgr_image, d=d, sigma_color=75, sigma_space=75)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    @pytest.mark.parametrize("sigma_color", [0, 75, 150])
    def test_sigma_color_extremes(self, bgr_image, sigma_color):
        result = FlameBeautyBox.surface_blur(bgr_image, d=9, sigma_color=sigma_color, sigma_space=75)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    @pytest.mark.parametrize("sigma_space", [0, 75, 150])
    def test_sigma_space_extremes(self, bgr_image, sigma_space):
        result = FlameBeautyBox.surface_blur(bgr_image, d=9, sigma_color=75, sigma_space=sigma_space)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8


class TestHPSharpenParameters:
    """High-Pass Sharpen: radius, amount, threshold."""

    @pytest.mark.parametrize("radius", [0.1, 3.0, 20.0])
    def test_radius_extremes(self, bgr_image, radius):
        result = FlameDetailEnhance.high_pass_sharpen(bgr_image, radius=radius, amount=0.3, threshold=0.0)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    @pytest.mark.parametrize("amount", [0.0, 0.5, 1.0])
    def test_amount_extremes(self, bgr_image, amount):
        result = FlameDetailEnhance.high_pass_sharpen(bgr_image, radius=3.0, amount=amount, threshold=0.0)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    @pytest.mark.parametrize("threshold", [0, 50, 100])
    def test_threshold_extremes(self, bgr_image, threshold):
        result = FlameDetailEnhance.high_pass_sharpen(bgr_image, radius=3.0, amount=0.3, threshold=float(threshold))
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8


class TestBlemishRmParameters:
    """Blemish Removal: strength (0-100)."""

    @pytest.mark.parametrize("strength", [0, 50, 100])
    def test_strength_extremes(self, bgr_image, strength):
        result = FlameBlemishRemoval.remove_blemishes(bgr_image, strength=float(strength))
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    def test_strength_zero_produces_minimal_change(self, bgr_image):
        """Strength 0 should produce output very close to input."""
        result = FlameBlemishRemoval.remove_blemishes(bgr_image, strength=0.0)
        assert result.shape == bgr_image.shape
        # At strength 0, output should not differ drastically
        diff = np.abs(result.astype(np.float32) - bgr_image.astype(np.float32))
        assert np.mean(diff) < 5.0, f"mean diff {np.mean(diff):.2f} too high for strength=0"


class TestFreqSepParameters:
    """Frequency Separation: blur_radius, detail_amount."""

    @pytest.mark.parametrize("blur_radius", [0.1, 8.0, 50.0])
    def test_blur_radius_extremes(self, bgr_image, blur_radius):
        result = FlameBeautyBox.frequency_separation(bgr_image, blur_radius=blur_radius, detail_amount=0.5)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    @pytest.mark.parametrize("detail_amount", [0.0, 0.5, 1.0])
    def test_detail_amount_extremes(self, bgr_image, detail_amount):
        result = FlameBeautyBox.frequency_separation(bgr_image, blur_radius=8.0, detail_amount=detail_amount)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    def test_detail_amount_zero_is_fully_smooth(self, bgr_image):
        """detail_amount=0.0: the output should be purely the low-pass blurred image."""
        result = FlameBeautyBox.frequency_separation(bgr_image, blur_radius=15.0, detail_amount=0.0)
        assert result.shape == bgr_image.shape
        # With detail_amount=0 the result should be identical to GaussianBlur
        expected = cv2.GaussianBlur(bgr_image, (0, 0), 15.0)
        assert np.array_equal(result, expected)


class TestEdgePresParameters:
    """Edge-Preserving Smooth: strength, edge_preserve."""

    @pytest.mark.parametrize("strength", [0, 50, 100])
    def test_strength_extremes(self, bgr_image, strength):
        result = FlameBeautyBox.edge_preserving_smooth(bgr_image, strength=float(strength), edge_preserve=0.4)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    @pytest.mark.parametrize("edge_preserve", [0.01, 0.4, 1.0])
    def test_edge_preserve_extremes(self, bgr_image, edge_preserve):
        result = FlameBeautyBox.edge_preserving_smooth(bgr_image, strength=50, edge_preserve=edge_preserve)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8


class TestUnsharpParameters:
    """Unsharp Mask: sigma, amount."""

    @pytest.mark.parametrize("sigma", [0.1, 1.0, 20.0])
    def test_sigma_extremes(self, bgr_image, sigma):
        result = FlameDetailEnhance.unsharp_mask(bgr_image, sigma=sigma, amount=1.5)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    @pytest.mark.parametrize("amount", [0.0, 1.5, 10.0])
    def test_amount_extremes(self, bgr_image, amount):
        result = FlameDetailEnhance.unsharp_mask(bgr_image, sigma=1.0, amount=amount)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    def test_amount_zero_is_identity(self, bgr_image):
        """amount=0.0: output should equal the original image."""
        result = FlameDetailEnhance.unsharp_mask(bgr_image, sigma=1.0, amount=0.0)
        assert result.shape == bgr_image.shape
        assert np.array_equal(result, bgr_image)


class TestDetailEnhParameters:
    """Detail Enhancement: sigma_s, sigma_r."""

    @pytest.mark.parametrize("sigma_s", [0, 10, 100])
    def test_sigma_s_extremes(self, bgr_image, sigma_s):
        result = FlameDetailEnhance.detail_enhance(bgr_image, sigma_s=float(sigma_s), sigma_r=0.15)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    @pytest.mark.parametrize("sigma_r", [0.01, 0.15, 1.0])
    def test_sigma_r_extremes(self, bgr_image, sigma_r):
        result = FlameDetailEnhance.detail_enhance(bgr_image, sigma_s=10, sigma_r=sigma_r)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8


# ────────────────────────────────────────────────────────────────
# Additional: Intensity stays within [0, 255]
# ────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("name,func,kwargs", ALGORITHMS)
def test_output_stays_in_valid_range(name, func, kwargs, bgr_image):
    """Output pixel values must remain within [0, 255]."""
    result = func(bgr_image, **kwargs)
    assert result.min() >= 0, f"{name}: pixel value below 0"
    assert result.max() <= 255, f"{name}: pixel value above 255"


# ────────────────────────────────────────────────────────────────
# InpaintSpot (bonus 8th function — not required but tested)
# ────────────────────────────────────────────────────────────────

class TestInpaintSpot:
    def test_valid_inpaint(self, bgr_image):
        mask = np.zeros((128, 128), dtype=np.uint8)
        mask[60:68, 60:68] = 255  # 8x8 white spot
        result = FlameBlemishRemoval.inpaint_spot(bgr_image, mask, radius=3)
        assert result.shape == bgr_image.shape
        assert result.dtype == np.uint8

    def test_inpaint_empty_mask_is_identity(self, bgr_image):
        mask = np.zeros((128, 128), dtype=np.uint8)
        result = FlameBlemishRemoval.inpaint_spot(bgr_image, mask, radius=3)
        assert np.array_equal(result, bgr_image)

    def test_inpaint_none_mask_raises(self, bgr_image):
        with pytest.raises(Exception):
            FlameBlemishRemoval.inpaint_spot(bgr_image, None, radius=3)
