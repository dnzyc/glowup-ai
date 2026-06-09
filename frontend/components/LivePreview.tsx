"use client";

import { useEffect, useRef, useCallback } from "react";
import { BeautyParams } from "@/lib/beauty-params-adapter";
import { applyEffects, Region } from "@/lib/image-effects";

interface Props {
  imageUrl: string;
  params: BeautyParams;
  enabled: boolean;
  regions?: { x: number; y: number; width: number; height: number }[];
}

export default function LivePreview({ imageUrl, params, enabled, regions }: Props) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);

  function applyEffectsToCanvas() {
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
    const blemishRemoval = params.blemish_removal / 100;

    if (smoothing > 0.01 || brightening > 0.01 || sharpening > 0.01 || blemishRemoval > 0.01) {
      const imageData = ctx.getImageData(0, 0, w, h);

      const mappedRegions: Region[] | undefined = regions?.map((r, i) => ({
        id: `region-${i}`,
        name: `region-${i}`,
        x: r.x * w,
        y: r.y * h,
        width: r.width * w,
        height: r.height * h,
      }));

      const result = applyEffects(imageData, {
        smoothing: params.smoothing,
        brightening: params.brightening,
        sharpening: params.sharpening,
        blemish_removal: params.blemish_removal,
        detail_enhance: params.detail_enhance,
        unsharp_mask: params.unsharp_mask,
        inpaint_spot: params.inpaint_spot,
      }, mappedRegions, w, h);

      ctx.putImageData(result, 0, 0);
    }
  }

  const render = useCallback(() => {
    if (!enabled) return;
    applyEffectsToCanvas();
    rafRef.current = requestAnimationFrame(render);
  }, [params.smoothing, params.brightening, params.sharpening, params.blemish_removal, params.detail_enhance, params.unsharp_mask, params.inpaint_spot, enabled, regions]);

  useEffect(() => {
    if (!enabled) return;
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, render]);

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
      img.onerror = (err) => {
        console.error("Failed to load image:", imageUrl, err);
        const preview = previewRef.current;
        if (preview) {
          const ctx = preview.getContext("2d")!;
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, preview.width, preview.height);
          ctx.fillStyle = "#ff6b6b";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Failed to load image", preview.width / 2, preview.height / 2);
        }
      };
    }
  }, [imageUrl]);

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
