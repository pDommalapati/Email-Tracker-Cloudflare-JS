export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------- helpers ----------
    const sendPixel = async (c, r, o) => {
      const openId = o || crypto.randomUUID();

      if (c && r && env.EMAIL_OPENS) {
        try {
          // increment counter
          const countKey = `count:${c}:${r}`;
          const prev = parseInt((await env.EMAIL_OPENS.get(countKey)) || "0", 10);
          await env.EMAIL_OPENS.put(countKey, String(prev + 1));

          // append lightweight log (30-day TTL)
          const logKey = `open:${c}:${r}:${Date.now()}:${openId}`;
          const ua = request.headers.get("user-agent") || "";
          await env.EMAIL_OPENS.put(
            logKey,
            JSON.stringify({ ts: new Date().toISOString(), c, r, o: openId, ua }),
            { expirationTtl: 60 * 60 * 24 * 30 }
          );
        } catch (_) { /* best effort, never break the pixel */ }
      }

      // 1×1 transparent GIF
      const b64 = "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
      const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
      return new Response(bytes, {
        headers: {
          "content-type": "image/gif",
          "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
          "pragma": "no-cache",
          "expires": "0"
        }
      });
    };

    const unauthorized = () =>
      new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });

    // ---------- routes ----------

    // Query style: /p?c=...&r=...&o=...
    if (url.pathname === "/p") {
      const c = url.searchParams.get("c") || "";
      const r = url.searchParams.get("r") || "";
      const o = url.searchParams.get("o") || "";
      return sendPixel(c, r, o);
    }

    // Pretty style: /p/<campaign>/<recipient>/<openId>.gif   (openId optional)
    if (url.pathname.startsWith("/p/")) {
      const parts = url.pathname.split("/").filter(Boolean); // ["p", c, r, o.gif?]
      const c = decodeURIComponent(parts[1] || "");
      const r = decodeURIComponent(parts[2] || "");
      let o = parts[3] ? decodeURIComponent(parts[3]) : "";
      if (o.endsWith(".gif")) o = o.slice(0, -4);
      return sendPixel(c, r, o);
    }

    // Token-protected JSON stats
    if (url.pathname === "/stats") {
      const token = url.searchParams.get("t") || "";
      if (!env.STATS_TOKEN || token !== env.STATS_TOKEN) return unauthorized();

      const c = url.searchParams.get("c") || "";
      const r = url.searchParams.get("r") || "";
      const details = url.searchParams.get("details") === "1";

      const countKey = `count:${c}:${r}`;
      const count = parseInt((await env.EMAIL_OPENS.get(countKey)) || "0", 10);
      const { keys } = await env.EMAIL_OPENS.list({ prefix: `open:${c}:${r}:`, limit: 20 });

      let opens = [];
      if (details) {
        for (const k of keys) {
          try {
            const raw = await env.EMAIL_OPENS.get(k.name);
            if (raw) opens.push(JSON.parse(raw));
          } catch {}
        }
      }

      return new Response(
        JSON.stringify({ campaign: c, recipient: r, count, recent: keys.map(k => k.name), opens }),
        { headers: { "content-type": "application/json" } }
      );
    }

    // Minimal HTML dashboard + pixel generator (/dashboard or /dashboard/)
    if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
      const token = url.searchParams.get("t") || "";
      if (!env.STATS_TOKEN || token !== env.STATS_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }

      const origin = url.origin;
      const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Email Opens Dashboard</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;max-width:920px}
  h1{font-size:20px;margin:0 0 16px}
  form{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
  input,button,select,textarea{padding:8px 10px;font-size:14px}
  code{background:#f5f5f7;padding:2px 6px;border-radius:4px}
  table{border-collapse:collapse;width:100%;margin-top:12px}
  th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:13px}
  .muted{color:#666}
  .row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
  .box{border:1px solid #e5e7eb;border-radius:6px;padding:10px}
  .label{font-weight:600;margin-bottom:6px}
</style>
</head>
<body>
  <h1>Email Opens Dashboard</h1>

  <!-- Pixel generator -->
  <div class="box">
    <div class="label">Pixel generator</div>
    <div class="row">
      <input id="gc" placeholder="campaign (e.g., demo_gmail)" style="min-width:220px">
      <input id="gr" placeholder="recipient (e.g., me)" style="min-width:160px">
      <input id="go" placeholder="openId (auto)" style="min-width:220px">
      <button id="newId" type="button">New open ID</button>
      <select id="style">
        <option value="pretty">Pretty URL</option>
        <option value="query">Query URL</option>
      </select>
      <button id="copyUrl" type="button">Copy URL</button>
      <button id="copyImg" type="button">Copy &lt;img&gt;</button>
    </div>
    <div class="muted">Tip: use a short slug for recipient (e.g., <code>jane_doe</code>). Open ID should be unique per send.</div>
  </div>

  <form id="f" class="box">
    <div class="label">Fetch stats</div>
    <div class="row">
      <input id="c" placeholder="campaign (e.g., demo_gmail)" required style="min-width:220px">
      <input id="r" placeholder="recipient (e.g., me)" required style="min-width:160px">
      <button type="submit">Fetch</button>
    </div>
  </form>

  <div id="out" class="muted">Enter a campaign and recipient, then click Fetch.</div>

<script>
const token = new URLSearchParams(location.search).get('t') || '';
const origin = ${JSON.stringify(origin)};

// --- pixel generator ---
const el = (id) => document.getElementById(id);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
el('newId').addEventListener('click', () => el('go').value = uuid());

function buildUrls(c, r, o, style) {
  if (style === 'query') {
    const u = new URL('/p', origin);
    u.searchParams.set('c', c); u.searchParams.set('r', r); u.searchParams.set('o', o || uuid());
    return { url: u.toString(), img: '<img src="' + u.toString() + '" width="1" height="1" style="display:none" alt="">' };
  } else {
    const id = o || uuid();
    const u = origin + '/p/' + encodeURIComponent(c) + '/' + encodeURIComponent(r) + '/' + encodeURIComponent(id) + '.gif';
    return { url: u, img: '<img src="' + u + '" width="1" height="1" style="display:none" alt="">' };
  }
}

function copy(text) { return navigator.clipboard.writeText(text).catch(()=>{}); }
el('copyUrl').addEventListener('click', () => {
  const {url} = buildUrls(el('gc').value.trim(), el('gr').value.trim(), el('go').value.trim(), el('style').value);
  copy(url);
});
el('copyImg').addEventListener('click', () => {
  const {img} = buildUrls(el('gc').value.trim(), el('gr').value.trim(), el('go').value.trim(), el('style').value);
  copy(img);
});

// --- stats fetcher ---
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const c = document.getElementById('c').value.trim();
  const r = document.getElementById('r').value.trim();
  const u = new URL('/stats', location.origin);
  u.searchParams.set('c', c);
  u.searchParams.set('r', r);
  u.searchParams.set('t', token);
  u.searchParams.set('details', '1');
  const res = await fetch(u);
  const data = await res.json();
  const out = document.getElementById('out');
  if (res.status !== 200) { out.textContent = 'Error: ' + (data.error || res.status); return; }
  let html = '<div><b>Campaign:</b> ' + data.campaign + ' &nbsp; <b>Recipient:</b> ' + data.recipient + '</div>';
  html += '<div><b>Open count:</b> ' + data.count + '</div>';
  if (data.opens && data.opens.length) {
    html += '<table><thead><tr><th>#</th><th>Timestamp</th><th>Open ID</th><th>User-Agent</th></tr></thead><tbody>';
    data.opens.sort((a,b)=>a.ts<b.ts?1:-1).forEach((o,i)=>{
      html += '<tr><td>'+(i+1)+'</td><td>'+o.ts+'</td><td><code>'+o.o+'</code></td><td class="muted">'+(o.ua||'')+'</td></tr>';
    });
    html += '</tbody></table>';
  } else {
    html += '<div class="muted">No recent opens.</div>';
  }
  out.innerHTML = html;
});
</script>
</body>
</html>`;
      return new Response(html, { headers: { "content-type": "text/html; charset=UTF-8" } });
    }

    // Fallback
    return new Response("OK");
  }
}
