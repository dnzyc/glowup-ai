"use client";

import { useState } from "react";

interface Props { original: string; processed: string }

export default function BeforeAfter({ original, processed }: Props) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="relative overflow-hidden rounded-lg select-none" style={{ aspectRatio: "1" }}>
      <img src={processed} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={original} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: `${100 / (sliderPos / 100)}%` }} />
      </div>
      <input
        type="range" min={0} max={100} value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize"
      />
      <div className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full w-8 h-8 shadow-lg flex items-center justify-center text-xs font-bold border-2 border-primary" style={{ left: `${sliderPos}%`, marginLeft: "-16px" }}>
        ⇔
      </div>
      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Before</div>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">After</div>
    </div>
  );
}
