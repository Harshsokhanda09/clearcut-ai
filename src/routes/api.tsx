import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "ClearCut AI — API" },
      {
        name: "description",
        content: "ClearCut AI API documentation",
      },
    ],
  }),
  component: ApiPage,
});

function ApiPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-3xl font-bold">API</h1>
            <p className="mt-3 text-muted-foreground">ClearCut AI API documentation</p>
            <div className="mt-8">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
