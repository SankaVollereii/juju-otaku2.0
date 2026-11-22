export const revalidate = 900;
import Navbar from "../../components/Navbar";
import Header from "../../components/Header";
import AnimeOngoing from "../../components/AnimeOngoing";
import { getByGenre } from "@/lib/scrapers/index.js";
export default async function Page({ params, searchParams }) {
  const { slug } = await params; const sp = (await searchParams) || {};
  const { animes } = await getByGenre(slug, sp.source || "all", parseInt(sp.page || "1", 10) || 1).catch(() => ({ animes: [] }));
  return (<main className="min-h-screen"><Navbar /><Header title={`Genre: ${decodeURIComponent(slug)}`} />{animes.length ? <AnimeOngoing api={animes} /> : <p className="py-16 text-center text-neutral-400">Belum ada anime terbaca untuk genre ini dari sumber yang aktif.</p>}</main>);
}
