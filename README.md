# ClearCut AI

ClearCut AI is a TanStack Start application for removing image backgrounds. The browser sends an
image to the same-origin `/api/remove-background` endpoint, which validates it and forwards it to
the configured n8n workflow. Recent results are stored in the browser's IndexedDB for up to seven
days.

## Run locally

Requirements: Node.js 22 and npm 10.

```bash
npm ci
npm run dev
```

Open `http://localhost:8080`. Before deploying, run the complete check:

```bash
npm run check
```

To test the Vercel-shaped production build locally:

```bash
npm run build
npm run preview
```

## Vercel

The Nitro Vercel preset emits the Build Output API structure in `.vercel/output`; it does not emit a
normal Vite `dist` directory. `vercel.json` pins the install and build commands for reproducible
deployments.

In Vercel project settings:

1. Leave **Output Directory** unset. In particular, do not set it to `dist`.
2. Use Node.js 22.
3. Add the server-only variables from `.env.example` if overriding the defaults.
4. Redeploy after pushing the repository changes.

## n8n workflow contract

The production webhook must:

1. Accept `POST` with a raw `image/jpeg`, `image/png`, or `image/webp` body.
2. Remove the background and upload the resulting PNG to an HTTPS URL.
3. Return HTTP 200 and exactly this JSON shape:

```json
{ "imageUrl": "https://res.cloudinary.com/.../result.png" }
```

4. Return the response with `Content-Type: application/json`.
5. If `N8N_WEBHOOK_SECRET` is configured, reject requests whose
   `X-ClearCut-Webhook-Secret` header does not match.

The application server enforces a 10 MB limit, verifies PNG/JPEG/WEBP signatures, times out slow
workflow calls, accepts only HTTPS result URLs, and defaults to allowing `res.cloudinary.com`.

For production abuse protection, also configure an n8n rate limit or Vercel Firewall rule. The
in-application per-IP limiter is best-effort because serverless instances do not share memory.

## Supabase

Authentication is not exposed in the current beta UI. The migrations remain for future account and
billing work. Apply all pending migrations before re-enabling those features; the latest migration
makes profile counters, credit ledger entries, and processing outcomes server-authoritative.
