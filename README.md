# Growth Engineering Portfolio

Three pieces of a live creator-affiliate program I built and run for a direct-to-consumer brand on Shopify: the program itself, the edge worker that powers its attribution, and the automation pipeline that reports on it.

Everything here is anonymized. No client name, no partner names, no payout identities. The numbers are read from the live dashboard in October 2026, and the program is still active and compounding.

## Contents
1. **Creator Affiliate Program** (this page) — how it is built and what it has returned
2. [Edge Attribution Worker](./edge-attribution-worker) — the Cloudflare Worker that tracks clicks and attributes orders at the edge
3. [Affiliate Ops Pipeline](./affiliate-ops-pipeline) — the n8n automation that reports ROI and CPA and flags payout risk every day

---

## Creator Affiliate Program

### What it is
A creator and affiliate program built from zero for a DTC brand on Shopify. I own the whole thing: the program design, the tiered structure, the sign-up and onboarding flows, the lifecycle email, the payout operation, and the attribution and reporting that tells us what actually worked.

### The stack
| Layer | Tool | What it does for the program |
|---|---|---|
| Store and checkout | Shopify | the storefront the program drives orders to; a checkout Thank-You widget recruits new customers into the program at the moment they buy |
| Affiliate platform | Social Snowball | programs, tiers, auto and manual sign-up flows, automatically generated per-partner links and discount codes, lifecycle and transactional email |
| Payouts | Tremendous | cash, store-credit and discount payouts to partners, with ready / pending / paid states and a fraud-risk check before anything goes out |
| Measurement | GA4, Search Console, and custom attribution | per-partner click and order attribution, and the ROI, CPA and AOV reporting I wrote myself |

### What I built
- **Four tiered programs** so partners are segmented by performance instead of treated the same: a Default program, Tier 2 and Tier 3 Creator Rewards, and a VIP tier. Higher tiers carry richer rewards and pull the strongest creators up a ladder.
- **Recruitment surfaces**: an auto-approval sign-up page and a manual-approval form, plus a Shopify checkout Thank-You widget that converts buyers into partners when they are most engaged. The sign-up page alone has taken 175 submissions on 1,017 impressions.
- **Lifecycle email**: post-purchase recruitment, sign-up confirmation, and timed follow-ups, every one measured. Transactional email on top: referral-sale notifications (1,010 sent), payout notifications, and login nudges for partners sitting on unpaid commission.
- **Attribution and reporting**: per-partner links and codes generated automatically, first-party click and order tracking, and the ROI / CPA / AOV reporting that drives every decision. This is the part I wrote myself, and the part that carries into any growth role.
- **Payout operation**: batched payouts through Tremendous with a fraud-risk filter, run against real partner balances.

### Results (live dashboard, October 2026)
| Metric | Value |
|---|---|
| Tracked revenue | $43,685.29 |
| Attributed orders | 1,046 |
| Active partners | 262 |
| Average order value | $41.76 lifetime, $43.60 last 30 days |
| Return on investment | 6.75x (trailing 30 days) |
| Cost per acquisition | $6.46 (trailing 30 days) |
| Unique link clicks | 749 (trailing 30 days) |
| Paid out to partners | $5,856.32 via Tremendous |
| Top partner | 229 referrals, $9,814 in revenue |

Where the value concentrates shows why tiering matters: the Tier 2 program carries about $20,360 across 129 partners, while the Tier 3 program carries about $16,667 across just 10 high-value creators. Same program, very different partner economics, managed separately on purpose.

### What carries over
For a growth or lifecycle role the headcount is not the transferable part. The transferable part is the instrumentation: segmenting an audience by behavior, building the lifecycle automation that moves them, wiring attribution so every dollar traces to a source, and reporting ROI and CPA against a baseline instead of a vanity number. That is the same motion whether the unit is an affiliate, a free user converting to a paid team seat, or a trial converting to a subscription.

---

Built and maintained by Colin Bustos · Manila, UTC+8 · colinbustos276@gmail.com
