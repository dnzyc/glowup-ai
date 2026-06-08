"use client";

import { useState, useRef, useEffect } from "react";
import { Region, REGION_PRESETS } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  imageUrl: string;
  regions: Region[];
  onRegionsChange: (regions: Region[]) => void;
  onContainerSize?: (w: number, h: number) => void;
}

export default function RegionSelector({ imageUrl, regions, onRegionsChange, onContainerSize }: Props) {
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [activePreset, setActivePreset] = useState("full_body");
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (containerSize.w > 0 && containerSize.h > 0 && onContainerSize) {
      onContainerSize(containerSize.w, containerSize.h);
    }
  }, [containerSize, onContainerSize]);

  function getRelativePos(e: React.MouseEvent): { x: number; y: number } {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseDown(e: React.MouseEvent) {
    const pos = getRelativePos(e);
    setStartPos(pos);
    setDrawing(true);
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (!drawing) return;
    const endPos = getRelativePos(e);
    const w = Math.abs(endPos.x - startPos.x);
    const h = Math.abs(endPos.y - startPos.y);
    if (w < 10 || h < 10) { setDrawing(false); return; }
    const newRegion: Region = {
      id: `${activePreset}_${Date.now()}`,
      name: activePreset,
      label: REGION_PRESETS.find((p) => p.id === activePreset)?.label || activePreset,
      x: Math.min(startPos.x, endPos.x),
      y: Math.min(startPos.y, endPos.y),
      width: w,
      height: h,
    };
    onRegionsChange([...regions, newRegion]);
    setDrawing(false);
  }

  function removeRegion(id: string) {
    onRegionsChange(regions.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {REGION_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant={activePreset === preset.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActivePreset(preset.id)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div ref={containerRef} className="relative border rounded-lg overflow-hidden bg-black">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Preview"
          className="w-full object-contain"
          draggable={false}
          onLoad={() => {
            if (imgRef.current && containerRef.current) {
              const rect = imgRef.current.getBoundingClientRect();
              setContainerSize({ w: rect.width, h: rect.height });
            }
          }}
        />
        <div
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        {regions.map((region) => (
          <div
            key={region.id}
            className="absolute border-2 border-primary bg-primary/20"
            style={{
              left: region.x,
              top: region.y,
              width: region.width,
              height: region.height,
            }}
          >
            <Badge
              className="absolute -top-3 -right-2 cursor-pointer text-xs"
              variant="destructive"
              onClick={() => removeRegion(region.id)}
            >
              {region.label} ✕
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
