"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  { name: "Starter", price: "$5", credits: 10, priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || "price_starter", features: ["Photo beauty processing", "Face smoothing", "Region selection"], costPerPhoto: "$0.50", costPerVideo: "$2.50" },
  { name: "Pro", price: "$20", credits: 50, priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro", features: ["Photo + Video", "Full region selection", "Advanced beauty params", "Priority queue"], highlight: true, costPerPhoto: "$0.40", costPerVideo: "$2.00" },
  { name: "Studio", price: "$50", credits: 150, priceId: process.env.NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID || "price_studio", features: ["Everything in Pro", "4K exports", "Batch processing", "Custom presets"], costPerPhoto: "$0.33", costPerVideo: "$1.67" },
];

export default function PricingCards() {
  async function handlePurchase(planName: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price_id: PLANS.find(p => p.name === planName)?.priceId, user_id: "guest" }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map((plan) => (
        <Card key={plan.name} className={`p-6 ${plan.highlight ? "border-primary ring-2 ring-primary" : ""}`}>
          {plan.highlight && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full mb-2 inline-block">Most Popular</span>}
          <h3 className="text-lg font-bold">{plan.name}</h3>
          <p className="text-3xl font-bold my-2">{plan.price}</p>
          <p className="text-sm text-muted-foreground mb-1">{plan.credits} credits</p>
          <p className="text-xs text-muted-foreground mb-4">{plan.costPerPhoto}/photo · {plan.costPerVideo}/video</p>
          <ul className="space-y-2 mb-6">
            {plan.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> {f}</li>))}
          </ul>
          <Button className="w-full" onClick={() => handlePurchase(plan.name)}><Sparkles className="w-4 h-4 mr-2" /> Get {plan.name}</Button>
        </Card>
      ))}
    </div>
  );
}
