export interface Region {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BeautyParams {
  smoothing: number;
  brightening: number;
  sharpening: number;
  blemishRemoval: number;
  detailEnhance: number;
  unsharpMask: number;
  inpaintSpot: number;
}

export interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  inputUrl: string;
  outputUrl?: string;
  mediaType: "photo" | "video";
  creditCost: number;
  createdAt: string;
}

export const REGION_PRESETS = [
  { id: "full_body", label: "Full Body" },
  { id: "face", label: "Face" },
  { id: "forehead", label: "Forehead" },
  { id: "under_eyes", label: "Under Eyes" },
  { id: "left_arm", label: "Left Arm" },
  { id: "right_arm", label: "Right Arm" },
  { id: "torso", label: "Torso" },
  { id: "legs", label: "Legs" },
];
