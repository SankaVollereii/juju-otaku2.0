// src/lib/scrapers/http.js
// Fetch HTML sumber dengan: header browser, timeout, retry, dan CACHE di memori.
// Cache inilah yang membuat anime "auto-update": data dianggap basi setelah TTL,
// request berikutnya mengambil ulang dari sumber, tanpa perlu cron eksternal.
// Di Vercel/production, cache per-instance + ISR (revalidate di route) bekerja bersama.
// Endpoint /api/cron/update memanaskan cache ini secara berkala.

import * as cheerio from "cheerio";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const cache = new Map(); // url -> { at, html }
export const CACHE_TTL_MS = Number(process.env.SCRAPE_CACHE_TTL_MS || 15 * 60 * 1000); // 15 menit default
const inflight = new Map();

export function cacheStats() {
  return { entries: cache.size, ttlMs: CACHE_TTL_MS, urls: [...cache.keys()].slice(0, 50) };
}
export function clearScrapeCache() { cache.clear(); }

export async function fetchHtml(url, { ttl = CACHE_TTL_MS, force = false } = {}) {
  const now = Date.now();
  const hit = cache.get(url);
  if (!force && hit && now - hit.at < ttl) return hit.html;
  if (inflight.has(url)) return inflight.get(url);

  const task = (async () => {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.7",
            "Referer": new URL(url).origin + "/",
          },
          signal: AbortSignal.timeout(20000),
          // Next.js data cache ikut membantu auto-update di production
          next: { revalidate: Math.floor(ttl / 1000) },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
        const html = await res.text();
        if (!html || html.length < 200) throw new Error(`Empty response ${url}`);
        cache.set(url, { at: Date.now(), html });
        return html;
      } catch (e) {
        lastErr = e;
        // kalau ada cache lama, pakai itu daripada gagal total
        if (hit) return hit.html;
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
    throw lastErr || new Error(`Fetch failed ${url}`);
  })();

  inflight.set(url, task);
  try { return await task; } finally { inflight.delete(url); }
}

export async function fetchCheerio(url, opts) {
  const html = await fetchHtml(url, opts);
  return cheerio.load(html);
}

// Sama seperti fetchHtml tapi untuk endpoint JSON (dipakai API AnimeKompi).
export async function fetchJson(url, { ttl = CACHE_TTL_MS, force = false } = {}) {
  const text = await fetchHtml(url, { ttl, force });
  return JSON.parse(text);
}
