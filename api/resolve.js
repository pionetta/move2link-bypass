// Fungsi serverless Vercel: POST /api/resolve { "url": "https://move2link.co/xxxx" }
// Memanggil API Zapi dengan API key dari environment variable ZAPI_KEY.
// Key TIDAK PERNAH ada di source code / repo — atur di Vercel:
// Project Settings -> Environment Variables -> ZAPI_KEY.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Pakai POST.' });
    return;
  }

  const key = process.env.ZAPI_KEY;
  if (!key) {
    res.status(500).json({ error: 'ZAPI_KEY belum diatur di Environment Variables Vercel.' });
    return;
  }

  let url = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    url = String(body.url || '').trim();
  } catch (_) {
    res.status(400).json({ error: 'Body bukan JSON yang valid.' });
    return;
  }
  if (!url) {
    res.status(400).json({ error: 'Parameter url kosong.' });
    return;
  }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  let parsed;
  try { parsed = new URL(url); } catch (_) {
    res.status(400).json({ error: 'URL tidak valid.' });
    return;
  }
  if (!/(^|\.)move2link\.(co|com)$/i.test(parsed.hostname)) {
    res.status(400).json({ error: 'Hanya link move2link.co / move2link.com yang didukung.' });
    return;
  }

  const apiUrl = 'https://api.zapi.ink/v1/move2link/resolve?url=' + encodeURIComponent(url);
  let upstream;
  try {
    upstream = await fetch(apiUrl, { headers: { 'x-api-key': key } });
  } catch (_) {
    res.status(502).json({ error: 'Gagal menghubungi api.zapi.ink.' });
    return;
  }

  if (upstream.status === 401) { res.status(502).json({ error: 'API key Zapi ditolak (401). Periksa ZAPI_KEY di Vercel.' }); return; }
  if (upstream.status === 404) { res.status(404).json({ error: 'Shortlink tidak ditemukan / privat (404).' }); return; }
  if (upstream.status === 429) { res.status(429).json({ error: 'Kuota Zapi habis / rate limit (429). Coba lagi nanti.' }); return; }

  const body = await upstream.json().catch(() => null);
  const data = body && body.data;
  if (!upstream.ok || !data || !data.resolved || !data.finalUrl) {
    res.status(502).json({ error: 'Zapi tidak berhasil menyelesaikan link ini (HTTP ' + upstream.status + ').' });
    return;
  }

  res.status(200).json({
    finalUrl: data.finalUrl,
    steps: data.steps || 0,
    elapsedMs: data.elapsedMs || null,
    inputUrl: data.inputUrl || url,
  });
}
