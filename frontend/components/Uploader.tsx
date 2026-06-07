"use client";

import { useState } from "react";
import { Upload, FileImage, Film } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  onFileSelected: (file: File, previewUrl: string) => void;
}

export default function Uploader({ onFileSelected }: Props) {
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    onFileSelected(file, url);
  }

  return (
    <Card
      className={`p-12 border-2 border-dashed text-center cursor-pointer transition-colors ${
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]!); }}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-lg font-medium mb-2">Drop your photo or video here</p>
      <p className="text-sm text-muted-foreground">
        Supports JPG, PNG, MP4, MOV up to 500MB
      </p>
      <div className="flex gap-4 justify-center mt-4">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileImage className="w-3 h-3" /> Photo
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Film className="w-3 h-3" /> Video
        </span>
      </div>
    </Card>
  );
}
