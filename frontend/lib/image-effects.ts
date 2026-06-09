import { BeautyParams as BackendBeautyParams } from "./beauty-params-adapter";

const GlobalImageData = typeof ImageData !== "undefined" ? ImageData : undefined;

export type BeautyParams = BackendBeautyParams;

export interface Region {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function cloneImageData(imageData: ImageData): ImageData {
  const Ctor = GlobalImageData || (globalThis as any).ImageData;
  return new Ctor(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
}

function createRegionMask(w: number, h: number, regions: Region[], containerW: number, containerH: number): Float32Array {
  const mask = new Float32Array(w * h);
  const scaleX = w / (containerW || w);
  const scaleY = h / (containerH || h);

  for (const region of regions) {
    const x1 = Math.max(0, Math.floor(region.x * scaleX));
    const y1 = Math.max(0, Math.floor(region.y * scaleY));
    const x2 = Math.min(w, Math.ceil((region.x + region.width) * scaleX));
    const y2 = Math.min(h, Math.ceil((region.y + region.height) * scaleY));

    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        mask[y * w + x] = 1;
      }
    }
  }

  return mask;
}

function detectEdge(data: Uint8ClampedArray, w: number, x: number, y: number): number {
  const h = data.length / 4 / w;
  if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return 0;
  const idx = (y * w + x) * 4;
  const left = ((y * w + (x - 1)) * 4);
  const up = (((y - 1) * w + x) * 4);
  const dr = Math.abs(data[idx] - data[left]);
  const dg = Math.abs(data[idx + 1] - data[left + 1]);
  const db = Math.abs(data[idx + 2] - data[left + 2]);
  const ur = Math.abs(data[idx] - data[up]);
  const ug = Math.abs(data[idx + 1] - data[up + 1]);
  const ub = Math.abs(data[idx + 2] - data[up + 2]);
  return (dr + dg + db + ur + ug + ub) / 6;
}

function applyBoxBlur(data: Uint8ClampedArray, w: number, h: number, radius: number, mask: Float32Array | null) {
  const copy = new Uint8ClampedArray(data);
  const r = Math.max(1, radius);
  for (let y = r; y < h - r; y++) {
    for (let x = r; x < w - r; x++) {
      if (mask && mask[y * w + x] < 0.01) continue;
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4;
          rSum += copy[idx];
          gSum += copy[idx + 1];
          bSum += copy[idx + 2];
          count++;
        }
      }
      const idx = (y * w + x) * 4;
      data[idx] = rSum / count;
      data[idx + 1] = gSum / count;
      data[idx + 2] = bSum / count;
    }
  }
}

function applyBlemishRemovalInternal(data: Uint8ClampedArray, w: number, h: number, radius: number, mask: Float32Array | null) {
  const copy = new Uint8ClampedArray(data);
  const r = Math.max(1, radius);
  for (let y = r; y < h - r; y++) {
    for (let x = r; x < w - r; x++) {
      if (mask && mask[y * w + x] < 0.01) continue;
      const idx = (y * w + x) * 4;
      const edge = detectEdge(copy, w, x, y);
      if (edge < 30) continue;
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nIdx = ((y + dy) * w + (x + dx)) * 4;
          rSum += copy[nIdx];
          gSum += copy[nIdx + 1];
          bSum += copy[nIdx + 2];
          count++;
        }
      }
      const blend = Math.min(1, edge / 60);
      data[idx] = data[idx] * (1 - blend) + (rSum / count) * blend;
      data[idx + 1] = data[idx + 1] * (1 - blend) + (gSum / count) * blend;
      data[idx + 2] = data[idx + 2] * (1 - blend) + (bSum / count) * blend;
    }
  }
}

function applyUnsharpMaskInternal(data: Uint8ClampedArray, w: number, h: number, amount: number, radius: number, mask: Float32Array | null) {
  const blurred = new Uint8ClampedArray(data);
  applyBoxBlur(blurred, w, h, radius, null);
  for (let i = 0; i < data.length; i += 4) {
    const px = i / 4 % w;
    const py = Math.floor(i / 4 / w);
    if (mask && mask[py * w + px] < 0.01) continue;
    data[i] = Math.min(255, Math.max(0, data[i] + (data[i] - blurred[i]) * amount));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (data[i + 1] - blurred[i + 1]) * amount));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (data[i + 2] - blurred[i + 2]) * amount));
  }
}

export function applySmoothing(imageData: ImageData, amount: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const radius = Math.round(1 + amount * 8);
  if (radius > 1) {
    applyBoxBlur(data, imageData.width, imageData.height, radius, null);
  }
  return result;
}

export function applyBrightening(imageData: ImageData, amount: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * (1 + amount * 0.4));
    data[i + 1] = Math.min(255, data[i + 1] * (1 + amount * 0.4));
    data[i + 2] = Math.min(255, data[i + 2] * (1 + amount * 0.4));
  }
  return result;
}

export function applySharpening(imageData: ImageData, amount: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const sharpenAmount = amount * 0.3;
  const radius = Math.round(1 + amount * 3);
  if (sharpenAmount > 0.01) {
    applyUnsharpMaskInternal(data, imageData.width, imageData.height, sharpenAmount, radius, null);
  }
  return result;
}

export function applyBlemishRemoval(imageData: ImageData, amount: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const radius = Math.round(1 + amount * 6);
  if (radius > 1) {
    applyBlemishRemovalInternal(data, imageData.width, imageData.height, radius, null);
  }
  return result;
}

export function applyDetailEnhance(imageData: ImageData, amount: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const w = imageData.width;
  const h = imageData.height;
  const copy = new Uint8ClampedArray(data);
  const strength = amount * 0.5;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const edge = detectEdge(copy, w, x, y);
      if (edge > 10) {
        const factor = 1 + strength * (edge / 100);
        data[idx] = Math.min(255, Math.max(0, copy[idx] * factor));
        data[idx + 1] = Math.min(255, Math.max(0, copy[idx + 1] * factor));
        data[idx + 2] = Math.min(255, Math.max(0, copy[idx + 2] * factor));
      }
    }
  }

  return result;
}

export function applyUnsharpMask(imageData: ImageData, amount: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const radius = Math.round(1 + amount * 3);
  if (amount > 0.01) {
    applyUnsharpMaskInternal(data, imageData.width, imageData.height, amount, radius, null);
  }
  return result;
}

export function applyInpaintSpot(imageData: ImageData, amount: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const w = imageData.width;
  const h = imageData.height;
  const copy = new Uint8ClampedArray(data);
  const radius = Math.max(1, Math.round(1 + amount * 10));

  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const idx = (y * w + x) * 4;
      const edge = detectEdge(copy, w, x, y);
      if (edge < 20) continue;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nIdx = ((y + dy) * w + (x + dx)) * 4;
          rSum += copy[nIdx];
          gSum += copy[nIdx + 1];
          bSum += copy[nIdx + 2];
          count++;
        }
      }

      const blend = Math.min(1, edge / 50) * amount;
      data[idx] = copy[idx] * (1 - blend) + (rSum / count) * blend;
      data[idx + 1] = copy[idx + 1] * (1 - blend) + (gSum / count) * blend;
      data[idx + 2] = copy[idx + 2] * (1 - blend) + (bSum / count) * blend;
    }
  }

  return result;
}

export function applyEffects(
  imageData: ImageData,
  params: BeautyParams,
  regions?: Region[],
  containerW?: number,
  containerH?: number,
): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  let result = cloneImageData(imageData);
  const data = result.data;

  const smoothing = params.smoothing / 100;
  const brightening = params.brightening / 100;
  const sharpening = params.sharpening / 100;
  const blemishRemoval = params.blemish_removal / 100;

  const hasRegions = regions && regions.length > 0;
  const mask = hasRegions ? createRegionMask(w, h, regions, containerW || w, containerH || h) : null;

  if (smoothing > 0.01) {
    applyBoxBlur(data, w, h, Math.round(1 + smoothing * 8), mask);
  }

  if (blemishRemoval > 0.01) {
    applyBlemishRemovalInternal(data, w, h, Math.round(1 + blemishRemoval * 6), mask);
  }

  if (brightening > 0.01) {
    for (let i = 0; i < data.length; i += 4) {
      const px = (i / 4) % w;
      const py = Math.floor(i / 4 / w);
      const alpha = mask ? mask[py * w + px] : 1;
      if (alpha < 0.01) continue;
      data[i] = Math.min(255, data[i] * (1 + brightening * 0.4) * alpha + data[i] * (1 - alpha));
      data[i + 1] = Math.min(255, data[i + 1] * (1 + brightening * 0.4) * alpha + data[i + 1] * (1 - alpha));
      data[i + 2] = Math.min(255, data[i + 2] * (1 + brightening * 0.4) * alpha + data[i + 2] * (1 - alpha));
    }
  }

  if (sharpening > 0.01) {
    applyUnsharpMaskInternal(data, w, h, sharpening * 0.3, Math.round(1 + sharpening * 3), mask);
  }

  const detailEnhance = params.detail_enhance / 100;
  if (detailEnhance > 0.01) {
    const enhanced = applyDetailEnhance(result, detailEnhance);
    const srcData = result.data;
    const enhData = enhanced.data;
    for (let i = 0; i < srcData.length; i += 4) {
      srcData[i] = enhData[i];
      srcData[i + 1] = enhData[i + 1];
      srcData[i + 2] = enhData[i + 2];
    }
  }

  const unsharpMask = params.unsharp_mask / 100;
  if (unsharpMask > 0.01) {
    applyUnsharpMaskInternal(data, w, h, unsharpMask, Math.round(1 + unsharpMask * 3), mask);
  }

  const inpaintSpot = params.inpaint_spot / 100;
  if (inpaintSpot > 0.01) {
    const inpainted = applyInpaintSpot(result, inpaintSpot);
    const srcData = result.data;
    const inpData = inpainted.data;
    for (let i = 0; i < srcData.length; i += 4) {
      srcData[i] = inpData[i];
      srcData[i + 1] = inpData[i + 1];
      srcData[i + 2] = inpData[i + 2];
    }
  }

  return result;
}
