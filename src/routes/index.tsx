import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Zap, ShieldCheck, Wand2, Check } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClearCut AI — Remove backgrounds in seconds" },
      {
        name: "description",
        content:
          "Upload any photo and get a clean, transparent PNG in seconds. Built for e-commerce sellers, designers, and creators. Free to start.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
              AI-Powered Background Removal
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Remove Backgrounds In Seconds
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Upload a photo and get a clean, transparent result in seconds. Perfect for product
              listings, social posts, thumbnails, and design work.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/remove-background"
                className="inline-flex items-center rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Start Removing Backgrounds
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-xl border border-border/70 px-6 py-3 text-sm font-semibold hover:bg-accent/10"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Fast",
              body: "Get a transparent PNG in seconds. No queues, no waiting rooms.",
            },
            {
              icon: ShieldCheck,
              title: "Private",
              body: "Images are sent securely for processing, and browser history remains on this device.",
            },
            {
              icon: Wand2,
              title: "Precise",
              body: "Clean cutouts around hair, edges, and complex subjects — powered by AI.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <div className="inline-flex rounded-lg bg-gradient-brand p-2.5 shadow-glow-sm">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three steps. No editing skills required.</p>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Upload", d: "Drop a JPG, PNG, or WEBP up to 10 MB." },
            {
              n: "02",
              t: "Process",
              d: "Our AI isolates your subject and removes the background.",
            },
            { n: "03", t: "Download", d: "Save a clean, transparent PNG ready to use anywhere." },
          ].map((s) => (
            <li key={s.n} className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <div className="text-sm font-semibold text-brand-cyan">{s.n}</div>
              <h3 className="mt-2 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card/40 p-8 md:p-12">
          <h2 className="text-3xl font-bold sm:text-4xl">Built for makers who ship</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Whether you're listing products, designing thumbnails, or building brand assets —
            ClearCut AI removes the busywork.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "E-commerce sellers cleaning product photos",
              "Designers prepping compositions",
              "Content creators making thumbnails",
              "Marketers building ad creatives",
              "Small businesses running their own catalog",
              "Students and hobbyists learning design",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 text-brand-cyan" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold sm:text-5xl">
          Remove a background <span className="text-gradient-brand">free during beta</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          No account or credit card required.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/remove-background"
            className="inline-flex items-center rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Start Removing Backgrounds
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center rounded-xl border border-border/70 px-6 py-3 text-sm font-semibold hover:bg-accent/10"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
