"use client";

import { useEffect, useRef, useState } from "react";
import { Region, REGION_PRESETS } from "@/types";

interface Props {
  imageUrl: string;
  onRegionsDetected: (regions: Region[]) => void;
  enabled: boolean;
}

declare global {
  interface Window { FaceDetector: any; }
}

export default function FaceDetector({ imageUrl, onRegionsDetected, enabled }: Props) {
  const [detecting, setDetecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!enabled || !imageUrl) return;
    async function detect() {
      setDetecting(true);
      try {
        if ("FaceDetector" in window) {
          const detector = new (window as any).FaceDetector({ fastMode: true });
          const img = imgRef.current;
          if (!img) return;
          const faces = await detector.detect(img);
          const regions: Region[] = [];
          const imgW = img.naturalWidth || img.width;
          const imgH = img.naturalHeight || img.height;
          faces.forEach((face: any, i: number) => {
            const box = face.boundingBox;
            const faceHeight = box.height;
            const faceWidth = box.width;
            const fx = box.x;
            const fy = box.y;

            regions.push({ id: `face_${i}`, name: "face", label: "Face", x: fx / imgW, y: fy / imgH, width: faceWidth / imgW, height: faceHeight / imgH });
            regions.push({ id: `forehead_${i}`, name: "forehead", label: "Forehead", x: fx / imgW, y: fy / imgH, width: faceWidth / imgW, height: (faceHeight * 0.3) / imgH });
            regions.push({ id: `under_eyes_${i}`, name: "under_eyes", label: "Under Eyes", x: (fx + faceWidth * 0.1) / imgW, y: (fy + faceHeight * 0.35) / imgH, width: (faceWidth * 0.8) / imgW, height: (faceHeight * 0.2) / imgH });
          });
          if (regions.length > 0) onRegionsDetected(regions);
        } else {
          console.log("FaceDetector API not available, loading fallback...");
        }
      } catch (e) {
        console.log("Face detection not available:", e);
      }
      setDetecting(false);
    }
    detect();
  }, [imageUrl, enabled]);

  return <img ref={imgRef} src={imageUrl} alt="detection" className="hidden" />;
}
