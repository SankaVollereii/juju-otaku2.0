import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

// Kartu anime bersih (ala Cihuynime): poster, badge episode/rating/sumber, judul.
const AnimeCard = ({ title, image, slug, episode, statusOrDay, type, rating, source, priority = false }) => {
  const href = slug ? `/detail/${encodeURIComponent(slug)}${source ? `?source=${source}` : ''}` : '#'
  return (
    <Link href={href} className="group will-change-transform">
      <div className="flex flex-col h-full">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-white/10 bg-neutral-800">
          {image ? (
            <Image src={image} alt={title} unoptimized fill priority={priority}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (<div className="flex h-full items-center justify-center text-4xl">🎬</div>)}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
          {type && (<div className="absolute top-2 right-2 z-10 rounded-md bg-fuchsia-600/90 px-2 py-0.5 text-[11px] font-bold text-white">{type}</div>)}
          {source && (<div className="absolute top-2 left-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold capitalize text-cyan-300">{source}</div>)}
          {episode && (<div className="absolute bottom-2 left-2 z-10 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">{String(episode).replace('Episode ', 'Eps ')}</div>)}
          {rating && (<div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-amber-300">★ {rating}</div>)}
        </div>
        <div className="mt-2 px-0.5">
          <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-fuchsia-400 transition-colors">{title}</h3>
          {statusOrDay && (<div className="mt-1 text-xs text-neutral-400">{String(statusOrDay).replace('✓', '')}</div>)}
        </div>
      </div>
    </Link>
  )
}
export default AnimeCard;
