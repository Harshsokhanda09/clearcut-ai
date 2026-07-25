import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ClearCut AI" },
      { name: "description", content: "How ClearCut AI handles your data." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Privacy Policy</h1>
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
            Welcome to ClearCut AI. We respect your privacy and are committed to protecting your
            personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you visit our website and use our services.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
          <h3 className="text-lg font-medium text-foreground">2.1 Personal Information</h3>
          <p>When you create an account or make a purchase, we may collect:</p>
          <ul>
            <li>Email address</li>
            <li>Name</li>
            <li>
              Payment information (processed securely through Razorpay - we do not store full
              credit/debit card details)
            </li>
          </ul>

          <h3 className="text-lg font-medium text-foreground">2.2 Image Data</h3>
          <p>When you use our background removal service:</p>
          <ul>
            <li>Your uploaded images are temporarily processed for background removal</li>
            <li>Processed results are stored locally in your browser's IndexedDB</li>
            <li>We do not permanently store your uploaded or processed images on our servers</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground">2.3 Usage Data</h3>
          <p>We may collect non-personal usage information:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Pages visited on our website</li>
            <li>Time and date of visit</li>
            <li>Other diagnostic data</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
          <p>We use your information for:</p>
          <ul>
            <li>Providing and maintaining our services</li>
            <li>Processing payments (through our payment processor, Razorpay)</li>
            <li>Communicating with you about our services</li>
            <li>Improving our website and services</li>
            <li>Detecting and preventing fraud</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">4. Data Sharing and Disclosure</h2>
          <h3 className="text-lg font-medium text-foreground">4.1 Service Providers</h3>
          <p>We may share your information with third-party service providers:</p>
          <ul>
            <li>
              <strong>Vercel:</strong> Hosts our web application
            </li>
            <li>
              <strong>Razorpay:</strong> Processes payments on our behalf. Razorpay's privacy policy
              applies to payment processing.
            </li>
            <li>
              <strong>n8n/Cloudinary:</strong> Processes images for background removal.
            </li>
          </ul>

          <h3 className="text-lg font-medium text-foreground">4.2 Legal Requirements</h3>
          <p>
            We may disclose your information if required by law or in response to valid requests by
            public authorities.
          </p>

          <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
          <p>
            We use reasonable security measures to protect your personal data. However, no method of
            transmission over the Internet is 100% secure, and we cannot guarantee absolute
            security.
          </p>

          <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing</li>
            <li>Request data portability</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in Section 8.
          </p>

          <h2 className="text-xl font-semibold text-foreground">7. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly
            collect personal information from children.
          </p>

          <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us:</p>
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
