// src/lib/scrapers/otakudesu.js
// Sumber: https://otakudesu.blog  (WordPress)
// Struktur terverifikasi 20-22 Nov 2026:
//  home: .venz ul li / ongoing-anime/ , complete-anime/
//  detail: /anime/<slug>/  (.fotoanime, .infozingle p, .sinopc, .episodelist ul li)
//  episode: /episode/<slug>/ (.download ul, iframe stream, .prevnext)
//  genre: /genres/ dan /genres/<slug>/ (.venser / .col-anime)
//  jadwal: /jadwal-rilis/ (.kgjdwldn .kglist321)
//  list: /anime-list/ (.az-list / .bariskelom)
import { fetchCheerio } from "./http.js";
import { cleanText, slugFromUrl, absUrl, stripAds, parseRating } from "./utils.js";

export const SOURCE = "otakudesu";
export const BASE = (process.env.OTAKUDESU_URL || "https://otakudesu.blog").replace(/\/$/, "");

function cardFromVenz($, li) {
  const a = $(li).find("a").first();
  const url = absUrl(a.attr("href") || "", BASE);
  if (!url.includes("/anime/")) return null;
  const title = cleanText($(li).find("h2, .jdlflm").first().text()) || cleanText(a.attr("title") || "");
  const poster = $(li).find("img").attr("src") || $(li).find("img").attr("data-src") || "";
  const text = cleanText($(li).text());
  const ep = text.match(/Episode\s*(\d+)/i);
  const score = parseRating(text);
  return {
    source: SOURCE, slug: slugFromUrl(url, SOURCE), title: title.replace(/Subtitle Indonesia/i, "").trim(),
    poster, url, episode: ep ? `Episode ${ep[1]}` : null,
    rating: score, type: "TV", status: null, release_day: null,
  };
}

function parseListPage($) {
  stripAds($);
  const items = [];
  $(".venz ul li, .venser .col-anime, .rseries li, .listupd .bs").each((_, el) => {
    const item = cardFromVenz($, el);
    if (item && item.title) items.push(item);
  });
  // fallback generik: semua link /anime/
  if (!items.length) {
    $("a[href*='/anime/']").each((_, el) => {
      const url = absUrl($(el).attr("href") || "", BASE);
      const title = cleanText($(el).text());
      const poster = $(el).find("img").attr("src") || "";
      if (title && poster) items.push({ source: SOURCE, slug: slugFromUrl(url, SOURCE), title, poster, url, episode: null, rating: null, type: "TV" });
    });
  }
  const seen = new Set();
  return items.filter((i) => i.slug && !seen.has(i.slug) && seen.add(i.slug));
}

export async function getHome() {
  const $ = await fetchCheerio(`${BASE}/`);
  const all = parseListPage($);
  return { latest: all.slice(0, 30), ongoing: all.slice(0, 15), completed: all.slice(15, 30) };
}
export async function getOngoing(page = 1) {
  const $ = await fetchCheerio(page > 1 ? `${BASE}/ongoing-anime/page/${page}/` : `${BASE}/ongoing-anime/`);
  return parseListPage($).map((i) => ({ ...i, status: "Ongoing" }));
}
export async function getCompleted(page = 1) {
  const $ = await fetchCheerio(page > 1 ? `${BASE}/complete-anime/page/${page}/` : `${BASE}/complete-anime/`);
  return parseListPage($).map((i) => ({ ...i, status: "Completed" }));
}
export async function search(q) {
  const $ = await fetchCheerio(`${BASE}/?s=${encodeURIComponent(q)}&post_type=anime`);
  return parseListPage($);
}
export async function getGenres() {
  const $ = await fetchCheerio(`${BASE}/genre-list/`);
  const out = [];
  $("a[href*='/genres/']").each((_, el) => {
    const url = absUrl($(el).attr("href") || "", BASE);
    const name = cleanText($(el).text());
    if (name) out.push({ name, slug: slugFromUrl(url), url, source: SOURCE });
  });
  return [...new Map(out.map((g) => [g.slug, g])).values()];
}
export async function getByGenre(slug, page = 1) {
  const $ = await fetchCheerio(page > 1 ? `${BASE}/genres/${slug}/page/${page}/` : `${BASE}/genres/${slug}/`);
  return parseListPage($);
}
export async function getSchedule() {
  const $ = await fetchCheerio(`${BASE}/jadwal-rilis/`);
  stripAds($);
  const days = {};
  $(".kgjdwldn").each((_, el) => {
    const day = cleanText($(el).find("h2").first().text());
    const items = [];
    $(el).find(".kglist321 ul li a").each((_, a) => {
      const url = absUrl($(a).attr("href") || "", BASE);
      items.push({ source: SOURCE, title: cleanText($(a).text()), slug: slugFromUrl(url, SOURCE), url });
    });
    if (day) days[day] = items;
  });
  return days;
}
export async function getAnimeList() {
  const $ = await fetchCheerio(`${BASE}/anime-list/`);
  stripAds($);
  const items = [];
  $(".az-list a, .bariskelom a, #abtext a, .soralist a").each((_, el) => {
    const url = absUrl($(el).attr("href") || "", BASE);
    const title = cleanText($(el).text());
    if (title && url.includes("/anime/")) items.push({ source: SOURCE, title, slug: slugFromUrl(url, SOURCE), url, poster: null });
  });
  return items;
}

export async function getDetail(slug) {
  const url = `${BASE}/anime/${slug}/`;
  const $ = await fetchCheerio(url);
  stripAds($);
  const title = cleanText($(".judul, h1").first().text()) || cleanText($("title").text()).split("|")[0].trim();
  const poster = $(".fotoanime img").attr("src") || $("img.wp-post-image").attr("src") || "";
  const info = {};
  $(".infozingle p, .infox p, .spe p").each((_, el) => {
    const t = cleanText($(el).text());
    const [k, ...rest] = t.split(":");
    if (k && rest.length) info[k.trim().toLowerCase()] = rest.join(":").trim();
  });
  const genres = [];
  $("a[href*='/genres/']").each((_, el) => genres.push({ name: cleanText($(el).text()), slug: slugFromUrl(absUrl($(el).attr("href") || "", BASE)) }));
  const episodes = [];
  $(".episodelist ul li a, #_epslist li a, .lstep a").each((_, el) => {
    const eurl = absUrl($(el).attr("href") || "", BASE);
    if (eurl.includes("/episode/")) episodes.push({ title: cleanText($(el).text()), slug: slugFromUrl(eurl, SOURCE), url: eurl, source: SOURCE });
  });
  return {
    source: SOURCE, slug, url, title, poster,
    synopsis: cleanText($(".sinopc, .desc, .entry-content p").first().text()) || null,
    status: info["status"] || null, type: info["type"] || "TV",
    rating: parseRating(info["skor"] || info["score"] || $(".score").text() || ""),
    studio: info["studio"] || info["studios"] || null, season: info["season"] || null,
    duration: info["durasi"] || info["duration"] || null, aired: info["rilis"] || info["aired"] || null,
    author: info["produser"] || info["producer"] || null, synonym: info["japanese"] || info["judul jepang"] || null,
    genres: [...new Map(genres.map((g) => [g.slug, g])).values()],
    episodes: episodes.reverse(),
  };
}

export async function getEpisode(slug) {
  const url = `${BASE}/episode/${slug}/`;
  const $ = await fetchCheerio(url);
  stripAds($);
  const title = cleanText($(".posttl, h1").first().text());
  const streams = [];
  // server utama = iframe player
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src && !/ads|facebook|twitter/.test(src)) streams.push({ name: "Server Utama", url: src });
  });
  // daftar server dari tombol mirror
  $(".mirrorstream ul li a, .m360p a, .m480p a, .m720p a").each((_, el) => {
    const href = $(el).attr("data-video") || $(el).attr("href") || "";
    if (href && href.startsWith("http")) streams.push({ name: cleanText($(el).text()) || "Server", url: href });
  });
  const downloads = [];
  $(".download ul li a, .dlbod ul li a").each((_, el) => {
    const href = absUrl($(el).attr("href") || "", BASE);
    if (href) downloads.push({ name: cleanText($(el).text()), url: href });
  });
  const prev = $("a[href*='/episode/']").filter((_, el) => /prev|sebelum/i.test(cleanText($(el).text()))).attr("href");
  const next = $("a[href*='/episode/']").filter((_, el) => /next|selanjut/i.test(cleanText($(el).text()))).attr("href");
  return { source: SOURCE, slug, url, title, streams, downloads, prev: prev ? slugFromUrl(absUrl(prev, BASE), SOURCE) : null, next: next ? slugFromUrl(absUrl(next, BASE), SOURCE) : null };
}
