"use client";

import { BeautyParams } from "@/types";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Props {
  params: BeautyParams;
  onChange: (params: BeautyParams) => void;
}

const CONTROLS: { key: keyof BeautyParams; label: string }[] = [
  { key: "smoothing", label: "Skin Smoothing" },
  { key: "brightening", label: "Brightening" },
  { key: "sharpening", label: "Sharpening" },
  { key: "blemishRemoval", label: "Blemish Removal" },
  { key: "detailEnhance", label: "Detail Enhance" },
  { key: "unsharpMask", label: "Unsharp Mask" },
  { key: "inpaintSpot", label: "Spot Removal" },
];

export default function BeautyControls({ params, onChange }: Props) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Beauty Settings</h3>
      {CONTROLS.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-xs">{label}</Label>
            <span className="text-xs text-muted-foreground">{params[key]}%</span>
          </div>
          <Slider
            value={[params[key]]}
            onValueChange={(val) => onChange({ ...params, [key]: Array.isArray(val) ? val[0] : val })}
            min={0}
            max={100}
            step={1}
          />
        </div>
      ))}
    </Card>
  );
}
