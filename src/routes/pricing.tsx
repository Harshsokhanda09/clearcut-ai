import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  productId: "pro" | "credits";
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
    productId: "pro",
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
    productId: "credits",
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
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
  redirect?: boolean;
  retry?: {
    enabled: boolean;
  };
  config?: {
    display: {
      blocks: {
        preferred: {
          name: string;
          instruments: Array<{
            method: "upi";
            flows: Array<"qr" | "intent">;
          }>;
        };
      };
      sequence: string[];
      preferences: {
        show_default_blocks: boolean;
      };
    };
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
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
  keyId: string;
  checkoutToken: string;
}

interface RazorpayVerifyResponse {
  success: boolean;
  message?: string;
  entitlement?: "pro" | "credits";
}

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayLogoPromise: Promise<string> | null = null;

function getRazorpayLogo(): Promise<string> {
  if (razorpayLogoPromise) return razorpayLogoPromise;
  razorpayLogoPromise = new Promise((resolve) => {
    const absoluteLogoUrl = new URL("/LOGO.png", window.location.origin).href;
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(absoluteLogoUrl);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(absoluteLogoUrl);
      }
    };
    image.onerror = () => resolve(absoluteLogoUrl);
    image.src = absoluteLogoUrl;
  });
  return razorpayLogoPromise;
}

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

async function createRazorpayOrder(
  productId: PaidTier["productId"],
): Promise<RazorpayOrderResponse> {
  const response = await fetch("/api/razorpay-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to create payment order");
  }

  return response.json();
}

async function verifyRazorpayPayment(
  payload: RazorpaySuccessResponse,
  checkoutToken: string,
): Promise<RazorpayVerifyResponse> {
  const response = await fetch("/api/razorpay-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, checkoutToken }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Payment verification failed");
  }

  return response.json();
}

function PricingPage() {
  const navigate = useNavigate();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [successTier, setSuccessTier] = useState<string | null>(null);
  const razorpayInstanceRef = useRef<RazorpayInstance | null>(null);
  const paymentInProgressRef = useRef(false);
  const paymentAttemptRef = useRef(0);
  const checkoutWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCheckoutWatchdog = useCallback(() => {
    if (checkoutWatchdogRef.current) {
      clearInterval(checkoutWatchdogRef.current);
      checkoutWatchdogRef.current = null;
    }
  }, []);

  const resetPaymentState = useCallback(() => {
    clearCheckoutWatchdog();
    paymentAttemptRef.current += 1;
    const checkout = razorpayInstanceRef.current;
    razorpayInstanceRef.current = null;
    paymentInProgressRef.current = false;
    setLoadingTier(null);
    try {
      checkout?.close();
    } catch {
      // Checkout may already be closed or may have failed before its iframe loaded.
    }
  }, [clearCheckoutWatchdog]);

  const closeCheckoutAndReset = useCallback(() => {
    clearCheckoutWatchdog();
    paymentAttemptRef.current += 1;
    const checkout = razorpayInstanceRef.current;
    razorpayInstanceRef.current = null;
    paymentInProgressRef.current = false;
    setLoadingTier(null);
    try {
      checkout?.close();
    } catch {
      // Checkout may already be closed.
    }
  }, [clearCheckoutWatchdog]);

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
      closeCheckoutAndReset();
    };

    const handlePageShow = () => {
      closeCheckoutAndReset();
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [closeCheckoutAndReset]);

  // Cleanup Razorpay and state on component unmount
  useEffect(() => {
    return () => {
      clearCheckoutWatchdog();
      paymentAttemptRef.current += 1;
      razorpayInstanceRef.current = null;
      paymentInProgressRef.current = false;
    };
  }, [clearCheckoutWatchdog]);

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

      paymentInProgressRef.current = true;
      const paymentAttempt = ++paymentAttemptRef.current;
      setLoadingTier(tier.name);
      setSuccessTier(null);

      let orderCreated = false;

      try {
        const orderData = await createRazorpayOrder(tier.productId);
        if (paymentAttempt !== paymentAttemptRef.current) return;
        orderCreated = true;
        const checkoutLogo = await getRazorpayLogo();
        if (paymentAttempt !== paymentAttemptRef.current) return;
        const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
        const isTestMode = orderData.keyId.startsWith("rzp_test_");
        // Test Checkout cannot launch or complete a genuine UPI app intent.
        // Keep QR available there (including in device emulation), then switch
        // to installed UPI apps only on real mobile devices with live keys.
        const useMobileUpiIntent = isMobileViewport && !isTestMode;

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
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "ClearCut AI",
          description: tier.name === "Pro" ? "Pro Subscription" : "Credit Pack",
          // A compact data URL remains valid on Razorpay's hosted bank pages;
          // a relative URL resolves against Razorpay and displays as broken.
          image: checkoutLogo,
          order_id: orderData.id,
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          notes: {
            product: tier.productId,
          },
          theme: {
            color: "#06b6d4",
            backdrop_color: "#020617",
          },
          modal: {
            ondismiss: handleDismiss,
            escape: true,
            backdropclose: true,
          },
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              setLoadingTier(tier.name);
              verificationPromise = verifyRazorpayPayment(response, orderData.checkoutToken);
              const result = await verificationPromise;

              if (result.success && result.entitlement === tier.productId) {
                setSuccessTier(tier.name);
                toast.success(
                  tier.name === "Pro"
                    ? "Pro plan activated successfully!"
                    : "Credits added successfully!",
                );
                await navigate({ to: "/dashboard" });
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
          redirect: false,
          retry: {
            enabled: true,
          },
          // Razorpay automatically resolves this UPI entry to Dynamic QR on
          // eligible desktop browsers and installed UPI apps on real phones.
          // Keeping default blocks visible preserves cards, wallets, etc.
          config: {
            display: {
              blocks: {
                preferred: {
                  name: useMobileUpiIntent ? "Pay with UPI Apps" : "UPI QR",
                  instruments: [
                    {
                      method: "upi",
                      flows: [useMobileUpiIntent ? "intent" : "qr"],
                    },
                  ],
                },
              },
              sequence: ["block.preferred"],
              preferences: {
                show_default_blocks: true,
              },
            },
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
          closeCheckoutAndReset();
        });

        razorpayInstanceRef.current = razorpay;
        // Checkout currently reports this particular startup failure only via
        // window.alert, with no Razorpay event. Intercept just the synchronous
        // open call so we can release the UI lock as soon as that alert closes.
        const originalAlert = window.alert;
        let unsupportedBrowserAlert = false;
        window.alert = (message?: unknown) => {
          unsupportedBrowserAlert =
            unsupportedBrowserAlert ||
            (typeof message === "string" &&
              message.toLowerCase().includes("browser is not supported"));
          originalAlert.call(window, message);
        };
        try {
          razorpay.open();
        } finally {
          window.alert = originalAlert;
        }

        if (unsupportedBrowserAlert) {
          toast.error(
            "Razorpay Checkout is blocked in this browser. Enable third-party cookies or try an updated browser.",
          );
          closeCheckoutAndReset();
          return;
        }

        // Razorpay's unsupported-browser path uses a native alert and does not
        // emit payment.failed or modal.ondismiss. Watch the modal container so
        // that path, a failed iframe render, and an unreported close all unlock
        // the button without allowing another order while Checkout is visible.
        const checkoutOpenedAt = Date.now();
        let checkoutWasVisible = false;
        checkoutWatchdogRef.current = setInterval(() => {
          if (paymentAttempt !== paymentAttemptRef.current) {
            clearCheckoutWatchdog();
            return;
          }

          const checkoutIsVisible = Boolean(
            document.querySelector(".razorpay-container, .razorpay-checkout-frame"),
          );
          checkoutWasVisible ||= checkoutIsVisible;

          if (checkoutWasVisible && !checkoutIsVisible) {
            resetPaymentState();
            return;
          }

          if (!checkoutWasVisible && Date.now() - checkoutOpenedAt > 8_000) {
            toast.error(
              "Razorpay Checkout could not open in this browser. Please enable third-party cookies or try an updated browser.",
            );
            closeCheckoutAndReset();
          }
        }, 500);
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
    [clearCheckoutWatchdog, closeCheckoutAndReset, navigate, razorpayLoaded, resetPaymentState],
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
    return paymentInProgressRef.current || loadingTier === tier.name;
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
