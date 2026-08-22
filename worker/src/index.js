/**
 * Like counter for kaiqianzhang.github.io.
 *
 *   GET  /<slug>   -> { "count": 12 }
 *   POST /<slug>   body { "delta": 1 } or { "delta": -1 }  -> { "count": 13 }
 *
 * Stores one integer per post in Workers KV under "likes:<slug>". No cookies,
 * no IP logging, no per-reader state of any kind — the only thing that leaves
 * the browser is which post was liked. Who has liked what is tracked in the
 * reader's own localStorage and never sent here.
 *
 * KV is eventually consistent and has no atomic increment, so two clicks
 * landing in the same instant can cost one count. For a blog that is a fair
 * trade against the complexity of Durable Objects.
 */

const ALLOWED_ORIGINS = [
  'https://kaiqianzhang.github.io',
  'http://127.0.0.1:8000',
  'http://localhost:8000',
];

const SLUG = /^[a-z0-9][a-z0-9\-\/]{0,127}$/;

function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
  };
}

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get('Origin') || '';
    const origin = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

    if (request.method === 'OPTIONS') {
      // A 204 must not carry a body. Building one with a body throws in the
      // Workers runtime, which surfaces as a 500 -- and a 500 on the
      // preflight silently blocks every POST behind it, so likes are fetched
      // fine and never recorded.
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const slug = new URL(request.url).pathname.replace(/^\/+|\/+$/g, '');
    if (!SLUG.test(slug)) {
      return reply({ error: 'bad slug' }, 400, origin);
    }

    const key = `likes:${slug}`;
    const current = parseInt((await env.LIKES.get(key)) || '0', 10) || 0;

    if (request.method === 'GET') {
      return reply({ count: current }, 200, origin);
    }

    if (request.method === 'POST') {
      let delta = 1;
      try {
        const body = await request.json();
        delta = body && body.delta === -1 ? -1 : 1;
      } catch (e) {
        // an empty body means a plain like
      }
      const next = Math.max(0, current + delta);
      await env.LIKES.put(key, String(next));
      return reply({ count: next }, 200, origin);
    }

    return reply({ error: 'method not allowed' }, 405, origin);
  },
};
