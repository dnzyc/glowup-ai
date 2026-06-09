import { describe, it, expect } from "vitest";
import { toBackendParams, fromBackendParams, defaultParams, defaultFrontendParams, BeautyParams, FrontendBeautyParams } from "./beauty-params-adapter";

describe("BeautyParams Adapter", () => {
  describe("toBackendParams", () => {
    it("converts camelCase to snake_case", () => {
      const frontend: FrontendBeautyParams = {
        smoothing: 50,
        brightening: 30,
        sharpening: 20,
        blemishRemoval: 40,
        detailEnhance: 60,
        unsharpMask: 70,
        inpaintSpot: 80,
      };

      const backend = toBackendParams(frontend);

      expect(backend).toEqual({
        smoothing: 50,
        brightening: 30,
        sharpening: 20,
        blemish_removal: 40,
        detail_enhance: 60,
        unsharp_mask: 70,
        inpaint_spot: 80,
      });
    });
  });

  describe("fromBackendParams", () => {
    it("converts snake_case to camelCase", () => {
      const backend: BeautyParams = {
        smoothing: 50,
        brightening: 30,
        sharpening: 20,
        blemish_removal: 40,
        detail_enhance: 60,
        unsharp_mask: 70,
        inpaint_spot: 80,
      };

      const frontend = fromBackendParams(backend);

      expect(frontend).toEqual({
        smoothing: 50,
        brightening: 30,
        sharpening: 20,
        blemishRemoval: 40,
        detailEnhance: 60,
        unsharpMask: 70,
        inpaintSpot: 80,
      });
    });
  });

  describe("round-trip conversion", () => {
    it("camelCase → snake_case → camelCase should be identity", () => {
      const original: FrontendBeautyParams = {
        smoothing: 50,
        brightening: 30,
        sharpening: 20,
        blemishRemoval: 40,
        detailEnhance: 60,
        unsharpMask: 70,
        inpaintSpot: 80,
      };

      const backend = toBackendParams(original);
      const restored = fromBackendParams(backend);

      expect(restored).toEqual(original);
    });

    it("snake_case → camelCase → snake_case should be identity", () => {
      const original: BeautyParams = {
        smoothing: 50,
        brightening: 30,
        sharpening: 20,
        blemish_removal: 40,
        detail_enhance: 60,
        unsharp_mask: 70,
        inpaint_spot: 80,
      };

      const frontend = fromBackendParams(original);
      const restored = toBackendParams(frontend);

      expect(restored).toEqual(original);
    });
  });

  describe("defaultParams", () => {
    it("returns default values matching backend defaults", () => {
      const defaults = defaultParams();

      expect(defaults).toEqual({
        smoothing: 50,
        brightening: 30,
        sharpening: 20,
        blemish_removal: 0,
        detail_enhance: 0,
        unsharp_mask: 0,
        inpaint_spot: 0,
      });
    });
  });

  describe("defaultFrontendParams", () => {
    it("returns default values in camelCase format", () => {
      const defaults = defaultFrontendParams();

      expect(defaults).toEqual({
        smoothing: 50,
        brightening: 30,
        sharpening: 20,
        blemishRemoval: 0,
        detailEnhance: 0,
        unsharpMask: 0,
        inpaintSpot: 0,
      });
    });
  });

  describe("edge cases", () => {
    it("handles zero values correctly", () => {
      const frontend: FrontendBeautyParams = {
        smoothing: 0,
        brightening: 0,
        sharpening: 0,
        blemishRemoval: 0,
        detailEnhance: 0,
        unsharpMask: 0,
        inpaintSpot: 0,
      };

      const backend = toBackendParams(frontend);
      const restored = fromBackendParams(backend);

      expect(restored).toEqual(frontend);
    });

    it("handles maximum values correctly", () => {
      const frontend: FrontendBeautyParams = {
        smoothing: 100,
        brightening: 100,
        sharpening: 100,
        blemishRemoval: 100,
        detailEnhance: 100,
        unsharpMask: 100,
        inpaintSpot: 100,
      };

      const backend = toBackendParams(frontend);
      const restored = fromBackendParams(backend);

      expect(restored).toEqual(frontend);
    });
  });
});
