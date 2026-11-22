export const dynamic = 'force-dynamic'
import Navigation from '@/app/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getDetail } from '@/lib/scrapers/index.js';

export default async function DetailAnimePage({ params, searchParams }) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const source = sp.source || 'otakudesu';
  const decodedSlug = decodeURIComponent(slug);
  let anime = null;
  // coba sumber yang diminta, lalu fallback ke sumber lain dengan slug sama
  for (const src of [source, 'otakudesu', 'kuramanime', 'animekompi']) {
    try { anime = await getDetail(src, decodedSlug); if (anime && anime.title) { anime.source = src; break; } } catch {}
  }
  if (!anime) {
    return (<div className="flex min-h-screen flex-col items-center justify-center bg-[#07070d] text-center text-white"><h1 className="text-2xl font-bold text-red-400">Anime Tidak Ditemukan</h1><p className="mt-2 text-neutral-400">Coba cari lewat pencarian — judul ini mungkin memakai slug berbeda di tiap sumber.</p><Navigation /></div>);
  }
  const q = new URLSearchParams({ slug: decodedSlug, title: anime.title || '', image: anime.poster || '', source: anime.source || source }).toString();
  const info = [["Japanese", anime.synonym], ["Producer", anime.author], ["Season", anime.season], ["Release", anime.aired], ["Studio", anime.studio], ["Status", anime.status], ["Type", anime.type], ["Duration", anime.duration], ["Rating", anime.rating], ["Sumber", anime.source]];
  return (
    <div className="relative min-h-screen bg-[#07070d] text-white">
      {anime.poster && (<div className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url(${anime.poster})` }}></div>)}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        <Navigation />
        <div className="mt-8 md:flex">
          <div className="mb-6 flex flex-shrink-0 justify-center md:mb-0 md:w-1/3 md:pr-8">
            {anime.poster && (<Image src={anime.poster} alt={anime.title} className="rounded-2xl object-cover shadow-2xl ring-1 ring-white/10" width={400} height={600} priority unoptimized />)}
          </div>
          <div className="md:w-2/3">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-cyan-300 ring-1 ring-white/10">Sumber: {anime.source}</span>
            <h1 className="mb-4 mt-3 text-3xl font-black sm:text-4xl">{anime.title}</h1>
            <div className="mb-6 flex flex-wrap gap-3">
              {anime.episodes?.[0] && (<Link href={`/watch/${encodeURIComponent(anime.episodes[0].slug)}?${q}`} className="rounded-full bg-fuchsia-600 px-6 py-2.5 font-semibold text-white transition hover:bg-fuchsia-500">▶ Watch Now</Link>)}
              {anime.url && (<a href={anime.url} target="_blank" rel="noreferrer" className="rounded-full bg-white/5 px-6 py-2.5 font-semibold text-neutral-200 ring-1 ring-white/10">Sumber Asli ↗</a>)}
            </div>
            <p className="leading-relaxed text-neutral-300">{anime.synopsis || 'Tidak ada sinopsis tersedia.'}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-neutral-400 md:grid-cols-3">
              {info.filter(([, v]) => v).map(([k, v]) => (<div key={k}><span className="block font-semibold text-white">{k}</span>{v}</div>))}
            </div>
            {anime.genres?.length > 0 && (<div className="mt-5"><span className="mb-2 block font-semibold text-white">Genres</span><div className="flex flex-wrap gap-2">{anime.genres.map((g) => (<Link key={g.slug} href={`/genre/${g.slug}`} className="rounded-full bg-white/5 px-3 py-1 text-sm text-neutral-200 ring-1 ring-white/10 hover:bg-fuchsia-600 hover:text-white">{g.name}</Link>))}</div></div>)}
          </div>
        </div>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        <h2 className="mb-4 text-2xl font-extrabold">Episodes ({anime.episodes?.length || 0})</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(anime.episodes || []).map((ep) => (
            <Link key={ep.slug} href={`/watch/${encodeURIComponent(ep.slug)}?${q}`} className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/5 transition hover:bg-fuchsia-600/20">
              <span className="text-sm font-semibold line-clamp-2">{ep.title}</span>
            </Link>
          ))}
        </div>
        {!anime.episodes?.length && (<p className="py-6 text-center text-neutral-400">Belum ada episode yang terbaca dari sumber ini.</p>)}
      </div>
    </div>
  );
}
