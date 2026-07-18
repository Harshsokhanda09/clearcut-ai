import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Zap, ShieldCheck, Wand2, Layers, ImageDown, Cpu, History, Users } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — ClearCut AI" },
      {
        name: "description",
        content:
          "Everything ClearCut AI does: AI background removal, transparent PNG export, history, and more.",
      },
    ],
  }),
  component: FeaturesPage,
});

const FEATURES = [
  {
    icon: Wand2,
    t: "Automatic subject detection",
    d: "AI picks out people, products, and complex subjects — no manual masking.",
  },
  { icon: Zap, t: "Fast processing", d: "Most images finish in a few seconds. No batch queues." },
  {
    icon: ImageDown,
    t: "Transparent PNG export",
    d: "Download a clean cutout with real transparency, ready for any composition.",
  },
  {
    icon: Layers,
    t: "Checkerboard preview",
    d: "See exactly what's transparent before you download.",
  },
  {
    icon: History,
    t: "Browser history",
    d: "Recent removals stay on this device for up to 7 days and can be cleared at any time.",
  },
  {
    icon: ShieldCheck,
    t: "Secure processing",
    d: "Images travel over HTTPS through a same-origin server endpoint to the processing workflow.",
  },
  {
    icon: Cpu,
    t: "Reliable provider proxy",
    d: "The server validates uploads, applies timeouts, and verifies every processor response.",
  },
  {
    icon: Users,
    t: "No account required",
    d: "Use the background remover immediately during the beta without creating an account.",
  },
];

function FeaturesPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold sm:text-5xl">Everything you need to cut backgrounds</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          ClearCut AI is focused on one job — removing backgrounds — and doing it quickly and
          cleanly.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <div className="inline-flex rounded-lg bg-gradient-brand p-2.5 shadow-glow-sm">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
