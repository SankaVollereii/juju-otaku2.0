// src/app/api/cron/update/route.js
// AUTO-UPDATE: dipanggil berkala untuk membersihkan cache scraper dan
// mengambil ulang data terbaru dari Otakudesu, Kuramanime, dan AnimeKompi.
// Cara pakai:
//  - Vercel: vercel.json sudah berisi cron tiap 30 menit ke path ini.
//  - VPS / lokal: crontab / cron-job.org memanggil:
//      curl -H "Authorization: Bearer $CRON_SECRET" https://domainmu/api/cron/update
//  - Tanpa CRON_SECRET di .env, endpoint bisa dipanggil siapa saja (mode dev).
import { NextResponse } from "next/server";
import { warmCache } from "@/lib/scrapers/index.js";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    const key = new URL(req.url).searchParams.get("key") || "";
    if (auth !== `Bearer ${secret}` && key !== secret) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }
  }
  const result = await warmCache();
  return NextResponse.json({ status: true, ...result });
}
export const GET = handle;
export const POST = handle;
