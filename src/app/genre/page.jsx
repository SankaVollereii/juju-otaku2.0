export const revalidate = 3600;
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import Link from "next/link";
import { getGenres } from "@/lib/scrapers/index.js";
export default async function Page() {
  const { genres } = await getGenres("all").catch(() => ({ genres: [] }));
  const fallback = ["Action","Adventure","Comedy","Drama","Fantasy","Horror","Romance","Sci-Fi","Slice of Life","Sports","Supernatural","Thriller"].map((n) => ({ name: n, slug: n.toLowerCase().replace(/\s+/g, "-") }));
  const list = genres.length ? genres : fallback;
  return (<main className="min-h-screen"><Navbar /><Header title="Semua Genre" /><div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3 px-4 py-10">{list.map((g) => (<Link key={g.slug} href={`/genre/${g.slug}`} className="rounded-full bg-white/5 px-5 py-2.5 font-medium text-neutral-100 ring-1 ring-white/10 transition hover:bg-fuchsia-600">{g.name}</Link>))}</div></main>);
}
