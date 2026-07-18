import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ClearCut AI" },
      { name: "description", content: "ClearCut AI Terms of Service." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl space-y-4 px-4 py-20 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Terms of Service</h1>
        <p className="italic">Placeholder — legal review required before launch.</p>
        <p>
          By using ClearCut AI you agree to use the service only for lawful purposes. You are
          responsible for the content you upload and for having the right to process it.
        </p>
        <p>
          We provide the service on an "as-is" basis. Beta availability, fair-use limits, feature
          availability, and planned pricing may change at any time.
        </p>
      </article>
    </SiteLayout>
  ),
});
