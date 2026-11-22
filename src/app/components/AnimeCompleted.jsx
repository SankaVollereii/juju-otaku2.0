import React from 'react'
import AnimeCard from './AnimeCard'
const AnimeCompleted = ({ api }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 my-8 mx-4 md:mx-auto max-w-7xl gap-4 md:gap-6 px-0 md:px-4">
    {(api || []).map((anime, index) => (
      <AnimeCard key={`${anime.source}-${anime.slug}`} title={anime.title} image={anime.poster} slug={anime.slug}
        type={anime.type} episode={anime.episode} rating={anime.rating} source={anime.source}
        statusOrDay={anime.release_day || anime.status} priority={index < 6} />
    ))}
  </div>
)
export default AnimeCompleted
