// src/lib/scrapers/utils.js
// Util bersama untuk semua scraper. TANPA iklan: semua hasil dibersihkan
// dari script iklan, popunder, banner, dan iframe non-stream.

export const AD_HOSTS = [
  "popads", "popcash", "adsterra", "propellerads", "exoclick", "juicyads",
  "trafficjunky", "doubleclick", "googlesyndication", "adsco", "hilltopads",
  "clickadu", "adcash", "mgid", "outbrain", "taboola", "a-ads", "coinzilla",
  "sociabuzz", "saweria", // donasi bukan konten anime
];

export function isAdUrl(url = "") {
  const u = String(url).toLowerCase();
  return AD_HOSTS.some((h) => u.includes(h));
}

export function cleanText(s = "") {
  return String(s).replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

export function slugify(s = "") {
  return String(s).toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function normalizeTitle(s = "") {
  return slugify(String(s).replace(/sub\s*indo/i, "").replace(/\(.*?\)/g, ""));
}

// Ambil slug terakhir dari URL sumber, contoh:
// https://otakudesu.blog/anime/one-piece-sub-indo/ -> one-piece-sub-indo
// https://v20.kuramanime.ing/anime/123/one-piece -> 123/one-piece (dijaga utuh)
export function slugFromUrl(url = "", source = "") {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (source === "kuramanime") {
      const i = parts.indexOf("anime");
      if (i >= 0) return parts.slice(i + 1).join("/");
    }
    return parts[parts.length - 1] || "";
  } catch { return slugify(url); }
}

export function absUrl(href = "", base = "") {
  try { return new URL(href, base).toString(); } catch { return href || ""; }
}

// Buang elemen iklan / non-konten dari cheerio document
export function stripAds($) {
  $("script, noscript, iframe[src*='ads'], iframe[src*='pop'], .ads, .ad, .iklan, .banner-iklan, [id*='ad-'], [class*='popunder']").remove();
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (isAdUrl(href)) $(el).remove();
  });
}

export function pickPoster($, scope) {
  const img = scope ? $(scope).find("img").first() : $("img").first();
  return img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";
}

export function parseRating(text = "") {
  const m = String(text).match(/(\d+[.,]\d+)/);
  return m ? m[1].replace(",", ".") : null;
}

export function dedupeByTitle(items = []) {
  const seen = new Map();
  for (const it of items) {
    if (!it || !it.title) continue;
    const key = normalizeTitle(it.title);
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, it);
    else {
      // lengkapi field yang kosong dari sumber lain
      const prev = seen.get(key);
      for (const k of ["poster", "rating", "type", "status", "episode", "synopsis"]) {
        if (!prev[k] && it[k]) prev[k] = it[k];
      }
      if (!prev.alternateSources) prev.alternateSources = [];
      prev.alternateSources.push({ source: it.source, slug: it.slug, url: it.url });
    }
  }
  return [...seen.values()];
}
