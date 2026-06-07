"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="text-xl font-bold">
          GlowUp AI
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm hover:underline">
            Pricing
          </Link>
          <Link href="/dashboard" className="text-sm hover:underline">
            Dashboard
          </Link>
          <Link href="/upload">
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" /> New Project
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
