import { createFileRoute } from "@tanstack/react-router";

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export const Route = createFileRoute("/api/razorpay-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { amount } = await request.json();

          const keySecret = process.env.RAZORPAY_KEY_SECRET;
          const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID;

          if (!keyId || !keySecret) {
            console.error("[razorpay-order] Missing Razorpay credentials");
            return jsonError("Razorpay credentials not configured", 500);
          }

          console.log("[razorpay-order] Creating Razorpay order with amount:", amount);

          // Call Razorpay's Orders API
          const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
            },
            body: JSON.stringify({
              amount: amount,
              currency: "INR",
              receipt: `receipt_${Date.now()}`,
            }),
          });

          if (!razorpayResponse.ok) {
            const errorText = await razorpayResponse.text();
            console.error("[razorpay-order] Razorpay API error:", errorText);
            return jsonError("Failed to create Razorpay order", 500);
          }

          const orderData = await razorpayResponse.json();
          console.log("[razorpay-order] Razorpay order created successfully:", orderData.id);

          return Response.json(orderData, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch (error) {
          console.error("[razorpay-order] Error creating order:", error);
          return jsonError("Failed to create order", 500);
        }
      },
    },
  },
});
