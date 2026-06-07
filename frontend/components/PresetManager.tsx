"use client";

import { useState, useEffect } from "react";
import { BeautyParams } from "@/types";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";

interface Preset {
  name: string;
  params: BeautyParams;
}

interface Props {
  currentParams: BeautyParams;
  onLoad: (params: BeautyParams) => void;
}

export default function PresetManager({ currentParams, onLoad }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("glowup_presets");
      if (saved) setPresets(JSON.parse(saved));
    } catch {}
  }, []);

  function savePreset() {
    if (!presetName.trim()) return;
    const newPreset: Preset = { name: presetName.trim(), params: { ...currentParams } };
    const updated = [...presets.filter(p => p.name !== newPreset.name), newPreset];
    setPresets(updated);
    localStorage.setItem("glowup_presets", JSON.stringify(updated));
    setPresetName("");
  }

  function deletePreset(name: string) {
    const updated = presets.filter(p => p.name !== name);
    setPresets(updated);
    localStorage.setItem("glowup_presets", JSON.stringify(updated));
  }

  if (presets.length === 0 && !presetName) {
    return (
      <div className="text-xs text-muted-foreground mt-2">
        <p>Save your settings as a preset for quick reuse.</p>
        <input
          type="text"
          placeholder="Preset name..."
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && savePreset()}
          className="mt-1 w-full text-xs border rounded px-2 py-1"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="New preset..."
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && savePreset()}
          className="flex-1 text-xs border rounded px-2 py-1"
        />
        <Button variant="outline" size="sm" onClick={savePreset} disabled={!presetName.trim()}>
          <Save className="w-3 h-3" />
        </Button>
      </div>
      <div className="max-h-24 overflow-y-auto space-y-1">
        {presets.map((p) => (
          <div key={p.name} className="flex items-center justify-between text-xs bg-muted rounded px-2 py-1">
            <button onClick={() => onLoad(p.params)} className="hover:underline truncate flex-1 text-left">
              {p.name}
            </button>
            <button onClick={() => deletePreset(p.name)} className="text-red-500 hover:text-red-700 ml-1">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
