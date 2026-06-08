"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Uploader from "@/components/Uploader";
import RegionSelector from "@/components/RegionSelector";
import BeautyControls from "@/components/BeautyControls";
import LivePreview from "@/components/LivePreview";
import FaceDetector from "@/components/FaceDetector";
import PresetManager from "@/components/PresetManager";
import { Button } from "@/components/ui/button";
import { Region, BeautyParams } from "@/types";
import { Sparkles, Film } from "lucide-react";

const VIDEO_FORMATS = [
  { value: "mp4", label: "MP4 (H.264)", desc: "Standard web video" },
  { value: "mov", label: "ProRes 422 (.mov)", desc: "Professional grade, 10-bit" },
  { value: "prores", label: "ProRes 4444", desc: "Highest quality, 12-bit" },
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [params, setParams] = useState<BeautyParams>({ smoothing: 50, brightening: 30, sharpening: 20, blemishRemoval: 0 });
  const [processing, setProcessing] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(false);
  const [outputFormat, setOutputFormat] = useState("mp4");
  const router = useRouter();

  const isVideo = file?.type.startsWith("video/");

  async function handleProcess() {
    if (!file) return;
    setProcessing(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", "anonymous");
    formData.append("media_type", isVideo ? "video" : "photo");
    formData.append("smoothing", String(params.smoothing));
    formData.append("brightening", String(params.brightening));
    formData.append("sharpening", String(params.sharpening));
    formData.append("blemish_removal", String(params.blemishRemoval));
    if (isVideo) {
      formData.append("output_format", outputFormat);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/process`, { method: "POST", body: formData });
      if (res.ok) {
        const job = await res.json();
        router.push(`/dashboard?job=${job.job_id}`);
      }
    } catch {}
    setProcessing(false);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">New Project</h1>
      {!previewUrl ? (
        <Uploader onFileSelected={(f, url) => { setFile(f); setPreviewUrl(url); }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <RegionSelector imageUrl={previewUrl} regions={regions} onRegionsChange={setRegions} />
            {isVideo && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4" />
                  <span className="text-sm font-medium">Output Format</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {VIDEO_FORMATS.map((fmt) => (
                    <button key={fmt.value}
                      onClick={() => setOutputFormat(fmt.value)}
                      className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                        outputFormat === fmt.value
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="font-semibold mb-1">{fmt.label}</div>
                      <div className="text-muted-foreground">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="live-preview" checked={livePreviewEnabled}
                onChange={(e) => setLivePreviewEnabled(e.target.checked)} />
              <label htmlFor="live-preview" className="text-sm cursor-pointer">Live preview beauty effects</label>
            </div>
            {livePreviewEnabled && <LivePreview imageUrl={previewUrl!} params={params} enabled={livePreviewEnabled} />}
          </div>
          <div className="space-y-4">
            <BeautyControls params={params} onChange={setParams} />
            <PresetManager currentParams={params} onLoad={setParams} />
            <Button className="w-full" size="lg" onClick={handleProcess} disabled={processing}>
              <Sparkles className="w-4 h-4 mr-2" />
              {processing ? "Processing..." : isVideo ? "Process Video" : "Apply Beauty"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setPreviewUrl(null); setRegions([]); }}>
              Change File
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <input type="checkbox" id="auto-detect" checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} />
        <label htmlFor="auto-detect" className="text-xs cursor-pointer">Auto-detect face regions</label>
      </div>
      <FaceDetector imageUrl={previewUrl!} enabled={autoDetect} onRegionsDetected={(r) => setRegions(prev => prev.length === 0 ? r : prev)} />
    </div>
  );
}
