export const revalidate = 900;
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import AnimeOngoing from "../components/AnimeOngoing";
import { getHome } from "@/lib/scrapers/index.js";
export default async function Page() {
  const home = await getHome("all").catch(() => ({ latest: [] }));
  const populer = [...(home.latest || [])].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
  return (<main className="min-h-screen"><Navbar /><Header title="Anime Populer (Rating Tertinggi)" /><AnimeOngoing api={populer} /></main>);
}
