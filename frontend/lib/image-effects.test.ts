import { createCanvas, ImageData as CanvasImageData } from "canvas";

const canvas = createCanvas(1, 1);
(globalThis as any).ImageData = CanvasImageData;

import { describe, it, expect } from "vitest";
import {
  applySmoothing,
  applyBrightening,
  applySharpening,
  applyBlemishRemoval,
  applyDetailEnhance,
  applyUnsharpMask,
  applyInpaintSpot,
  applyEffects,
} from "./image-effects";

function createTestImageData(width: number, height: number, fill: number = 128) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill;
    data[i + 1] = fill;
    data[i + 2] = fill;
    data[i + 3] = 255;
  }
  return new CanvasImageData(data, width, height) as unknown as ImageData;
}

function createNoisyImageData(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.floor(Math.random() * 256);
    data[i + 1] = Math.floor(Math.random() * 256);
    data[i + 2] = Math.floor(Math.random() * 256);
    data[i + 3] = 255;
  }
  return new CanvasImageData(data, width, height) as unknown as ImageData;
}

function createGradientImageData(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = Math.floor((x / width) * 255);
      data[idx + 1] = Math.floor((y / height) * 255);
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }
  return new CanvasImageData(data, width, height) as unknown as ImageData;
}

function imageDataEquals(a: ImageData, b: ImageData): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  for (let i = 0; i < a.data.length; i++) {
    if (a.data[i] !== b.data[i]) return false;
  }
  return true;
}

describe("applySmoothing", () => {
  it("returns identical image when amount is 0", () => {
    const input = createGradientImageData(50, 50);
    const output = applySmoothing(input, 0);
    expect(imageDataEquals(input, output)).toBe(true);
  });

  it("produces different output when amount > 0", () => {
    const input = createNoisyImageData(50, 50);
    const output = applySmoothing(input, 0.5);
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("does not mutate input", () => {
    const input = createGradientImageData(50, 50);
    const original = new Uint8ClampedArray(input.data);
    applySmoothing(input, 0.8);
    expect(input.data).toEqual(original);
  });
});

describe("applyBrightening", () => {
  it("returns identical image when amount is 0", () => {
    const input = createTestImageData(10, 10, 100);
    const output = applyBrightening(input, 0);
    expect(imageDataEquals(input, output)).toBe(true);
  });

  it("increases pixel values when amount > 0", () => {
    const input = createTestImageData(10, 10, 100);
    const output = applyBrightening(input, 0.5);
    expect(output.data[0]).toBeGreaterThan(input.data[0]);
  });

  it("clamps values at 255", () => {
    const input = createTestImageData(10, 10, 250);
    const output = applyBrightening(input, 1.0);
    expect(output.data[0]).toBe(255);
  });

  it("does not mutate input", () => {
    const input = createTestImageData(10, 10, 100);
    const original = new Uint8ClampedArray(input.data);
    applyBrightening(input, 0.5);
    expect(input.data).toEqual(original);
  });
});

describe("applySharpening", () => {
  it("returns identical image when amount is 0", () => {
    const input = createTestImageData(50, 50, 128);
    const output = applySharpening(input, 0);
    expect(imageDataEquals(input, output)).toBe(true);
  });

  it("produces different output when amount > 0 on noisy image", () => {
    const input = createNoisyImageData(50, 50);
    const output = applySharpening(input, 0.5);
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("does not mutate input", () => {
    const input = createNoisyImageData(50, 50);
    const original = new Uint8ClampedArray(input.data);
    applySharpening(input, 0.5);
    expect(input.data).toEqual(original);
  });
});

describe("applyBlemishRemoval", () => {
  it("returns identical image when amount is 0", () => {
    const input = createGradientImageData(50, 50);
    const output = applyBlemishRemoval(input, 0);
    expect(imageDataEquals(input, output)).toBe(true);
  });

  it("produces different output when amount > 0", () => {
    const input = createNoisyImageData(50, 50);
    const output = applyBlemishRemoval(input, 0.5);
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("does not mutate input", () => {
    const input = createNoisyImageData(50, 50);
    const original = new Uint8ClampedArray(input.data);
    applyBlemishRemoval(input, 0.5);
    expect(input.data).toEqual(original);
  });
});

describe("applyDetailEnhance", () => {
  it("returns identical image when amount is 0", () => {
    const input = createTestImageData(50, 50, 128);
    const output = applyDetailEnhance(input, 0);
    expect(imageDataEquals(input, output)).toBe(true);
  });

  it("produces different output when amount > 0 on noisy image", () => {
    const input = createNoisyImageData(50, 50);
    const output = applyDetailEnhance(input, 0.5);
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("does not mutate input", () => {
    const input = createNoisyImageData(50, 50);
    const original = new Uint8ClampedArray(input.data);
    applyDetailEnhance(input, 0.5);
    expect(input.data).toEqual(original);
  });
});

describe("applyUnsharpMask", () => {
  it("returns identical image when amount is 0", () => {
    const input = createTestImageData(50, 50, 128);
    const output = applyUnsharpMask(input, 0);
    expect(imageDataEquals(input, output)).toBe(true);
  });

  it("produces different output when amount > 0 on noisy image", () => {
    const input = createNoisyImageData(50, 50);
    const output = applyUnsharpMask(input, 0.5);
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("does not mutate input", () => {
    const input = createNoisyImageData(50, 50);
    const original = new Uint8ClampedArray(input.data);
    applyUnsharpMask(input, 0.5);
    expect(input.data).toEqual(original);
  });
});

describe("applyInpaintSpot", () => {
  it("returns identical image when amount is 0", () => {
    const input = createTestImageData(50, 50, 128);
    const output = applyInpaintSpot(input, 0);
    expect(imageDataEquals(input, output)).toBe(true);
  });

  it("produces different output when amount > 0 on noisy image", () => {
    const input = createNoisyImageData(50, 50);
    const output = applyInpaintSpot(input, 0.5);
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("does not mutate input", () => {
    const input = createNoisyImageData(50, 50);
    const original = new Uint8ClampedArray(input.data);
    applyInpaintSpot(input, 0.5);
    expect(input.data).toEqual(original);
  });
});

describe("applyEffects", () => {
  it("returns identical image when all params are 0", () => {
    const input = createGradientImageData(50, 50);
    const output = applyEffects(input, {
      smoothing: 0,
      brightening: 0,
      sharpening: 0,
      blemish_removal: 0,
      detail_enhance: 0,
      unsharp_mask: 0,
      inpaint_spot: 0,
    });
    expect(imageDataEquals(input, output)).toBe(true);
  });

  it("applies smoothing effect", () => {
    const input = createNoisyImageData(50, 50);
    const output = applyEffects(input, {
      smoothing: 50,
      brightening: 0,
      sharpening: 0,
      blemish_removal: 0,
      detail_enhance: 0,
      unsharp_mask: 0,
      inpaint_spot: 0,
    });
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("applies brightening effect", () => {
    const input = createTestImageData(10, 10, 100);
    const output = applyEffects(input, {
      smoothing: 0,
      brightening: 50,
      sharpening: 0,
      blemish_removal: 0,
      detail_enhance: 0,
      unsharp_mask: 0,
      inpaint_spot: 0,
    });
    expect(output.data[0]).toBeGreaterThan(input.data[0]);
  });

  it("applies sharpening effect", () => {
    const input = createNoisyImageData(50, 50);
    const output = applyEffects(input, {
      smoothing: 0,
      brightening: 0,
      sharpening: 50,
      blemish_removal: 0,
      detail_enhance: 0,
      unsharp_mask: 0,
      inpaint_spot: 0,
    });
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("applies blemish removal effect", () => {
    const input = createNoisyImageData(50, 50);
    const output = applyEffects(input, {
      smoothing: 0,
      brightening: 0,
      sharpening: 0,
      blemish_removal: 50,
      detail_enhance: 0,
      unsharp_mask: 0,
      inpaint_spot: 0,
    });
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("applies all effects when all params are non-zero", () => {
    const input = createNoisyImageData(50, 50);
    const output = applyEffects(input, {
      smoothing: 50,
      brightening: 50,
      sharpening: 50,
      blemish_removal: 50,
      detail_enhance: 50,
      unsharp_mask: 50,
      inpaint_spot: 50,
    });
    expect(imageDataEquals(input, output)).toBe(false);
  });

  it("respects region masking", () => {
    const input = createTestImageData(40, 40, 100);
    const regions = [
      { id: "face", name: "Face", x: 0, y: 0, width: 20, height: 20 },
    ];
    const output = applyEffects(input, {
      smoothing: 0,
      brightening: 80,
      sharpening: 0,
      blemish_removal: 0,
      detail_enhance: 0,
      unsharp_mask: 0,
      inpaint_spot: 0,
    }, regions, 40, 40);

    const regionPixel = output.data[10 * 40 * 4 + 10 * 4];
    const outsidePixel = output.data[30 * 40 * 4 + 30 * 4];

    expect(regionPixel).toBeGreaterThan(input.data[10 * 40 * 4 + 10 * 4]);
    expect(outsidePixel).toBe(input.data[30 * 40 * 4 + 30 * 4]);
  });

  it("respects region masking for detail_enhance", () => {
    const input = createNoisyImageData(40, 40, 100);
    const regions = [
      { id: "face", name: "Face", x: 0, y: 0, width: 20, height: 20 },
    ];
    const output = applyEffects(input, {
      smoothing: 0,
      brightening: 0,
      sharpening: 0,
      blemish_removal: 0,
      detail_enhance: 80,
      unsharp_mask: 0,
      inpaint_spot: 0,
    }, regions, 40, 40);

    const regionPixel = output.data[10 * 40 * 4 + 10 * 4];
    const outsidePixel = output.data[30 * 40 * 4 + 30 * 4];
    const inputRegion = input.data[10 * 40 * 4 + 10 * 4];
    const inputOutside = input.data[30 * 40 * 4 + 30 * 4];

    expect(regionPixel).not.toBe(inputRegion);
    expect(outsidePixel).toBe(inputOutside);
  });

  it("respects region masking for inpaint_spot", () => {
    const input = createNoisyImageData(40, 40, 100);
    const regions = [
      { id: "face", name: "Face", x: 0, y: 0, width: 20, height: 20 },
    ];
    const output = applyEffects(input, {
      smoothing: 0,
      brightening: 0,
      sharpening: 0,
      blemish_removal: 0,
      detail_enhance: 0,
      unsharp_mask: 0,
      inpaint_spot: 80,
    }, regions, 40, 40);

    const regionPixel = output.data[10 * 40 * 4 + 10 * 4];
    const outsidePixel = output.data[30 * 40 * 4 + 30 * 4];
    const inputRegion = input.data[10 * 40 * 4 + 10 * 4];
    const inputOutside = input.data[30 * 40 * 4 + 30 * 4];

    expect(regionPixel).not.toBe(inputRegion);
    expect(outsidePixel).toBe(inputOutside);
  });

  it("does not mutate input", () => {
    const input = createNoisyImageData(50, 50);
    const original = new Uint8ClampedArray(input.data);
    applyEffects(input, {
      smoothing: 50,
      brightening: 50,
      sharpening: 50,
      blemish_removal: 50,
      detail_enhance: 50,
      unsharp_mask: 50,
      inpaint_spot: 50,
    });
    expect(input.data).toEqual(original);
  });
});
