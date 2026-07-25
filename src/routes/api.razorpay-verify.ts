import { createFileRoute } from "@tanstack/react-router";
import {
  createEntitlementCookie,
  PRODUCTS,
  razorpayAuthorization,
  readCheckoutToken,
  verifyPaymentSignature,
} from "@/lib/razorpay.server";

function jsonError(message: string, status: number): Response {
  return Response.json(
    { success: false, error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

interface VerifyRequestBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  checkoutToken?: string;
}

export const Route = createFileRoute("/api/razorpay-verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: VerifyRequestBody;

        try {
          body = (await request.json()) as VerifyRequestBody;
        } catch {
          return jsonError("Invalid request body", 400);
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, checkoutToken } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !checkoutToken) {
          return jsonError(
            "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
            400,
          );
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const keyId = process.env.RAZORPAY_KEY_ID;

        if (!keySecret || !keyId) {
          console.error("[razorpay-verify] RAZORPAY_KEY_SECRET not configured");
          return jsonError("Server misconfiguration", 500);
        }

        const checkout = readCheckoutToken(checkoutToken, keySecret);
        if (!checkout || checkout.orderId !== razorpay_order_id) {
          return jsonError("Invalid or expired checkout", 400);
        }

        try {
          if (
            !verifyPaymentSignature(
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              keySecret,
            )
          ) {
            console.error("[razorpay-verify] Signature mismatch for payment:", razorpay_payment_id);
            return jsonError("Invalid payment signature", 400);
          }

          const authorization = razorpayAuthorization(keyId, keySecret);
          const [paymentResponse, orderResponse] = await Promise.all([
            fetch(
              `https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpay_payment_id)}`,
              {
                headers: { Authorization: authorization },
                signal: AbortSignal.timeout(15_000),
              },
            ),
            fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`, {
              headers: { Authorization: authorization },
              signal: AbortSignal.timeout(15_000),
            }),
          ]);
          if (!paymentResponse.ok || !orderResponse.ok) {
            return jsonError("Could not confirm payment with Razorpay", 502);
          }

          const payment = (await paymentResponse.json()) as {
            id: string;
            order_id: string;
            amount: number;
            currency: string;
            status: string;
          };
          const order = (await orderResponse.json()) as {
            id: string;
            amount: number;
            amount_paid: number;
            currency: string;
            status: string;
          };
          const product = PRODUCTS[checkout.productId];
          if (
            payment.id !== razorpay_payment_id ||
            payment.order_id !== checkout.orderId ||
            payment.amount !== product.amount ||
            payment.currency !== product.currency ||
            !["authorized", "captured"].includes(payment.status) ||
            order.id !== checkout.orderId ||
            order.amount !== product.amount ||
            order.amount_paid < product.amount ||
            order.currency !== product.currency ||
            order.status !== "paid"
          ) {
            return jsonError("Payment is not complete or does not match this product", 400);
          }

          const secure = new URL(request.url).protocol === "https:";
          return Response.json(
            {
              success: true,
              message: "Payment verified successfully",
              entitlement: product.entitlement,
            },
            {
              headers: {
                "Cache-Control": "no-store",
                "Set-Cookie": createEntitlementCookie(
                  checkout.productId,
                  razorpay_payment_id,
                  keySecret,
                  secure,
                ),
              },
            },
          );
        } catch (error) {
          console.error("[razorpay-verify] Verification error:", error);
          return jsonError("Payment verification could not be completed", 500);
        }
      },
    },
  },
});
