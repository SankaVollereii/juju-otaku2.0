export const revalidate = 900;
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import Link from "next/link";
import { getAnimeList } from "@/lib/scrapers/index.js";
const LETTERS = ["All", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
export default async function Page({ searchParams }) {
  const sp = (await searchParams) || {};
  const letter = (sp.letter || "All").toUpperCase();
  const { animes } = await getAnimeList(sp.source || "all", 1).catch(() => ({ animes: [] }));
  const list = letter === "ALL" ? animes : (animes || []).filter((a) => (a.title || "").toUpperCase().startsWith(letter));
  return (
    <main className="min-h-screen"><Navbar /><Header title="Daftar Semua Anime A - Z" />
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 px-4 py-6">{LETTERS.map((l) => (<Link key={l} href={`/animelist?letter=${l}`} className={`flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-sm font-bold ${letter === l.toUpperCase() ? "bg-fuchsia-600 text-white" : "bg-white/5 text-neutral-300 ring-1 ring-white/10"}`}>{l}</Link>))}</div>
      {list.length ? (<div className="mx-auto grid max-w-7xl grid-cols-1 gap-2 px-4 pb-14 sm:grid-cols-2 lg:grid-cols-3">{list.map((a) => (<Link key={`${a.source}-${a.slug}`} href={`/detail/${encodeURIComponent(a.slug)}?source=${a.source}`} className="rounded-xl bg-white/[0.03] px-4 py-3 text-sm text-neutral-100 ring-1 ring-white/5 hover:bg-fuchsia-600/20"><span className="mr-2 rounded bg-black/40 px-2 py-0.5 text-[10px] capitalize text-cyan-300">{a.source}</span>{a.title}</Link>))}</div>) : (<p className="py-14 text-center text-neutral-400">Tidak ada anime berawalan “{letter}” pada halaman sumber saat ini. Coba huruf lain atau tunggu auto-update berikutnya.</p>)}
    </main>
  );
}
