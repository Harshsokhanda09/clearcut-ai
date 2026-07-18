import { createFileRoute } from "@tanstack/react-router";

const DEFAULT_WEBHOOK_URL = "https://harshshokeen.app.n8n.cloud/webhook/remove-background";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REQUESTS_PER_MINUTE = 10;
const UPSTREAM_TIMEOUT_MS = 90_000;
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

export const Route = createFileRoute("/api/remove-background")({
  server: {
    handlers: {
      GET: async () => jsonError("Method not allowed. Upload an image with POST.", 405),
      POST: async ({ request }) => {
        const rateLimitResponse = checkRateLimit(request);
        if (rateLimitResponse) return rateLimitResponse;

        const contentType = (request.headers.get("content-type") ?? "")
          .split(";", 1)[0]
          .trim()
          .toLowerCase();

        if (!ACCEPTED_MIME_TYPES.has(contentType)) {
          return jsonError("Only JPG, PNG, and WEBP images are supported.", 415);
        }

        const declaredLength = Number(request.headers.get("content-length") ?? 0);
        if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
          return jsonError("The image must be 10 MB or smaller.", 413);
        }

        let imageBytes: Uint8Array;
        try {
          imageBytes = await readBodyWithLimit(request, MAX_IMAGE_BYTES);
        } catch (error) {
          if (error instanceof BodyTooLargeError) {
            return jsonError("The image must be 10 MB or smaller.", 413);
          }
          return jsonError("The uploaded image could not be read.", 400);
        }

        if (imageBytes.byteLength === 0 || !hasMatchingImageSignature(imageBytes, contentType)) {
          return jsonError("The uploaded file is not a valid supported image.", 400);
        }

        const webhookUrl =
          process.env.N8N_BACKGROUND_REMOVAL_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK_URL;
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim();
        const upstreamHeaders = new Headers({
          Accept: "application/json",
          "Content-Type": contentType,
        });
        if (webhookSecret) {
          upstreamHeaders.set("X-ClearCut-Webhook-Secret", webhookSecret);
        }

        try {
          const upstream = await fetch(webhookUrl, {
            method: "POST",
            headers: upstreamHeaders,
            body: imageBytes.buffer as ArrayBuffer,
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          });

          if (!upstream.ok) {
            console.error(
              `[remove-background] n8n returned ${upstream.status} ${upstream.statusText}`,
            );
            return jsonError("The image processor is temporarily unavailable.", 502);
          }

          const responseText = await upstream.text();
          if (responseText.length > 20_000) {
            return jsonError("The image processor returned an invalid response.", 502);
          }

          let payload: unknown;
          try {
            payload = JSON.parse(responseText);
          } catch {
            return jsonError("The image processor returned an invalid response.", 502);
          }

          const imageUrl = readSafeProcessedImageUrl(payload);
          if (!imageUrl) {
            return jsonError("The image processor did not return a valid image URL.", 502);
          }

          return Response.json({ imageUrl }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          const timedOut =
            error instanceof Error &&
            (error.name === "TimeoutError" || error.name === "AbortError");
          if (!timedOut) console.error("[remove-background] n8n request failed", error);
          return jsonError(
            timedOut
              ? "The image processor took too long to respond. Please try again."
              : "The image processor could not be reached. Please try again.",
            timedOut ? 504 : 502,
          );
        }
      },
    },
  },
});

class BodyTooLargeError extends Error {}

async function readBodyWithLimit(request: Request, maxBytes: number): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function hasMatchingImageSignature(bytes: Uint8Array, contentType: string): boolean {
  if (contentType === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((value, index) => bytes[index] === value);
  }

  if (contentType === "image/jpeg" || contentType === "image/jpg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}

function readSafeProcessedImageUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("imageUrl" in payload)) return null;
  const imageUrl = (payload as { imageUrl?: unknown }).imageUrl;
  if (typeof imageUrl !== "string") return null;

  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    if (parsed.protocol !== "https:") return null;

    const configuredHosts = process.env.PROCESSED_IMAGE_HOSTS?.split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
    const allowedHosts = new Set(
      configuredHosts?.length ? configuredHosts : ["res.cloudinary.com"],
    );
    if (!allowedHosts.has(parsed.hostname.toLowerCase())) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function checkRateLimit(request: Request): Response | null {
  const now = Date.now();
  if (rateBuckets.size > 1_000) {
    for (const [key, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(key);
    }
  }
  const clientId =
    request.headers.get("x-vercel-forwarded-for")?.split(",", 1)[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ||
    "local";
  const current = rateBuckets.get(clientId);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(clientId, { count: 1, resetAt: now + 60_000 });
    return null;
  }

  if (current.count >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  current.count += 1;
  return null;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
