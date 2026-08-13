# Like counter

A ~60-line Cloudflare Worker holding one integer per post in Workers KV. The
blog works fine without it — the like button falls back to remembering a
reader's own tap in their browser and simply shows no number.

## Deploy

```sh
cd worker
npx wrangler login                       # opens a browser, once
npx wrangler kv namespace create LIKES   # prints an id
```

Paste the printed id into `wrangler.toml`, then:

```sh
npx wrangler deploy
```

Wrangler prints a URL like `https://blog-likes.<subdomain>.workers.dev`. Put it
in the repo root's `site.json`:

```json
"likes_endpoint": "https://blog-likes.<subdomain>.workers.dev"
```

Then `python3 build.py` and push. Leave `likes_endpoint` as `""` to switch the
counter off everywhere.

## Check it

```sh
curl https://blog-likes.<subdomain>.workers.dev/rope
curl -X POST https://blog-likes.<subdomain>.workers.dev/rope \
     -H 'Content-Type: application/json' -d '{"delta":1}'
```

## Cost and limits

Cloudflare's free tier allows 100,000 KV reads and 1,000 writes per day. Reads
happen on every page view of a post, writes only when someone clicks, so the
write limit is the one with headroom to spare. Nothing here can cost money on
the free plan; it stops serving rather than billing.

## What it stores

One integer per slug, under `likes:<slug>`. No cookies, no IP addresses, no
per-reader records. Which posts *you* liked lives in your own browser's
localStorage and is never sent. `ALLOWED_ORIGINS` in `src/index.js` restricts
who may call it.

KV has no atomic increment, so two clicks in the same instant can cost one
count. That is the accepted trade for not running Durable Objects.
