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
<img src="https://<worker>.workers.dev/p?c=demo&r=user123&o=abc123"
     width="1" height="1" style="display:none" alt="">

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 56 26 AM" src="https://github.com/user-attachments/assets/51a8df3f-fdee-4342-9616-a8f562c67b12" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 55 42 AM" src="https://github.com/user-attachments/assets/4a41f550-934f-4c15-b6a2-8b5349aa4297" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 55 26 AM" src="https://github.com/user-attachments/assets/43872a89-b881-4b94-8fd1-8868650736ed" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 55 16 AM" src="https://github.com/user-attachments/assets/037d53a5-43e6-48d7-8b17-a7f932126a8d" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 55 03 AM" src="https://github.com/user-attachments/assets/27d85556-9492-4f88-8524-d20fdac036bc" />

<img width="1280" height="800" alt="Screenshot 2025-08-15 at 12 34 12 AM" src="https://github.com/user-attachments/assets/ae932169-ab72-47a4-8d02-7968be526018" />
