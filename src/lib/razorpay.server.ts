import { createHmac, timingSafeEqual } from "node:crypto";

export const PRODUCTS = {
  pro: {
    amount: 49_900,
    currency: "INR",
    description: "Pro Subscription",
    entitlement: "pro",
  },
  credits: {
    amount: 99_900,
    currency: "INR",
    description: "Credit Pack",
    entitlement: "credits",
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;

export interface CheckoutTokenPayload {
  orderId: string;
  productId: ProductId;
  amount: number;
  currency: string;
  expiresAt: number;
}

interface EntitlementTokenPayload {
  version: 1;
  productId: ProductId;
  paymentId: string;
  expiresAt: number;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCheckoutToken(payload: CheckoutTokenPayload, secret: string): string {
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function readCheckoutToken(token: string, secret: string): CheckoutTokenPayload | null {
  const [encodedPayload, receivedSignature, extra] = token.split(".");
  if (!encodedPayload || !receivedSignature || extra) return null;
  if (!safeEqual(receivedSignature, sign(encodedPayload, secret))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as CheckoutTokenPayload;
    const product = PRODUCTS[payload.productId];
    if (
      !product ||
      payload.expiresAt < Date.now() ||
      payload.amount !== product.amount ||
      payload.currency !== product.currency ||
      !payload.orderId.startsWith("order_")
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function razorpayAuthorization(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`, "utf8").toString("base64")}`;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  receivedSignature: string,
  keySecret: string,
): boolean {
  const expected = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`, "utf8")
    .digest("hex");
  return safeEqual(receivedSignature, expected);
}

export function createEntitlementCookie(
  productId: ProductId,
  paymentId: string,
  secret: string,
  secure: boolean,
): string {
  const maxAge = productId === "pro" ? 30 * 24 * 60 * 60 : 365 * 24 * 60 * 60;
  const expiresAt = Date.now() + maxAge * 1000;
  const encodedPayload = encode(
    JSON.stringify({
      version: 1,
      productId,
      paymentId,
      expiresAt,
    } satisfies EntitlementTokenPayload),
  );
  const value = `${encodedPayload}.${sign(encodedPayload, secret)}`;
  return [
    `clearcut_${productId}_entitlement=${value}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function readEntitlementCookie(
  cookieHeader: string | null,
  secret: string,
): EntitlementTokenPayload | null {
  if (!cookieHeader) return null;
  for (const productId of Object.keys(PRODUCTS) as ProductId[]) {
    const name = `clearcut_${productId}_entitlement=`;
    const value = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(name))
      ?.slice(name.length);
    if (!value) continue;
    const [encodedPayload, receivedSignature, extra] = value.split(".");
    if (!encodedPayload || !receivedSignature || extra) continue;
    if (!safeEqual(receivedSignature, sign(encodedPayload, secret))) continue;
    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf8"),
      ) as EntitlementTokenPayload;
      if (
        payload.version === 1 &&
        payload.productId === productId &&
        payload.paymentId.startsWith("pay_") &&
        Number.isFinite(payload.expiresAt) &&
        payload.expiresAt > Date.now()
      ) {
        return payload;
      }
    } catch {
      // Ignore malformed cookies and continue checking other entitlements.
    }
  }
  return null;
}
