// src/lib/scrapers/animekompi.js
// Sumber: https://v11.animekompi.sbs — situs ini SPA (Vue), datanya dari API JSON
// internal situs itu sendiri. Endpoint DIVERIFIKASI LIVE 22 Nov 2026:
//  GET /api/home            -> { featured, latestEpisodes, popularWeekly/Monthly/AllTime,
//                                ongoing, completed, movies, trendingToday }
//  GET /api/anime?status=ongoing|completed&type=movie&q=<cari>&order=update&page=1
//                           -> { data, page, totalPages, total }
//  GET /api/anime/<slug>    -> { anime, genres, episodes }
//  GET /api/episodes/latest -> { data: [{slug, episodeNumber, animeSlug, animeTitle, cover}] }
//  GET /api/episodes/<slug> -> { episode, anime, genres, sources[{label,url}], downloads[{label,url,resolution}] }
//  GET /api/genres          -> [{id, slug, name, count}]
//  GET /api/genres/<slug>   -> { genre, anime: [...] }
//  GET /api/schedule        -> { days: [{day, items:[{animeSlug,title,cover,episode}]}] }
//  GET /api/anime/list-mode -> [{letter, items:[...]}]  (sangat besar, ~4MB — dipakai seperlunya)
// Iklan: endpoint /api/ads/* SENGAJA tidak pernah dipanggil, dan label server
// yang mengandung kata iklan dibuang dari daftar stream.
import { fetchJson } from "./http.js";

export const SOURCE = "animekompi";
export const BASE = (process.env.ANIMEKOMPI_URL || "https://v11.animekompi.sbs").replace(/\/$/, "");
const API = `${BASE}/api`;

const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${BASE}${p}`);
function mapAnime(a) {
  if (!a) return null;
  return {
    source: SOURCE, slug: a.slug, title: a.title, poster: img(a.cover),
    url: `${BASE}/anime/${a.slug}/`, synopsis: a.synopsis || null,
    rating: a.rating != null ? String(a.rating) : null,
    type: a.type || "TV", status: a.status ? (a.status === "ongoing" ? "Ongoing" : "Completed") : null,
    year: a.year || null, studio: a.studio || null,
    genres: (a.genres || []).map((g) => ({ name: g.name, slug: g.slug })),
    episode: null,
  };
}
function mapEpisodeCard(e) {
  return {
    source: SOURCE, slug: e.animeSlug, title: e.animeTitle, poster: img(e.cover),
    url: `${BASE}/anime/${e.animeSlug}/`, episode: e.episodeNumber ? `Episode ${e.episodeNumber}` : null,
    type: e.animeType || "TV", status: e.animeStatus === "ongoing" ? "Ongoing" : "Completed",
    episodeSlug: e.slug, rating: null,
  };
}

export async function getHome() {
  const h = await fetchJson(`${API}/home`);
  return {
    latest: (h.latestEpisodes || []).map(mapEpisodeCard),
    ongoing: (h.ongoing || []).map(mapAnime),
    completed: (h.completed || []).map(mapAnime),
    featured: (h.featured || []).map(mapAnime),
    trending: (h.trendingToday || []).map(mapAnime),
    movies: (h.movies || []).map(mapAnime),
  };
}
async function listAnime(params, page = 1) {
  const qs = new URLSearchParams({ order: "update", page: String(page), ...params });
  const j = await fetchJson(`${API}/anime?${qs}`);
  return (j.data || []).map(mapAnime);
}
export async function getOngoing(page = 1) { return listAnime({ status: "ongoing" }, page); }
export async function getCompleted(page = 1) { return listAnime({ status: "completed" }, page); }
export async function getMovies(page = 1) { return listAnime({ type: "movie" }, page); }
export async function search(q) { return listAnime({ q }); }
export async function getGenres() {
  const j = await fetchJson(`${API}/genres`);
  return (Array.isArray(j) ? j : []).filter((g) => g.count > 0).map((g) => ({ name: g.name, slug: g.slug, count: g.count, url: `${BASE}/genre/${g.slug}/`, source: SOURCE }));
}
export async function getByGenre(slug, page = 1) {
  const j = await fetchJson(`${API}/genres/${encodeURIComponent(slug)}`);
  const items = (j.anime || []).map(mapAnime);
  return items.slice((page - 1) * 24, page * 24);
}
export async function getSchedule() {
  const j = await fetchJson(`${API}/schedule`);
  const days = {};
  for (const d of j.days || []) {
    days[d.day] = (d.items || []).map((i) => ({ source: SOURCE, title: i.title, slug: i.animeSlug, url: `${BASE}/anime/${i.animeSlug}/`, episode: i.episode, poster: img(i.cover) }));
  }
  return days;
}
export async function getAnimeList() {
  // list-mode mengembalikan SEMUA anime per huruf (file besar) — ambil ringkasnya saja
  const j = await fetchJson(`${API}/anime/list-mode`, { ttl: 60 * 60 * 1000 });
  const out = [];
  for (const group of Array.isArray(j) ? j : []) {
    for (const a of group.items || []) out.push({ source: SOURCE, title: a.title, slug: a.slug, url: `${BASE}/anime/${a.slug}/`, poster: img(a.cover), type: a.type, status: a.status });
  }
  return out;
}
export async function getDetail(slug) {
  const j = await fetchJson(`${API}/anime/${encodeURIComponent(slug)}`);
  const a = j.anime || {};
  const base = mapAnime({ ...a, genres: j.genres || a.genres });
  return {
    ...base, url: `${BASE}/anime/${slug}/`,
    duration: a.duration || null, season: a.season || null,
    aired: a.releasedAt || null, author: a.director || a.fansub || null, synonym: a.altTitles || null,
    episodes: (j.episodes || []).map((e) => ({ title: e.title || `Episode ${e.numberLabel || e.number}`, slug: e.slug, url: `${BASE}/watch/${e.slug}/`, source: SOURCE, number: e.number })),
  };
}
export async function getEpisode(slug) {
  const j = await fetchJson(`${API}/episodes/${encodeURIComponent(slug)}`);
  const ep = j.episode || {}; const an = j.anime || {};
  // Buang server yang judulnya terang-terangan iklan/promo
  const streams = (j.sources || []).filter((s) => { const l = s.label || ""; if (/tanpa iklan/i.test(l)) return true; return !/iklan|\bads\b|promo|bet|slot|togel/i.test(l); }).map((s) => ({ name: s.label || "Server", url: s.url, quality: s.quality || null }));
  const downloads = (j.downloads || []).map((d) => ({ name: `${d.label || "Download"} ${d.resolution || ""}`.trim(), url: d.url }));
  return {
    source: SOURCE, slug, url: `${BASE}/watch/${slug}/`,
    title: ep.title || `${an.title || ""} Episode ${ep.numberLabel || ep.number || ""}`.trim(),
    streams, downloads, anime: mapAnime(an), prev: null, next: null,
  };
}
