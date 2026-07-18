import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ClearCut AI" },
      {
        name: "description",
        content: "ClearCut AI is a focused tool for removing image backgrounds instantly with AI.",
      },
    ],
  }),
  component: () => (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold sm:text-5xl">About ClearCut AI</h1>
        <div className="prose prose-invert mt-6 max-w-none text-muted-foreground">
          <p>
            ClearCut AI exists because removing a background shouldn't require a design degree or an
            expensive subscription. Whether you're listing a product, cutting a portrait for a
            thumbnail, or building assets for a client, the tool should get out of your way.
          </p>
          <p>
            We focus on doing one thing well: fast, clean AI background removal with a simple and
            transparent workflow. Images are sent securely to our processing service, while recent
            history is stored locally in your browser.
          </p>
          <p>
            We're a small team building tools we'd want to use ourselves. If ClearCut AI helps you
            ship your work faster, we've done our job.
          </p>
        </div>
      </section>
    </SiteLayout>
  ),
});
