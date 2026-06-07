"use client";

import { Button } from "@/components/ui/button";
import { Twitter, Download, Copy } from "lucide-react";

interface Props {
  imageUrl?: string;
  title?: string;
}

export default function ShareButtons({ imageUrl, title = "Retouched with GlowUp AI" }: Props) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function shareTwitter() {
    const text = encodeURIComponent(`${title}\n\nTry GlowUp AI: free professional beauty retouching`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "GlowUp AI", text: title, url: shareUrl });
      } catch {}
    }
  }

  function downloadImage() {
    if (imageUrl) {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = "glowup-result.png";
      a.click();
    }
  }

  return (
    <div className="flex gap-2 mt-4">
      <Button variant="outline" size="sm" onClick={shareTwitter}>
        <Twitter className="w-4 h-4 mr-1" /> Share
      </Button>
      <Button variant="outline" size="sm" onClick={shareNative}>
        <Copy className="w-4 h-4 mr-1" /> Share Link
      </Button>
      {imageUrl && (
        <Button variant="outline" size="sm" onClick={downloadImage}>
          <Download className="w-4 h-4 mr-1" /> Download
        </Button>
      )}
    </div>
  );
}
