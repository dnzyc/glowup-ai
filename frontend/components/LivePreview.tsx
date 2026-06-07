"use client";

import { useEffect, useRef, useCallback } from "react";
import { BeautyParams } from "@/types";

interface Props {
  imageUrl: string;
  params: BeautyParams;
  enabled: boolean;
}

export default function LivePreview({ imageUrl, params, enabled }: Props) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);

  function applyEffects() {
    if (!enabled) return;
    const source = sourceRef.current;
    const preview = previewRef.current;
    if (!source || !preview) return;

    const ctx = preview.getContext("2d")!;
    const w = source.width;
    const h = source.height;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0);

    const smoothing = params.smoothing / 100;
    const brightening = params.brightening / 100;
    const sharpening = params.sharpening / 100;
    const blemishRemoval = params.blemishRemoval / 100;

    if (smoothing > 0.01 || brightening > 0.01 || sharpening > 0.01 || blemishRemoval > 0.01) {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      if (smoothing > 0.01) {
        applyBoxBlur(data, w, h, Math.round(1 + smoothing * 8));
      }

      if (blemishRemoval > 0.01) {
        applyBlemishRemoval(data, w, h, Math.round(1 + blemishRemoval * 6));
      }

      if (brightening > 0.01) {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * (1 + brightening * 0.4));
          data[i + 1] = Math.min(255, data[i + 1] * (1 + brightening * 0.4));
          data[i + 2] = Math.min(255, data[i + 2] * (1 + brightening * 0.4));
        }
      }

      if (sharpening > 0.01) {
        applyUnsharpMask(data, w, h, sharpening * 0.3, Math.round(1 + sharpening * 3));
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }

  function applyBoxBlur(data: Uint8ClampedArray, w: number, h: number, radius: number) {
    const copy = new Uint8ClampedArray(data);
    const r = Math.max(1, radius);
    for (let y = r; y < h - r; y++) {
      for (let x = r; x < w - r; x++) {
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

  function applyBlemishRemoval(data: Uint8ClampedArray, w: number, h: number, radius: number) {
    const copy = new Uint8ClampedArray(data);
    const r = Math.max(1, radius);
    for (let y = r; y < h - r; y++) {
      for (let x = r; x < w - r; x++) {
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

  function detectEdge(data: Uint8ClampedArray, w: number, x: number, y: number): number {
    if (x < 1 || y < 1 || x >= w - 1) return 0;
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

  function applyUnsharpMask(data: Uint8ClampedArray, w: number, h: number, amount: number, radius: number) {
    const blurred = new Uint8ClampedArray(data);
    applyBoxBlur(blurred, w, h, radius);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.min(255, Math.max(0, data[i] + (data[i] - blurred[i]) * amount));
    }
  }

  const render = useCallback(() => {
    applyEffects();
    rafRef.current = requestAnimationFrame(render);
  }, [params, enabled]);

  useEffect(() => {
    if (!imgRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        imgRef.current = img;
        const source = sourceRef.current;
        const preview = previewRef.current;
        if (source && preview) {
          const maxW = 512;
          const scale = Math.min(1, maxW / img.width);
          source.width = preview.width = img.width * scale;
          source.height = preview.height = img.height * scale;
          source.getContext("2d")!.drawImage(img, 0, 0, source.width, source.height);
          preview.getContext("2d")!.drawImage(source, 0, 0);
        }
      };
    }
  }, [imageUrl]);

  useEffect(() => {
    if (!enabled) return;
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, render]);

  return (
    <div className="relative">
      <canvas ref={sourceRef} className="hidden" />
      <canvas ref={previewRef} className="w-full rounded-lg" />
      {enabled && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
          Live Preview
        </div>
      )}
    </div>
  );
}
