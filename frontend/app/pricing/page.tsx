import PricingCards from "@/components/PricingCards";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl text-center">
      <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
      <p className="text-lg text-muted-foreground mb-12">Pay only for what you use. Credits never expire.</p>
      <PricingCards />
    </div>
  );
}
