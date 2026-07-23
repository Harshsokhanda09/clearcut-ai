import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { UploadWorkspace } from "@/components/upload-workspace";

export const Route = createFileRoute("/remove-background")({
  head: () => ({
    meta: [
      { title: "ClearCut AI — Remove image backgrounds" },
      {
        name: "description",
        content:
          "Upload any photo and get a clean, transparent PNG in seconds. Built for e-commerce sellers, designers, and creators. Free to start.",
      },
    ],
  }),
  component: RemoveBackgroundPage,
});

function RemoveBackgroundPage() {
  return (
    <SiteLayout>
      {/* Upload Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div id="upload" className="mx-auto mt-10 max-w-3xl">
            <div className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-glow backdrop-blur sm:p-6">
              <UploadWorkspace />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Free during beta — no sign-up needed. History stays in this browser for up to 7 days.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
