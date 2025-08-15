# Email-Tracker-Cloudflare-JS
# Zero-Cost Email Open Tracker (Cloudflare Workers + KV)

Track opens with a 1×1 pixel, store counts in KV, and view results in a token-protected dashboard.
Built for **$0** within free tiers.


## Features
- 🔹 1×1 transparent GIF pixel
- 🔹 Two URL styles
  - Query: `/p?c=<campaign>&r=<recipient>&o=<openId>`
  - Pretty: `/p/<campaign>/<recipient>/<openId>.gif`
- 🔹 KV storage:
  - `count:<campaign>:<recipient>` → integer
  - `open:<campaign>:<recipient>:<ts>:<openId>` → JSON (30-day TTL)
- 🔹 `/stats?c=...&r=...&t=<token>[&details=1]` (JSON)
- 🔹 `/dashboard?t=<token>` HTML UI + **pixel generator**
- 🔹 Hard no-cache headers on the pixel

## Quick start (Dashboard deploy)
1. **Create a Worker** in Cloudflare.
2. **Create KV namespace** `EMAIL_OPENS`.
3. **Bind KV** to the Worker: `EMAIL_OPENS`.
4. **Add variable** `STATS_TOKEN` (random string).
5. Paste `worker.js` → **Deploy**.
6. Visit: `https://<your-worker>.workers.dev/dashboard?t=<STATS_TOKEN>`.

## Usage

### Pixel `<img>` (query style)
```html
