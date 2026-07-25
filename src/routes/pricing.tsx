import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ClearCut AI" },
      {
        name: "description",
        content: "Simple pricing for ClearCut AI. Start free, upgrade when you need more.",
      },
    ],
  }),
  component: PricingPage,
});

interface BaseTier {
  name: string;
  price: string;
  cadence: string;
  highlight: boolean;
  features: string[];
  cta: string;
  available: boolean;
}

interface PaidTier extends BaseTier {
  amount: number;
}

type Tier = BaseTier | PaidTier;

function isPaidTier(tier: Tier): tier is PaidTier {
  return "amount" in tier && typeof (tier as PaidTier).amount === "number";
}

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "₹0",
    cadence: "forever",
    highlight: false,
    features: [
      "Free during beta",
      "Standard quality",
      "7-day browser history",
      "JPG, PNG, and WEBP up to 10 MB",
    ],
    cta: "Try it free",
    available: true,
  },
  {
    name: "Pro",
    price: "₹499",
    amount: 49900,
    cadence: "per month",
    highlight: true,
    features: [
      "500 removals / month",
      "High-resolution downloads",
      "Priority processing",
      "Extended history",
      "Email support",
    ],
    cta: "Get Pro",
    available: true,
  },
  {
    name: "Credit pack",
    price: "₹999",
    amount: 99900,
    cadence: "one-time",
    highlight: false,
    features: [
      "1,000 credits",
      "Credits never expire in v1",
      "Perfect for occasional bursts",
      "Stacks with any plan",
    ],
    cta: "Buy credits",
    available: true,
  },
];

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  handler?: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
}

interface RazorpayVerifyResponse {
  success: boolean;
  message?: string;
}

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function createRazorpayOrder(amount: number): Promise<RazorpayOrderResponse> {
  const response = await fetch("/api/razorpay-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to create payment order");
  }

  return response.json();
}

async function verifyRazorpayPayment(
  payload: RazorpaySuccessResponse,
): Promise<RazorpayVerifyResponse> {
  const response = await fetch("/api/razorpay-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Payment verification failed");
  }

  return response.json();
}

function PricingPage() {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [successTier, setSuccessTier] = useState<string | null>(null);
  const razorpayInstanceRef = useRef<RazorpayInstance | null>(null);
  const paymentInProgressRef = useRef(false);

  const resetPaymentState = useCallback(() => {
    setLoadingTier(null);
    razorpayInstanceRef.current = null;
    paymentInProgressRef.current = false;
  }, []);

  // Load Razorpay script on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const loaded = await loadRazorpayScript();
      if (!cancelled) {
        if (loaded) {
          setRazorpayLoaded(true);
        } else {
          toast.error("Failed to load payment gateway. Please refresh the page.");
        }
      }
    })();

    // Periodic safety check for up to 8s
    const interval = setInterval(() => {
      if (window.Razorpay && !razorpayLoaded) {
        setRazorpayLoaded(true);
        clearInterval(interval);
      }
    }, 500);

    const timeout = setTimeout(() => clearInterval(interval), 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [razorpayLoaded]);

  // Reset state on browser back / forward / pageshow (navigation restoration)
  useEffect(() => {
    const handlePopState = () => {
      resetPaymentState();
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        resetPaymentState();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [resetPaymentState]);

  // Cleanup Razorpay and state on component unmount
  useEffect(() => {
    return () => {
      razorpayInstanceRef.current = null;
      paymentInProgressRef.current = false;
    };
  }, []);

  const openRazorpayCheckout = useCallback(
    async (tier: Tier) => {
      if (!isPaidTier(tier)) {
        toast.error("This tier does not require payment");
        return;
      }

      if (paymentInProgressRef.current) {
        toast.info("Payment already in progress...");
        return;
      }

      if (!razorpayLoaded || !window.Razorpay) {
        toast.error("Payment gateway loading, please wait...");
        return;
      }

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId || !keyId.startsWith("rzp_")) {
        toast.error("Payment gateway not configured. Contact support.");
        return;
      }

      paymentInProgressRef.current = true;
      setLoadingTier(tier.name);
      setSuccessTier(null);

      let orderCreated = false;

      try {
        const orderData = await createRazorpayOrder(tier.amount);
        orderCreated = true;

        let verificationPromise: Promise<RazorpayVerifyResponse> | null = null;
        let dismissTriggered = false;

        const handleDismiss = () => {
          if (dismissTriggered) return;
          dismissTriggered = true;
          if (!verificationPromise) {
            toast.info("Payment cancelled");
          }
          resetPaymentState();
        };

        const options: RazorpayOptions = {
          key: keyId,
          amount: tier.amount,
          currency: "INR",
          name: "ClearCut AI",
          description: tier.name === "Pro" ? "Pro Subscription" : "Credit Pack",
          image: "/LOGO.png",
          order_id: orderData.id,
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          notes: {
            plan: tier.name,
          },
          theme: {
            color: "#3399cc",
          },
          modal: {
            ondismiss: handleDismiss,
            escape: true,
            backdropclose: true,
          },
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              verificationPromise = verifyRazorpayPayment(response);
              const result = await verificationPromise;

              if (result.success) {
                setSuccessTier(tier.name);
                toast.success(
                  tier.name === "Pro"
                    ? "Pro plan activated successfully!"
                    : "Credits added successfully!",
                );
              } else {
                toast.error(result.message || "Payment verification failed. Contact support.");
              }
            } catch (verifyError) {
              console.error("[pricing] Verify error:", verifyError);
              toast.error(
                verifyError instanceof Error ? verifyError.message : "Payment verification failed",
              );
            } finally {
              resetPaymentState();
            }
          },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.on("payment.failed", (response: unknown) => {
          console.error("[pricing] Payment failed:", response);
          const failResp = response as {
            error?: { description?: string; reason?: string };
          };
          const reason =
            failResp?.error?.description ||
            failResp?.error?.reason ||
            "Payment failed. Please try again.";
          toast.error(reason);
          resetPaymentState();
        });

        razorpayInstanceRef.current = razorpay;
        setLoadingTier(null);
        razorpay.open();
      } catch (error) {
        console.error("[pricing] Payment flow error:", error);
        toast.error(
          error instanceof Error
            ? orderCreated
              ? error.message
              : `Order failed: ${error.message}`
            : "Failed to start payment. Please try again.",
        );
        resetPaymentState();
      } finally {
        // Safety net: if for some reason state still references the old tier 4s after
        // starting (e.g. Razorpay never rendered), allow retries.
        setTimeout(() => {
          if (paymentInProgressRef.current && !razorpayInstanceRef.current) {
            resetPaymentState();
          }
        }, 4000);
      }
    },
    [razorpayLoaded, resetPaymentState],
  );

  const getButtonText = (tier: Tier) => {
    if (successTier === tier.name) {
      return tier.name === "Pro" ? "Pro Activated" : "Purchased";
    }
    if (loadingTier === tier.name) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          Processing...
        </div>
      );
    }
    return tier.cta;
  };

  const isButtonDisabled = (tier: Tier) => {
    if (successTier === tier.name) return true;
    if (loadingTier === tier.name) return true;
    if (razorpayInstanceRef.current && loadingTier === tier.name) return true;
    if (paymentInProgressRef.current && loadingTier === tier.name) return true;
    return false;
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold sm:text-5xl">Simple, honest pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Start free. Upgrade when you're ready.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:px-6 md:grid-cols-3 lg:px-8">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-3xl border p-8 ${
              t.highlight
                ? "border-transparent bg-gradient-brand/10 shadow-glow"
                : "border-border/60 bg-card/40"
            }`}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow-sm">
                Most popular
              </div>
            )}
            <div className="text-sm font-semibold text-muted-foreground">{t.name}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{t.price}</span>
              <span className="text-sm text-muted-foreground">{t.cadence}</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-brand-cyan" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {t.name === "Free" ? (
              <Link
                to="/"
                hash="upload"
                className="mt-8 block rounded-lg border border-border/70 px-4 py-2.5 text-center text-sm font-semibold hover:bg-accent/10"
              >
                {t.cta}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openRazorpayCheckout(t)}
                disabled={isButtonDisabled(t)}
                className={`mt-8 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
                  isButtonDisabled(t)
                    ? "cursor-not-allowed opacity-70"
                    : t.highlight
                      ? "bg-gradient-brand text-primary-foreground shadow-glow-sm hover:brightness-110"
                      : "border border-border/70 hover:bg-accent/10"
                }`}
              >
                {getButtonText(t)}
              </button>
            )}
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
