import React from 'react'
import SearchInput from './SearchInput'
import Link from 'next/link'

// Hero ala Cihuynime (www.cihuynime.fun): badge kecil, judul besar di tengah,
// subjudul tenang, search besar, chip pencarian populer, dan bar statistik.
const POPULAR = ["One Piece", "Solo Leveling", "Jujutsu Kaisen", "Oshi No Ko", "Frieren", "Mashle"];
const HeroSection = ({ stats }) => (
  <section className="relative overflow-hidden px-4 pb-14 pt-16 text-center">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.08),transparent_55%)]" />
    <div className="relative mx-auto max-w-4xl">
      <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-neutral-300">
        Free Anime Streaming · HD Quality · Tanpa Iklan
      </span>
      <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-6xl">
        Watch Free <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">Anime</span> Online
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-400 sm:text-base">
        Portal yang tenang dan cepat — update otomatis dari Otakudesu, Kuramanime, dan AnimeKompi. Tanpa iklan, tanpa pop-up.
      </p>
      <div className="mx-auto flex max-w-xl justify-center"><SearchInput /></div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
        <span>Popular Searches:</span>
        {POPULAR.map((p) => (<Link key={p} href={`/search/${encodeURIComponent(p)}`} className="rounded-full bg-white/5 px-3 py-1 text-neutral-300 ring-1 ring-white/10 transition hover:bg-fuchsia-600 hover:text-white">{p}</Link>))}
      </div>
      <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {(stats || [
          { v: "3 Sumber", l: "Otakudesu · Kuramanime · AnimeKompi" },
          { v: "1080p", l: "HD Quality" },
          { v: "Tiap 15 mnt", l: "Auto-Update" },
          { v: "Gratis", l: "Tanpa Akun & Iklan" },
        ]).map((s) => (
          <div key={s.l} className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-4">
            <div className="text-lg font-extrabold text-white">{s.v}</div>
            <div className="mt-1 text-[11px] leading-snug text-neutral-400">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)
export default HeroSection
