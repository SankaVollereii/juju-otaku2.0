export const revalidate = 900;
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import AnimeOngoing from "../components/AnimeOngoing";
import { getOngoing } from "@/lib/scrapers/index.js";
export default async function Page({ searchParams }) {
  const sp = (await searchParams) || {};
  const source = sp.source || "all"; const page = parseInt(sp.page || "1", 10) || 1;
  const { animes } = await getOngoing(source, page).catch(() => ({ animes: [] }));
  return (<main className="min-h-screen"><Navbar /><Header title={`Anime Ongoing — ${source === "all" ? "Semua Sumber" : source}`} /><AnimeOngoing api={animes} />
    <div className="flex justify-center gap-3 pb-12">{page > 1 && (<a className="rounded-full bg-white/5 px-5 py-2 ring-1 ring-white/10" href={`/ongoing?page=${page - 1}&source=${source}`}>← Prev</a>)}<a className="rounded-full bg-fuchsia-600 px-5 py-2" href={`/ongoing?page=${page + 1}&source=${source}`}>Next →</a></div></main>);
}
