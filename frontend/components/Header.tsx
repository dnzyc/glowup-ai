"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, Wand2 } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold">GlowUp AI</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm hover:underline hidden sm:inline">Pricing</Link>
          <Link href="/dashboard" className="text-sm hover:underline hidden sm:inline">Dashboard</Link>
          <Link href="/upload">
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" /> Try Now
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
