import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function jsonError(message: string, status: number): Response {
  return Response.json(
    { success: false, error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function jsonSuccess(message?: string): Response {
  return Response.json(
    { success: true, message },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// In-memory dedup store. Replace with DB (e.g. processed_payments table) in production.
// Using a module-level Set so it persists across requests on the same server instance.
const processedPaymentIds = new Set<string>();

interface VerifyRequestBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
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

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
          body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return jsonError(
            "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
            400
          );
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keySecret) {
          console.error("[razorpay-verify] RAZORPAY_KEY_SECRET not configured");
          return jsonError("Server misconfiguration", 500);
        }

        // Prevent duplicate processing (idempotency)
        if (processedPaymentIds.has(razorpay_payment_id)) {
          console.warn(
            "[razorpay-verify] Duplicate payment verification attempt:",
            razorpay_payment_id
          );
          return jsonSuccess("Payment already processed");
        }

        try {
          // Compute HMAC SHA256 signature using Razorpay's algorithm
          const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
          const expectedSignature = createHmac("sha256", keySecret)
            .update(payload, "utf8")
            .digest("hex");

          const receivedSigBuf = Buffer.from(razorpay_signature, "utf8");
          const expectedSigBuf = Buffer.from(expectedSignature, "utf8");

          // Use constant-time comparison to prevent timing attacks
          if (
            receivedSigBuf.length !== expectedSigBuf.length ||
            !timingSafeEqual(receivedSigBuf, expectedSigBuf)
          ) {
            console.error(
              "[razorpay-verify] Signature mismatch for payment:",
              razorpay_payment_id
            );
            return jsonError("Invalid payment signature", 400);
          }

          // Mark as processed BEFORE any user-visible side effects to avoid
          // duplicate charges even if downstream subscription update fails.
          processedPaymentIds.add(razorpay_payment_id);

          // -----------------------------------------------------------------
          // TODO: Integrate with your actual auth + DB here.
          //
          // Steps for production:
          //  1. Fetch authenticated user from session/cookie/token
          //  2. Look up the order in your DB by razorpay_order_id to confirm
          //     the amount & plan match this user
          //  3. Apply plan/credits to the user's subscription record
          //  4. Persist the transaction to your payments table with status
          // -----------------------------------------------------------------
          //
          // Placeholder log so operators can see success on the server:
          console.log(
            "[razorpay-verify] Payment verified successfully:",
            {
              razorpay_payment_id,
              razorpay_order_id,
            }
          );

          return jsonSuccess("Payment verified successfully");
        } catch (error) {
          console.error("[razorpay-verify] Verification error:", error);
          // Rollback dedup entry only if we failed AFTER the signature check
          // but BEFORE completing the subscription update. If we never reached
          // the `add()` line above, this is a no-op.
          processedPaymentIds.delete(razorpay_payment_id);
          return jsonError(
            error instanceof Error ? error.message : "Verification failed",
            500
          );
        }
      },
    },
  },
});
