import { createFileRoute } from "@tanstack/react-router";
import { readEntitlementCookie } from "@/lib/razorpay.server";

export const Route = createFileRoute("/api/entitlement")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
          return Response.json(
            { active: false, error: "Server misconfiguration" },
            { status: 500, headers: { "Cache-Control": "no-store" } },
          );
        }
        const entitlement = readEntitlementCookie(request.headers.get("cookie"), secret);
        return Response.json(
          entitlement
            ? {
                active: true,
                productId: entitlement.productId,
                expiresAt: entitlement.expiresAt,
              }
            : { active: false },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
