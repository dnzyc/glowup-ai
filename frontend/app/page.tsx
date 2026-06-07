import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Download, Zap } from "lucide-react";

export default function Home() {
  return (
    <main>
      <section className="container mx-auto px-4 py-20 text-center max-w-4xl">
        <h1 className="text-5xl font-bold mb-6 tracking-tight">AI-Powered Beauty Retouching</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Professional-grade photo and video beauty enhancement. Select specific regions, adjust intensity, get Hollywood-quality results — all powered by AI.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/upload"><Button size="lg"><Sparkles className="w-5 h-5 mr-2" /> Try It Free</Button></Link>
          <Link href="/pricing"><Button size="lg" variant="outline">View Pricing</Button></Link>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Upload, title: "Upload", desc: "Drag and drop your photo or video." },
            { icon: Sparkles, title: "Select & Enhance", desc: "Choose face, body, or specific regions. Adjust beauty intensity." },
            { icon: Download, title: "Download", desc: "Get your professionally retouched result in seconds." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6">
              <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Like Flame & Nuke, but AI-powered</h2>
          <p className="text-muted-foreground mb-8">Gradeable beauty controls · Region-specific application · Skin smoothing · Blemish removal · Face enhancement</p>
          <Zap className="w-8 h-8 mx-auto text-primary" />
        </div>
      </section>
    </main>
  );
}
