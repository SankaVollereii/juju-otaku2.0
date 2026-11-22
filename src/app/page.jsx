// app/page.jsx — Home baru: data LANGSUNG dari scraper internal multi-sumber
// (Otakudesu + Kuramanime + AnimeKompi), auto-update via cache TTL 15 menit.
// Tidak lagi bergantung pada API eksternal lama. Tanpa iklan.
import AnimeCompleted from "@/app/components/AnimeCompleted";
import AnimeOngoing from "@/app/components/AnimeOngoing";
import Header from "@/app/components/Header";
import HeroSection from "@/app/components/HeroSection";
import Navbar from "./components/Navbar";
import Link from "next/link";
import { AuthUserSession } from "./libs/auth-libs";
import { getHome } from "@/lib/scrapers/index.js";

export const revalidate = 900; // ISR 15 menit = auto-update di production

function EmptySection({ sectionTitle }) {
  return (<div className="px-4 py-8 text-center"><p className="text-lg font-semibold text-amber-400">Sumber {sectionTitle} sedang tidak terjangkau</p><p className="text-sm text-neutral-400">Data akan otomatis dicoba lagi pada update berikutnya (maks. 15 menit).</p></div>);
}
const SOURCES = [
  { id: "otakudesu", name: "Otakudesu", desc: "otakudesu.blog" },
  { id: "kuramanime", name: "Kuramanime", desc: "v20.kuramanime.ing" },
  { id: "animekompi", name: "AnimeKompi", desc: "v11.animekompi.sbs" },
];
export default async function Home() {
  const user = await AuthUserSession().catch(() => null);
  let home = { latest: [], ongoing: [], completed: [], errors: {} };
  try { home = await getHome("all"); } catch (e) { console.error(e); }
  return (
    <main className="min-h-screen">
      <Navbar user={user} />
      <HeroSection />
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4">
        {SOURCES.map((s) => (
          <span key={s.id} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-neutral-300 ring-1 ring-white/10">
            {home.errors?.[s.id] ? "🔴" : "🟢"} <b className="text-white">{s.name}</b> · {s.desc}
          </span>
        ))}
        <Link href="/api/anime/sources" className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-cyan-300 ring-1 ring-white/10">Status API →</Link>
      </div>

      <Header title="🔥 Update Terbaru" href="/ongoing" />
      {home.latest.length ? <AnimeOngoing api={home.latest.slice(0, 15)} /> : <EmptySection sectionTitle="anime" />}

      <Header title="Anime Ongoing" href="/ongoing" />
      {home.ongoing.length ? <AnimeOngoing api={home.ongoing.slice(0, 15)} /> : <EmptySection sectionTitle="ongoing" />}

      <Header title="Anime Completed" href="/completed" />
      {home.completed.length ? <AnimeCompleted api={home.completed.slice(0, 15)} /> : <EmptySection sectionTitle="completed" />}

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-center text-2xl font-extrabold text-white">Kenapa JujuOtaku?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["1080p HD", "Streaming adaptif dengan banyak pilihan server."], ["Auto-Update", "Episode baru tersync otomatis tiap 15 menit dari 3 sumber."], ["Multi-Server", "Satu judul bisa punya sumber cadangan dari situs lain."], ["Distraction-Free", "Tanpa iklan, tanpa pop-up, tanpa redirect aneh."]].map(([t, d], i) => (
            <div key={t} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"><div className="text-sm font-bold text-fuchsia-400">0{i + 1}</div><h3 className="mt-2 font-bold text-white">{t}</h3><p className="mt-1 text-sm text-neutral-400">{d}</p></div>
          ))}
        </div>
      </section>
      <footer className="border-t border-white/5 py-8 text-center text-xs text-neutral-500">JujuOtaku — nonton anime sub Indo gratis, tanpa iklan. Data: Otakudesu · Kuramanime · AnimeKompi.</footer>
    </main>
  );
}
