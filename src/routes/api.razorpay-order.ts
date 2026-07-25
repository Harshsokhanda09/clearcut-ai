import { createFileRoute } from "@tanstack/react-router";
import {
  createCheckoutToken,
  PRODUCTS,
  razorpayAuthorization,
  type ProductId,
} from "@/lib/razorpay.server";

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export const Route = createFileRoute("/api/razorpay-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { productId?: string };
          const productId = body.productId as ProductId;
          const product = PRODUCTS[productId];

          if (!product) {
            return jsonError("Unknown product", 400);
          }

          const keySecret = process.env.RAZORPAY_KEY_SECRET;
          const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID;

          if (!keyId || !keySecret) {
            console.error("[razorpay-order] Missing Razorpay credentials");
            return jsonError("Razorpay credentials not configured", 500);
          }

          const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: razorpayAuthorization(keyId, keySecret),
            },
            body: JSON.stringify({
              amount: product.amount,
              currency: product.currency,
              receipt: `${productId}_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
              notes: { productId },
            }),
          });

          if (!razorpayResponse.ok) {
            const errorText = await razorpayResponse.text();
            console.error("[razorpay-order] Razorpay API error:", errorText);
            return jsonError("Failed to create Razorpay order", 500);
          }

          const orderData = (await razorpayResponse.json()) as {
            id: string;
            amount: number;
            currency: string;
          };
          const checkoutToken = createCheckoutToken(
            {
              orderId: orderData.id,
              productId,
              amount: product.amount,
              currency: product.currency,
              expiresAt: Date.now() + 30 * 60 * 1000,
            },
            keySecret,
          );

          return Response.json(
            {
              id: orderData.id,
              amount: orderData.amount,
              currency: orderData.currency,
              keyId,
              checkoutToken,
            },
            {
              headers: { "Cache-Control": "no-store" },
            },
          );
        } catch (error) {
          console.error("[razorpay-order] Error creating order:", error);
          return jsonError("Failed to create order", 500);
        }
      },
    },
  },
});
