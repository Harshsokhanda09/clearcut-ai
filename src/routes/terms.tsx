import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ClearCut AI" },
      { name: "description", content: "ClearCut AI Terms of Service." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Terms of Service</h1>
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
            Welcome to ClearCut AI. These Terms of Service ("Terms") govern your use of our website
            and services. By using ClearCut AI, you agree to these Terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
          <p>
            ClearCut AI provides an AI-powered background removal service. Users can upload images
            to remove backgrounds and download processed results.
          </p>

          <h2 className="text-xl font-semibold text-foreground">3. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Use the service only for lawful purposes</li>
            <li>
              Have the necessary rights and permissions to upload and process any images you submit
            </li>
            <li>Not upload any infringing, illegal, or harmful content</li>
            <li>Not misuse or attempt to disrupt the service</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">4. Intellectual Property</h2>
          <p>
            ClearCut AI and its original content, features, and functionality are and will remain
            the exclusive property of ClearCut AI and its licensors.
          </p>

          <h2 className="text-xl font-semibold text-foreground">5. Payments and Subscriptions</h2>
          <p>
            Paid plans and credit packs are processed through Razorpay. By purchasing a subscription
            or credit pack, you agree to Razorpay's terms and conditions. Please refer to our{" "}
            <Link to="/refund" className="text-primary hover:underline">
              Refund and Cancellation Policy
            </Link>{" "}
            for details about refunds and cancellations.
          </p>

          <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
          <p>
            In no event shall ClearCut AI, nor its directors, employees, partners, agents,
            suppliers, or affiliates, be liable for any indirect, incidental, special,
            consequential, or punitive damages, including without limitation, loss of profits, data,
            use, goodwill, or other intangible losses, resulting from your use of the service.
          </p>

          <h2 className="text-xl font-semibold text-foreground">7. Disclaimer</h2>
          <p>
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all
            warranties, express or implied.
          </p>

          <h2 className="text-xl font-semibold text-foreground">8. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India.
          </p>

          <h2 className="text-xl font-semibold text-foreground">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will notify you of
            any changes by updating the "Last updated" date at the top of these Terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul>
            <li>Trade Name: ClearCut AI</li>
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
