"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Region, BeautyParams } from "@/types";
import { defaultFrontendParams, toBackendParams } from "@/lib/beauty-params-adapter";
import { createClient } from "@/lib/supabase";

interface UseProjectReturn {
  file: File | null;
  previewUrl: string | null;
  processing: boolean;
  regions: Region[];
  params: BeautyParams;
  autoDetect: boolean;
  livePreviewEnabled: boolean;
  regionContainerSize: { w: number; h: number };
  outputFormat: string;
  userId: string;
  isVideo: boolean;
  setFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setParams: (params: BeautyParams) => void;
  setRegions: React.Dispatch<React.SetStateAction<Region[]>>;
  setAutoDetect: React.Dispatch<React.SetStateAction<boolean>>;
  setLivePreviewEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setRegionContainerSize: React.Dispatch<React.SetStateAction<{ w: number; h: number }>>;
  setOutputFormat: React.Dispatch<React.SetStateAction<string>>;
  processMedia: () => Promise<void>;
  reset: () => void;
}

export function useProject(): UseProjectReturn {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [params, setParams] = useState<BeautyParams>(defaultFrontendParams());
  const [processing, setProcessing] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(false);
  const [regionContainerSize, setRegionContainerSize] = useState({ w: 0, h: 0 });
  const [outputFormat, setOutputFormat] = useState("mp4");
  const [userId, setUserId] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const isVideo = file?.type.startsWith("video/") ?? false;

  const processMedia = useCallback(async () => {
    if (!file) return;
    setProcessing(true);

    const backendParams = toBackendParams(params);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId || "anonymous");
    formData.append("media_type", isVideo ? "video" : "photo");
    formData.append("smoothing", String(backendParams.smoothing));
    formData.append("brightening", String(backendParams.brightening));
    formData.append("sharpening", String(backendParams.sharpening));
    formData.append("blemish_removal", String(backendParams.blemish_removal));
    formData.append("detail_enhance", String(backendParams.detail_enhance));
    formData.append("unsharp_mask", String(backendParams.unsharp_mask));
    formData.append("inpaint_spot", String(backendParams.inpaint_spot));
    formData.append("regions", JSON.stringify(regions));
    if (isVideo) {
      formData.append("output_format", outputFormat);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/process`, { method: "POST", body: formData });
      if (res.ok) {
        const job = await res.json();
        router.push(`/dashboard?job=${job.job_id}`);
      } else {
        const err = await res.json().catch(() => ({ detail: "Processing failed" }));
        alert(`Error (${res.status}): ${err.detail}`);
      }
    } catch (e: any) {
      alert(`Connection error: ${e.message || "Could not reach server"}`);
    }
    setProcessing(false);
  }, [file, userId, isVideo, params, regions, outputFormat, router]);

  const reset = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setRegions([]);
    setParams(defaultFrontendParams());
    setProcessing(false);
    setAutoDetect(true);
    setLivePreviewEnabled(false);
    setRegionContainerSize({ w: 0, h: 0 });
    setOutputFormat("mp4");
  }, []);

  return {
    file,
    previewUrl,
    processing,
    regions,
    params,
    autoDetect,
    livePreviewEnabled,
    regionContainerSize,
    outputFormat,
    userId,
    isVideo,
    setFile,
    setPreviewUrl,
    setParams,
    setRegions,
    setAutoDetect,
    setLivePreviewEnabled,
    setRegionContainerSize,
    setOutputFormat,
    processMedia,
    reset,
  };
}
