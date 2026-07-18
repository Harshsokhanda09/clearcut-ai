import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ClearCut AI" },
      {
        name: "description",
        content: "Simple pricing for ClearCut AI. Start free, upgrade when you need more.",
      },
    ],
  }),
  component: PricingPage,
});

const TIERS = [
  {
    name: "Free",
    price: "₹0",
    cadence: "forever",
    highlight: false,
    features: [
      "Free during beta",
      "Standard quality",
      "7-day browser history",
      "JPG, PNG, and WEBP up to 10 MB",
    ],
    cta: "Try it free",
    available: true,
  },
  {
    name: "Pro",
    price: "₹499",
    cadence: "per month",
    highlight: true,
    features: [
      "500 removals / month",
      "High-resolution downloads",
      "Priority processing",
      "Extended history",
      "Email support",
    ],
    cta: "Coming soon",
    available: false,
  },
  {
    name: "Credit pack",
    price: "₹999",
    cadence: "one-time",
    highlight: false,
    features: [
      "1,000 credits",
      "Credits never expire in v1",
      "Perfect for occasional bursts",
      "Stacks with any plan",
    ],
    cta: "Coming soon",
    available: false,
  },
];

function PricingPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold sm:text-5xl">Simple, honest pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Start free. Upgrade when you're ready. Payments are coming soon — join now to get
          grandfathered pricing.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:px-6 md:grid-cols-3 lg:px-8">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-3xl border p-8 ${
              t.highlight
                ? "border-transparent bg-gradient-brand/10 shadow-glow"
                : "border-border/60 bg-card/40"
            }`}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow-sm">
                Most popular
              </div>
            )}
            <div className="text-sm font-semibold text-muted-foreground">{t.name}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{t.price}</span>
              <span className="text-sm text-muted-foreground">{t.cadence}</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-brand-cyan" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {t.available ? (
              <Link
                to="/"
                hash="upload"
                className="mt-8 block rounded-lg border border-border/70 px-4 py-2.5 text-center text-sm font-semibold hover:bg-accent/10"
              >
                {t.cta}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className={`mt-8 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold opacity-60 ${
                  t.highlight
                    ? "bg-gradient-brand text-primary-foreground shadow-glow-sm"
                    : "border border-border/70"
                }`}
              >
                {t.cta}
              </button>
            )}
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
