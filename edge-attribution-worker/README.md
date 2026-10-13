# Edge Attribution Worker

The Cloudflare Worker behind the creator-affiliate program's tracking. It sits on the edge, turns every partner link into a first-party, measured click, and attributes the resulting Shopify order back to the partner who earned it. No third-party pixel, no analytics tag that an ad blocker strips out.

## Why it exists
Affiliate platforms attribute on their own terms. I wanted attribution I controlled and could reconcile myself, so the ROI and CPA numbers in the program are mine, not a vendor's black box. Running it at the edge means the redirect is fast from anywhere (the partners and their audiences are global), and the attribution cookie is first-party, so it survives where third-party tracking does not.

## How it works
1. A partner shares a link like `https://go.example.com/r/CREATOR42?to=/products/best-seller`.
2. `GET /r/:code` logs the click to KV, drops a first-party `aff_ref` cookie carrying a visitor id and the partner code, and 302-redirects to the store with `utm_campaign=CREATOR42`.
3. When that visitor checks out, the storefront forwards the cookie into the Shopify order as a note attribute.
4. Shopify fires its `orders/create` webhook at `POST /postback`. The Worker verifies the HMAC signature, reads the code off the order, and rolls the order and its revenue into a per-day, per-code total in KV.
5. The [ops pipeline](../affiliate-ops-pipeline) reads those rollups each morning and reports ROI, CPA and top movers.

## Routes
| Method | Path | Purpose |
|---|---|---|
| GET | `/r/:code` | redirect a partner link, log the click, set the attribution cookie |
| POST | `/postback` | Shopify `orders/create` webhook, HMAC-verified, attributes the order |
| GET | `/health` | liveness check |

## Design notes
- **Non-blocking writes.** The click is recorded with `ctx.waitUntil(...)` so the redirect returns immediately; tracking never slows the partner's link.
- **Signed webhooks.** `/postback` verifies the Shopify HMAC with a constant-time compare before trusting a single byte.
- **Bounded storage.** Click and visitor keys carry TTLs (a 30-day attribution window for visitors, longer for the daily rollups), so KV stays small and self-cleaning.
- **Secrets stay out of the repo.** `SHOPIFY_WEBHOOK_SECRET` is set with `wrangler secret put`, never committed.

## Run it
```bash
npm i -g wrangler
wrangler kv namespace create ATTRIBUTION      # paste the id into wrangler.toml
wrangler secret put SHOPIFY_WEBHOOK_SECRET
wrangler deploy
```

Files: [`src/index.js`](./src/index.js) · [`wrangler.toml`](./wrangler.toml)
