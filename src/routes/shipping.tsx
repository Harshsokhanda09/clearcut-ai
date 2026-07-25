import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery Policy — ClearCut AI" },
      {
        name: "description",
        content: "Shipping and delivery policy for ClearCut AI background removal service.",
      },
    ],
  }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          Shipping & Delivery Policy
        </h1>
        <p className="mt-4 text-sm">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="prose prose-invert mt-6 max-w-none">
          <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
          <p>
            ClearCut AI is a digital service. This Shipping & Delivery Policy explains how we
            deliver our digital products and services to you.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. Digital Delivery</h2>
          <p>
            All our products and services are delivered digitally. There are no physical products
            shipped.
          </p>

          <h2 className="text-xl font-semibold text-foreground">3. Delivery Timeline</h2>
          <h3 className="text-lg font-medium text-foreground">3.1 Subscription Plans</h3>
          <ul>
            <li>
              Access to subscription plans is granted immediately after successful payment is
              confirmed.
            </li>
            <li>You can start using your plan features as soon as your payment is processed.</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground">3.2 Credit Packs</h3>
          <ul>
            <li>
              Credits are added to your account immediately after successful payment is confirmed.
            </li>
            <li>You can start using your credits right away.</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground">3.3 Background Removal Results</h3>
          <ul>
            <li>
              Processed images are typically delivered within seconds, depending on file size and
              server load.
            </li>
            <li>
              In rare cases, processing may take longer. If you experience delays exceeding 5
              minutes, please contact support.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">4. Delivery Issues</h2>
          <p>
            If you do not receive access to your purchased plan or credits within 1 hour of payment,
            please:
          </p>
          <ul>
            <li>Check your email inbox and spam folder for a payment confirmation</li>
            <li>Verify your payment method was charged successfully</li>
            <li>
              Contact us via our{" "}
              <Link to="/contact" className="text-primary hover:underline">
                Contact Us
              </Link>{" "}
              page
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">5. Contact Us</h2>
          <p>If you have any questions about this Shipping & Delivery Policy, please contact us:</p>
          <ul>
            <li>
              Email:{" "}
              <a
                href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || "harshsokhanda54@gmail.com"}`}
                className="text-primary hover:underline"
              >
                {import.meta.env.VITE_CONTACT_EMAIL || "harshsokhanda54@gmail.com"}
              </a>
            </li>
            <li>
              Through our{" "}
              <Link to="/contact" className="text-primary hover:underline">
                Contact Us
              </Link>{" "}
              page
            </li>
          </ul>
        </div>
      </article>
    </SiteLayout>
  ),
});
