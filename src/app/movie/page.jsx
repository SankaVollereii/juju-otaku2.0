export const revalidate = 900;
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import AnimeOngoing from "../components/AnimeOngoing";
import { search } from "@/lib/scrapers/index.js";
export default async function Page() {
  const { animes } = await search("movie", "all").catch(() => ({ animes: [] }));
  const movies = (animes || []).filter((a) => /movie/i.test(a.type || "") || /movie/i.test(a.title || ""));
  const list = movies.length ? movies : animes;
  return (<main className="min-h-screen"><Navbar /><Header title="Anime Movie" />{list?.length ? <AnimeOngoing api={list} /> : <p className="py-16 text-center text-neutral-400">Belum ada movie terbaca saat ini.</p>}</main>);
}
