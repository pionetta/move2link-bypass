# Bypass Move2Link via Zapi

Website kecil untuk melewati shortlink move2link.co: tempel link, link tujuan
akhir keluar lewat API [Zapi](https://zapi.ink/api/bypass-tools/move2link) —
tanpa halaman iklan, tanpa timer, tanpa verifikasi Cloudflare di browser.

## Cara kerja

- `index.html` — halaman depan (statis, tanpa build step).
- `api/resolve.js` — fungsi serverless Vercel. Browser memanggil
  `POST /api/resolve`, fungsi ini memanggil
  `GET https://api.zapi.ink/v1/move2link/resolve?url=...` dengan header
  `x-api-key`, lalu mengembalikan `finalUrl`, jumlah langkah, dan durasi.
- Proses resolve memakan waktu ±40 detik karena Zapi mengerjakan
  langkah-langkah shortlink-nya di server mereka.

## Pengaturan wajib

API key Zapi **tidak** disimpan di repo. Atur sebagai environment variable
di Vercel:

```text
Project Settings -> Environment Variables -> ZAPI_KEY = <key dari dashboard zapi.ink>
```

Tier gratis Zapi: 600 request/bulan, 100 request/menit. Kuota yang dipakai
situs ini adalah kuota akun Zapi pemilik key tersebut.

## Deploy

Repo ini terhubung ke Vercel — setiap push ke branch `main` otomatis
ter-deploy. Deploy manual juga bisa dari dashboard Vercel (Import Git
Repository) tanpa pengaturan build apa pun (framework: Other).
