// GET /api/anime  -> ringkasan home multi-sumber
import { NextResponse } from "next/server";
import { getHome } from "@/lib/scrapers/index.js";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const source = new URL(req.url).searchParams.get("source") || "all";
  try { return NextResponse.json({ status: true, ...(await getHome(source)) }); }
  catch (e) { return NextResponse.json({ status: false, message: String(e?.message || e) }, { status: 500 }); }
}
