import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "harshsokhanda54@gmail.com";
const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || "+91-0000000000";
const CONTACT_ADDRESS = import.meta.env.VITE_CONTACT_ADDRESS || "Your City, Your State, India";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ClearCut AI" },
      { name: "description", content: "Get in touch with the ClearCut AI team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = encodeURIComponent(`ClearCut AI message from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    form.reset();
    toast.success("Your email app is ready with the message.");
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold sm:text-5xl">Contact Us</h1>
        <p className="mt-3 text-muted-foreground">
          Questions, feedback, or partnership ideas? We'd love to hear from you.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Trade Name</p>
                <p className="text-sm text-muted-foreground">ClearCut AI</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Email</p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Phone</p>
                <a
                  href={`tel:${CONTACT_PHONE}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {CONTACT_PHONE}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Address</p>
                <p className="text-sm text-muted-foreground">{CONTACT_ADDRESS}</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-border/60 bg-card/40 p-6"
          >
            <label className="block">
              <span className="text-sm font-medium">Name</span>
              <input
                required
                name="name"
                className="mt-1 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                required
                type="email"
                name="email"
                className="mt-1 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Message</span>
              <textarea
                required
                name="message"
                rows={5}
                className="mt-1 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm"
            >
              <Mail className="h-4 w-4" /> Open email app
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
