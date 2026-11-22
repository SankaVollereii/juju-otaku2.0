// src/app/api/anime/[...path]/route.js
// API internal JujuOtaku (pengganti API eksternal lama, TANPA iklan).
// Contoh:
//  GET /api/anime/home?source=all|otakudesu|kuramanime|animekompi
//  GET /api/anime/ongoing?page=1&source=all
//  GET /api/anime/completed?page=1&source=all
//  GET /api/anime/latest
//  GET /api/anime/list?page=1&source=all
//  GET /api/anime/genres
//  GET /api/anime/genre/action?source=all&page=1
//  GET /api/anime/schedule
//  GET /api/anime/search/one-piece?source=all   (atau ?q=one+piece)
//  GET /api/anime/detail?source=otakudesu&slug=one-piece-sub-indo
//  GET /api/anime/episode?source=kuramanime&slug=123/one-piece/episode/1
// Auto-update: response memakai s-maxage + stale-while-revalidate, dan
// scraper cache TTL 15 menit (lihat lib/scrapers/http.js).
import { NextResponse } from "next/server";
import * as agg from "@/lib/scrapers/index.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok(data) {
  return NextResponse.json(
    { status: true, ...data },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
  );
}
function fail(msg, code = 500) {
  return NextResponse.json({ status: false, message: String(msg) }, { status: code });
}

export async function GET(req, { params }) {
  const { path = [] } = await params;
  const sp = new URL(req.url).searchParams;
  const source = sp.get("source") || "all";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const [head, ...rest] = path;
  try {
    switch (head) {
      case "home": case undefined: return ok(await agg.getHome(source));
      case "latest": { const h = await agg.getHome(source); return ok({ animes: h.latest, errors: h.errors }); }
      case "ongoing": return ok(await agg.getOngoing(source, page));
      case "completed": case "complete": return ok(await agg.getCompleted(source, page));
      case "list": case "animelist": return ok(await agg.getAnimeList(source, page));
      case "genres": return ok(await agg.getGenres(source));
      case "genre": return ok(await agg.getByGenre(rest.join("/"), source, page));
      case "schedule": return ok(await agg.getSchedule(source));
      case "search": {
        const q = sp.get("q") || decodeURIComponent(rest.join(" "));
        if (!q) return fail("Parameter q / kata kunci kosong", 400);
        return ok(await agg.search(q, source));
      }
      case "detail": {
        const slug = sp.get("slug") || rest.join("/");
        if (!slug) return fail("Parameter slug kosong", 400);
        const detail = await agg.getDetail(source === "all" ? "otakudesu" : source, slug);
        return ok({ detail });
      }
      case "episode": {
        const slug = sp.get("slug") || rest.join("/");
        if (!slug) return fail("Parameter slug kosong", 400);
        const episode = await agg.getEpisode(source === "all" ? "otakudesu" : source, slug);
        return ok(episode);
      }
      case "sources": return ok({ sources: agg.SOURCE_NAMES, cache: agg.cacheStats() });
      default: return fail(`Endpoint tidak dikenal: /api/anime/${path.join("/")}`, 404);
    }
  } catch (e) {
    return fail(e?.message || e);
  }
}
