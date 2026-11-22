// src/lib/scrapers/index.js
// Aggregator multi-sumber + AUTO-UPDATE.
// - Semua fungsi sumber dijalankan paralel (Promise.allSettled): satu sumber
//   mati tidak menjatuhkan situs.
// - Hasil digabung & didedupe berdasarkan judul (dedupeByTitle).
// - Cache ada di http.js (TTL 15 menit default, SCRAPE_CACHE_TTL_MS).
//   Setelah TTL lewat, request berikutnya otomatis scrape ulang = auto-update.
// - warmCache() dipanggil oleh /api/cron/update (Vercel Cron / cron eksternal)
//   supaya pengunjung pertama setelah update tidak menunggu scrape.
import * as otakudesu from "./otakudesu.js";
import * as kuramanime from "./kuramanime.js";
import * as animekompi from "./animekompi.js";
import { dedupeByTitle } from "./utils.js";
import { clearScrapeCache, cacheStats } from "./http.js";

export const SOURCES = { otakudesu, kuramanime, animekompi };
export const SOURCE_NAMES = Object.keys(SOURCES);

export function getSource(name) {
  return SOURCES[String(name || "").toLowerCase()] || null;
}
function pickSources(sourceParam) {
  if (!sourceParam || sourceParam === "all") return Object.entries(SOURCES);
  const s = getSource(sourceParam);
  return s ? [[sourceParam.toLowerCase(), s]] : Object.entries(SOURCES);
}

async function runAll(sourceParam, fn, ...args) {
  const entries = pickSources(sourceParam);
  const results = await Promise.allSettled(entries.map(([, mod]) => mod[fn](...args)));
  const out = [];
  const errors = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      const v = r.value;
      if (Array.isArray(v)) out.push(...v);
      else if (v && typeof v === "object") out.push(v);
    } else errors[entries[i][0]] = String(r.reason?.message || r.reason);
  });
  return { data: out, errors };
}

export async function getHome(source = "all") {
  const entries = pickSources(source);
  const results = await Promise.allSettled(entries.map(([, m]) => m.getHome()));
  const latest = [], ongoing = [], completed = [], errors = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") { latest.push(...(r.value.latest || [])); ongoing.push(...(r.value.ongoing || [])); completed.push(...(r.value.completed || [])); }
    else errors[entries[i][0]] = String(r.reason?.message || r.reason);
  });
  return {
    latest: dedupeByTitle(latest),
    ongoing: dedupeByTitle(ongoing),
    completed: dedupeByTitle(completed),
    sources: entries.map(([n]) => n),
    errors, updatedAt: new Date().toISOString(),
  };
}
export async function getOngoing(source = "all", page = 1) {
  const { data, errors } = await runAll(source, "getOngoing", page);
  return { animes: dedupeByTitle(data), errors, updatedAt: new Date().toISOString() };
}
export async function getCompleted(source = "all", page = 1) {
  const { data, errors } = await runAll(source, "getCompleted", page);
  return { animes: dedupeByTitle(data), errors, updatedAt: new Date().toISOString() };
}
export async function search(q, source = "all") {
  const { data, errors } = await runAll(source, "search", q);
  return { animes: dedupeByTitle(data), errors, query: q, updatedAt: new Date().toISOString() };
}
export async function getGenres(source = "all") {
  const { data, errors } = await runAll(source, "getGenres");
  const map = new Map();
  for (const g of data) if (g?.slug && !map.has(g.slug)) map.set(g.slug, g);
  return { genres: [...map.values()].sort((a, b) => a.name.localeCompare(b.name)), errors };
}
export async function getByGenre(slug, source = "all", page = 1) {
  const { data, errors } = await runAll(source, "getByGenre", slug, page);
  return { animes: dedupeByTitle(data), errors, genre: slug };
}
export async function getSchedule(source = "all") {
  const entries = pickSources(source);
  const results = await Promise.allSettled(entries.map(([, m]) => m.getSchedule()));
  const schedule = {}; const errors = {};
  results.forEach((r, i) => { if (r.status === "fulfilled") Object.assign(schedule, r.value); else errors[entries[i][0]] = String(r.reason?.message || r.reason); });
  return { schedule, errors, updatedAt: new Date().toISOString() };
}
export async function getAnimeList(source = "all", page = 1) {
  const { data, errors } = await runAll(source, "getAnimeList", page);
  return { animes: dedupeByTitle(data), errors };
}
export async function getDetail(source, slug) {
  const mod = getSource(source) || otakudesu;
  return mod.getDetail(slug);
}
export async function getEpisode(source, slug) {
  const mod = getSource(source) || otakudesu;
  return mod.getEpisode(slug);
}

// Dipakai cron auto-update: bersihkan cache lalu panaskan halaman utama semua sumber.
export async function warmCache() {
  clearScrapeCache();
  const home = await getHome("all");
  const [ongoing, genres] = await Promise.allSettled([getOngoing("all", 1), getGenres("all")]);
  return {
    ok: true, at: new Date().toISOString(),
    latest: home.latest.length, ongoing: home.ongoing.length, completed: home.completed.length,
    errors: home.errors, cache: cacheStats(),
    ongoingOk: ongoing.status === "fulfilled", genresOk: genres.status === "fulfilled",
  };
}
export { cacheStats };
