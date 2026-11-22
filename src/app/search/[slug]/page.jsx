export const dynamic = 'force-dynamic'
import AnimeCard from '@/app/components/AnimeCard';
import SearchInput from '@/app/components/SearchInput';
import Navbar from '@/app/components/Navbar';
import { search } from '@/lib/scrapers/index.js';

export default async function SearchPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const keyword = decodeURIComponent(slug);
  const { animes, errors } = await search(keyword, sp.source || 'all').catch(() => ({ animes: [], errors: {} }));
  return (
    <div className="min-h-screen bg-[#07070d] text-white">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SearchInput />
        <h1 className="text-3xl font-extrabold">Hasil Pencarian: <span className="text-fuchsia-400">{keyword}</span></h1>
        <p className="mt-2 text-sm text-neutral-400">{animes.length} hasil dari Otakudesu · Kuramanime · AnimeKompi{errors && Object.keys(errors).length ? ` · sumber bermasalah: ${Object.keys(errors).join(', ')}` : ''}</p>
        {animes.length ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {animes.map((a) => (<AnimeCard key={`${a.source}-${a.slug}`} slug={a.slug} source={a.source} type={a.type} title={a.title} image={a.poster} episode={a.episode} rating={a.rating} />))}
          </div>
        ) : (<div className="py-16 text-center"><h2 className="text-2xl font-semibold text-neutral-400">Yah, tidak ketemu… coba kata kunci lain.</h2></div>)}
      </div>
    </div>
  );
}
