/**
 * Edge Attribution Worker
 *
 * Tracks affiliate link clicks and attributes Shopify orders back to the
 * partner who drove them, at the edge, first-party, with no third-party pixel.
 * This is what feeds the ROI / CPA reporting in the creator-affiliate program.
 *
 * Routes:
 *   GET  /r/:code    redirect a partner link, log the click, drop a first-party attribution cookie
 *   POST /postback   Shopify "orders/create" webhook, attribute the order to a code
 *   GET  /health     liveness check
 *
 * Storage: one Workers KV namespace (binding ATTRIBUTION) holds per-day click
 * and order rollups per code, plus a short-lived visitor -> code map so an order
 * webhook arriving later can still resolve attribution.
 */

const COOKIE = 'aff_ref';
const ATTRIB_WINDOW_DAYS = 30;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (request.method === 'GET' && url.pathname.startsWith('/r/')) {
        return handleRedirect(url, request, env, ctx);
      }
      if (request.method === 'POST' && url.pathname === '/postback') {
        return handlePostback(request, env);
      }
      if (url.pathname === '/health') {
        return json({ ok: true });
      }
      return new Response('Not found', { status: 404 });
    } catch (err) {
      return json({ ok: false, error: String(err) }, 500);
    }
  },
};

async function handleRedirect(url, request, env, ctx) {
  const code = url.pathname.slice('/r/'.length).split('/')[0].trim();
  if (!code) return new Response('Missing code', { status: 400 });

  // Reuse the visitor id from the cookie if present, otherwise mint one.
  const existing = readCookie(request, COOKIE);
  const visitor = (existing && existing.split('.')[0]) || crypto.randomUUID();

  // Record the click in the background so it never blocks the redirect.
  ctx.waitUntil(recordClick(env, code, visitor));

  // Destination: the store origin, an optional product path, and attribution UTMs.
  const dest = new URL(env.STORE_ORIGIN);
  const to = url.searchParams.get('to');
  if (to && to.startsWith('/')) dest.pathname = to;
  dest.searchParams.set('utm_source', 'affiliate');
  dest.searchParams.set('utm_medium', 'referral');
  dest.searchParams.set('utm_campaign', code);

  const maxAge = ATTRIB_WINDOW_DAYS * 24 * 60 * 60;
  return new Response(null, {
    status: 302,
    headers: {
      Location: dest.toString(),
      'Set-Cookie': `${COOKIE}=${visitor}.${code}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`,
      'Cache-Control': 'no-store',
    },
  });
}

async function recordClick(env, code, visitor) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `clicks:${code}:${day}`;
  const current = parseInt((await env.ATTRIBUTION.get(key)) || '0', 10);
  await env.ATTRIBUTION.put(key, String(current + 1), { expirationTtl: 120 * 24 * 60 * 60 });
  // Map visitor -> code so a later order can be attributed inside the window.
  await env.ATTRIBUTION.put(`visitor:${visitor}`, code, {
    expirationTtl: ATTRIB_WINDOW_DAYS * 24 * 60 * 60,
  });
}

async function handlePostback(request, env) {
  const raw = await request.text();
  const valid = await verifyShopifyHmac(raw, request.headers.get('X-Shopify-Hmac-Sha256'), env.SHOPIFY_WEBHOOK_SECRET);
  if (!valid) return json({ ok: false, error: 'bad signature' }, 401);

  const order = JSON.parse(raw);
  // The storefront forwards the attribution cookie into an order note attribute.
  const noteAttrs = order.note_attributes || [];
  const ref = (noteAttrs.find((n) => n.name === COOKIE) || {}).value || '';
  const code = ref.split('.')[1];
  if (!code) return json({ ok: true, attributed: false });

  const day = new Date().toISOString().slice(0, 10);
  const key = `orders:${code}:${day}`;
  const prev = JSON.parse((await env.ATTRIBUTION.get(key)) || '{"orders":0,"revenue":0}');
  prev.orders += 1;
  prev.revenue += Number(order.total_price || 0);
  await env.ATTRIBUTION.put(key, JSON.stringify(prev), { expirationTtl: 400 * 24 * 60 * 60 });

  return json({ ok: true, attributed: true, code });
}

async function verifyShopifyHmac(raw, header, secret) {
  if (!header || !secret) return false;
  const key = await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc(raw));
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return timingSafeEqual(digest, header);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

const enc = (s) => new TextEncoder().encode(s);
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
