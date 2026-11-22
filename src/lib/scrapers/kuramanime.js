// src/lib/scrapers/kuramanime.js
// Sumber: https://v20.kuramanime.ing
// Struktur umum Kuramanime (Laravel):
//  list: /anime?order_by=latest etc, kartu: .product__item / a[href*='/anime/']
//  detail: /anime/<id>/<slug>  (info di .anime__details__* / properti)
//  episode: /anime/<id>/<slug>/episode/<no>  (player di #player / iframe, server list)
//  genre: /genres/<slug>, jadwal: /schedule, search: /anime?search=<q>
import { fetchCheerio, fetchHtml } from "./http.js";
import { cleanText, slugFromUrl, absUrl, stripAds, parseRating } from "./utils.js";

export const SOURCE = "kuramanime";
export const BASE = (process.env.KURAMANIME_URL || "https://v20.kuramanime.ing").replace(/\/$/, "");

function parseCards($) {
  stripAds($);
  const items = [];
  $(".product__item, .anime-card, article").each((_, el) => {
    const a = $(el).find("a[href*='/anime/']").first();
    const url = absUrl(a.attr("href") || "", BASE);
    if (!url || url.includes("/episode/")) return;
    const title = cleanText($(el).find("h5, h3, .product__item__text h5").first().text()) || cleanText(a.attr("title") || "");
    const poster = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
    const text = cleanText($(el).text());
    const ep = text.match(/Ep\s*(\d+)/i) || text.match(/Episode\s*(\d+)/i);
    if (title) items.push({ source: SOURCE, slug: slugFromUrl(url, SOURCE), title, poster, url, episode: ep ? `Episode ${ep[1]}` : null, rating: parseRating(text), type: text.includes("Movie") ? "Movie" : "TV", status: null });
  });
  if (!items.length) {
    $("a[href*='/anime/']").each((_, el) => {
      const url = absUrl($(el).attr("href") || "", BASE);
      const title = cleanText($(el).text());
      const poster = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
      if (title && poster && !url.includes("/episode/")) items.push({ source: SOURCE, slug: slugFromUrl(url, SOURCE), title, poster, url, episode: null, rating: null, type: "TV" });
    });
  }
  const seen = new Set();
  return items.filter((i) => i.slug && !seen.has(i.slug) && seen.add(i.slug));
}

export async function getHome() {
  const $ = await fetchCheerio(`${BASE}/`);
  const all = parseCards($);
  return { latest: all.slice(0, 30), ongoing: all.slice(0, 15), completed: all.slice(15, 30) };
}
export async function getOngoing(page = 1) {
  const $ = await fetchCheerio(`${BASE}/anime?status=ongoing&order_by=latest&page=${page}`);
  return parseCards($).map((i) => ({ ...i, status: "Ongoing" }));
}
export async function getCompleted(page = 1) {
  const $ = await fetchCheerio(`${BASE}/anime?status=ended&order_by=latest&page=${page}`);
  return parseCards($).map((i) => ({ ...i, status: "Completed" }));
}
export async function search(q) {
  const $ = await fetchCheerio(`${BASE}/anime?search=${encodeURIComponent(q)}`);
  return parseCards($);
}
export async function getGenres() {
  const $ = await fetchCheerio(`${BASE}/properties/genre`);
  const out = [];
  $("a[href*='/genres/'], a[href*='genre']").each((_, el) => {
    const url = absUrl($(el).attr("href") || "", BASE);
    const name = cleanText($(el).text());
    if (name) out.push({ name, slug: slugFromUrl(url), url, source: SOURCE });
  });
  return [...new Map(out.map((g) => [g.slug, g])).values()];
}
export async function getByGenre(slug, page = 1) {
  const $ = await fetchCheerio(`${BASE}/anime?genres=${encodeURIComponent(slug)}&page=${page}`);
  return parseCards($);
}
export async function getSchedule() {
  const $ = await fetchCheerio(`${BASE}/schedule`);
  const days = {};
  // Kuramanime schedule dikelompokkan per hari dalam section/tab
  $("h3, h4").each((_, h) => {
    const day = cleanText($(h).text());
    if (!/senin|selasa|rabu|kamis|jumat|sabtu|minggu/i.test(day)) return;
    const items = [];
    $(h).parent().find("a[href*='/anime/']").each((_, a) => {
      const url = absUrl($(a).attr("href") || "", BASE);
      const title = cleanText($(a).text());
      if (title) items.push({ source: SOURCE, title, slug: slugFromUrl(url, SOURCE), url });
    });
    if (items.length) days[day] = items;
  });
  if (!Object.keys(days).length) {
    const ongoing = await getOngoing(1);
    days["Update Terbaru"] = ongoing.map(({ title, slug, url, source }) => ({ title, slug, url, source }));
  }
  return days;
}
export async function getAnimeList(page = 1) {
  const $ = await fetchCheerio(`${BASE}/anime?order_by=ascending&page=${page}`);
  return parseCards($);
}

export async function getDetail(slug) {
  // slug kuramanime = "<id>/<judul>"
  const url = `${BASE}/anime/${slug}`;
  const $ = await fetchCheerio(url);
  stripAds($);
  const title = cleanText($(".anime__details__title h3, h1, h3").first().text());
  const poster = $(".anime__details__pic img, .set-bg").attr("data-src") || $(".anime__details__pic img").attr("src") || $("meta[property='og:image']").attr("content") || "";
  const synopsis = cleanText($(".anime__details__text p, .synopsis p, [itemprop='description']").first().text()) || null;
  const infoText = cleanText($(".anime__details__widget, .anime-info, .properties").text());
  const getInfo = (label) => { const m = infoText.match(new RegExp(label + "\\s*:?\\s*([^\\n]+)", "i")); return m ? cleanText(m[1]) : null; };
  const genres = [];
  $("a[href*='genre']").each((_, el) => { const n = cleanText($(el).text()); if (n) genres.push({ name: n, slug: slugFromUrl(absUrl($(el).attr("href") || "", BASE)) }); });
  const episodes = [];
  $("a[href*='/episode/']").each((_, el) => {
    const eurl = absUrl($(el).attr("href") || "", BASE);
    const parts = eurl.split("/episode/");
    if (parts[1]) episodes.push({ title: cleanText($(el).text()) || `Episode ${parts[1]}`, slug: `${slug}/episode/${parts[1].split(/[?#]/)[0]}`, url: eurl, source: SOURCE });
  });
  return {
    source: SOURCE, slug, url, title: title || slug, poster, synopsis,
    status: getInfo("Status"), type: getInfo("Tipe") || getInfo("Type") || "TV",
    rating: parseRating(getInfo("Skor") || $(".anime__details__review").text() || ""),
    studio: getInfo("Studio"), season: getInfo("Musim") || getInfo("Season"),
    duration: getInfo("Durasi"), aired: getInfo("Tayang") || getInfo("Aired"),
    author: getInfo("Produser"), synonym: getInfo("Judul Jepang") || getInfo("Japanese"),
    genres, episodes,
  };
}

export async function getEpisode(slug) {
  // slug = "<id>/<judul>/episode/<no>"
  const url = `${BASE}/anime/${slug}`;
  const html = await fetchHtml(url);
  const $ = (await import("cheerio")).load(html);
  stripAds($);
  const title = cleanText($("h1, h2, .episode-title").first().text()) || slug;
  const streams = [];
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src && !/ads|facebook/.test(src)) streams.push({ name: "KuramaStream", url: src.startsWith("//") ? "https:" + src : src });
  });
  // server buttons biasanya membawa data-video / href ke kuramadrive dsb
  $("a[data-video], .server-list a, [data-server] a").each((_, el) => {
    const href = $(el).attr("data-video") || $(el).attr("href") || "";
    if (href && href.startsWith("http")) streams.push({ name: cleanText($(el).text()) || "Server", url: href });
  });
  // fallback: cari URL embed di script (tanpa mengeksekusi apa pun)
  const m = html.match(/https?:\/\/[^\s"'<>]+(?:embed|stream|player)[^\s"'<>]*/gi) || [];
  for (const u of m.slice(0, 5)) if (!streams.find((s) => s.url === u)) streams.push({ name: "Server Alternatif", url: u });
  const downloads = [];
  $("a[href*='kuramadrive'], a[href*='drive.google'], .download a").each((_, el) => downloads.push({ name: cleanText($(el).text()) || "Download", url: absUrl($(el).attr("href") || "", BASE) }));
  return { source: SOURCE, slug, url, title, streams, downloads, prev: null, next: null };
}
