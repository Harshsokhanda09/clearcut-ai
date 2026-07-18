import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ClearCut AI" },
      { name: "description", content: "How ClearCut AI handles your data." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl space-y-4 px-4 py-20 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Privacy Policy</h1>
        <p className="italic">
          This document is a placeholder and should receive professional legal review before launch.
        </p>
        <p>
          <span className="font-semibold text-foreground">What we process.</span> When you use the
          remover, your image and its MIME type are sent through the ClearCut AI server to the
          background-removal workflow. The current beta does not require an account or collect
          payment information.
        </p>
        <p>
          <span className="font-semibold text-foreground">Browser storage.</span> The selected image
          and recent results are stored in IndexedDB in this browser. History is limited to 50
          items, expires after 7 days, and can be removed immediately from the History page. Anyone
          using the same browser profile can see that local history, so clear it on shared devices.
        </p>
        <p>
          <span className="font-semibold text-foreground">Service providers.</span> Vercel hosts the
          web application, n8n runs the processing workflow, and Cloudinary currently delivers the
          processed result. These providers may receive the image, IP address, and standard request
          metadata needed to operate the service.
        </p>
        <p>
          <span className="font-semibold text-foreground">Your choices.</span> You can clear local
          results at any time. Do not upload sensitive images unless you are comfortable sending
          them to the listed processing providers.
        </p>
        <p>
          <span className="font-semibold text-foreground">Contact.</span>{" "}
          <a className="text-primary hover:underline" href="mailto:harshsokhanda54@gmail.com">
            harshsokhanda54@gmail.com
          </a>
        </p>
      </article>
    </SiteLayout>
  ),
});
