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

Images:
<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 56 26 AM" src="https://github.com/user-attachments/assets/32b36622-15f5-4a41-9d6f-f17373bdf107" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 55 03 AM" src="https://github.com/user-attachments/assets/2c4ee7ba-7bdb-4ba3-a36b-1e42052cdd08" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 55 42 AM" src="https://github.com/user-attachments/assets/9c781515-dd7c-4ee0-b1e4-a231b08fc0d1" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 55 26 AM" src="https://github.com/user-attachments/assets/6f43f778-f285-4e22-94f9-d5235d470bfd" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 55 16 AM" src="https://github.com/user-attachments/assets/f6e52099-fa7f-4b16-993f-031ae875de78" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 34 12 AM" src="https://github.com/user-attachments/assets/80ecce0d-a2aa-438a-8fe7-d53b733548ba" />
