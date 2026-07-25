import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund and Cancellation Policy — ClearCut AI" },
      {
        name: "description",
        content: "Refund and cancellation policy for ClearCut AI background removal service.",
      },
    ],
  }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          Refund and Cancellation Policy
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
            Thank you for choosing ClearCut AI. This Refund and Cancellation Policy outlines our
            terms for refunds, cancellations, and disputes regarding our paid subscriptions and
            credit packs.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. Eligibility for Refunds</h2>
          <h3 className="text-lg font-medium text-foreground">2.1 Subscription Plans</h3>
          <ul>
            <li>
              You may request a full refund for your first subscription payment within 7 days of
              purchase if you have not used more than 10% of your plan's monthly quota.
            </li>
            <li>
              Subsequent subscription renewals are non-refundable. You may cancel your subscription
              at any time to prevent future charges.
            </li>
          </ul>

          <h3 className="text-lg font-medium text-foreground">2.2 Credit Packs</h3>
          <ul>
            <li>
              Credit packs are eligible for a full refund within 7 days of purchase if you have not
              used more than 10% of the purchased credits.
            </li>
            <li>
              Once credits are used, they are non-refundable. Unused credits do not expire as per
              our current policy.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">3. How to Request a Refund</h2>
          <p>
            To request a refund, please contact us at{" "}
            <Link to="/contact" className="text-primary hover:underline">
              contact page
            </Link>{" "}
            or email us directly at{" "}
            <a
              href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || "harshsokhanda54@gmail.com"}`}
              className="text-primary hover:underline"
            >
              {import.meta.env.VITE_CONTACT_EMAIL || "harshsokhanda54@gmail.com"}
            </a>
            . Please include:
          </p>
          <ul>
            <li>Your full name</li>
            <li>Email address associated with your account</li>
            <li>Order or transaction ID</li>
            <li>Reason for refund request</li>
          </ul>
          <p>
            We will review your request and respond within 3-5 business days. If approved, refunds
            will be processed to the original payment method within 7-10 business days.
          </p>

          <h2 className="text-xl font-semibold text-foreground">4. Cancellation Policy</h2>
          <h3 className="text-lg font-medium text-foreground">4.1 Subscriptions</h3>
          <ul>
            <li>
              You may cancel your subscription at any time from your account dashboard or by
              contacting support.
            </li>
            <li>
              Cancellation will take effect at the end of your current billing cycle. You will
              continue to have access to your plan until that time.
            </li>
            <li>
              No partial refunds are provided for unused portion of the current billing period.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">5. Exceptions</h2>
          <p>We reserve the right to refuse a refund request if:</p>
          <ul>
            <li>You have violated our Terms of Service</li>
            <li>You have exceeded the usage limits mentioned in Section 2</li>
            <li>
              The request is made after the 7-day period (except in cases of proven service
              unavailability or technical failure)
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
          <p>
            If you have any questions about this Refund and Cancellation Policy, please contact us:
          </p>
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
