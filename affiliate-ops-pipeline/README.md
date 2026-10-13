# Affiliate Ops Pipeline

The automation that keeps the creator-affiliate program honest. Every morning it pulls the program's numbers, computes the metrics that actually drive decisions, writes a dated snapshot, posts a digest to Slack, and flags any payout that looks risky before it goes out in the batch.

It is an n8n workflow. Import [`workflow.json`](./workflow.json) into any n8n instance to read the whole thing node by node.

## Why it exists
A program with 262 partners and a daily payout queue is too much to eyeball. The numbers that matter (ROI, CPA, AOV, conversion rate, where the growth is coming from) are spread across the affiliate platform, the store, and the payout tool. This pipeline pulls them into one place on a schedule so the first thing I see each morning is a straight read of how the program did yesterday and whether anything needs a human before money moves.

## What it does, node by node
1. **Every day 07:30 ET** — a schedule trigger. Runs before the US morning so the digest is waiting.
2. **Pull program stats** — an authenticated HTTP request for the last day's revenue, orders, clicks, commissions, new partners, top partners, and the ready-payout queue.
3. **Compute ROI, CPA, flags** — a code node that turns raw figures into ROI, CPA, AOV and conversion rate, picks the top three partners, and flags any ready payout that the provider marked as fraud risk or that spikes to more than three times the partner's trailing average.
4. **Append daily snapshot** — writes the day's row to a Google Sheet so there is a running history to chart and reconcile against the dashboard.
5. **Post daily digest** — drops the numbers into a Slack channel in one readable line.
6. **Any risky payouts?** — an IF gate. If nothing is flagged, the run ends quietly.
7. **Flag payouts for review** — if something is flagged, it posts a warning so those payouts are held out of the batch until a human clears them.

## Design notes
- **Read, decide, then notify.** The compute step does the thinking; the Slack and Sheets steps just carry the result. Logic lives in one node, so it is easy to change the ROI or fraud thresholds without touching the wiring.
- **Fan-out after compute.** The snapshot, the digest and the risk check run off the same computed payload, so they never disagree with each other.
- **Fail safe on money.** The only branch that can touch the payout batch is the risk flag, and it only ever holds payouts back, never releases them.
- **Credentials and ids are placeholders.** The sheet id, Slack channel and API host here are stand-ins; the real ones live in n8n credentials, not in the exported JSON.

Import it: n8n → Workflows → Import from File → [`workflow.json`](./workflow.json).
