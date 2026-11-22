"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, PlayCircleIcon } from '@heroicons/react/24/solid';
import Navigation from '@/app/components/Navigation';

function WatchPageSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white animate-pulse">
      <div className="container mx-auto px-4 py-8">
        <div className="aspect-video bg-slate-800 rounded-lg mb-4 shadow-lg"></div>
        <div className="bg-slate-900/50 p-4 rounded-lg mb-4">
          <div className="h-7 w-48 bg-slate-700 rounded mb-3"></div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-9 w-28 bg-slate-700 rounded-md"></div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg mb-8">
          <div className="h-8 w-3/4 bg-slate-700 rounded mb-2"></div>
          <div className="flex justify-between items-center">
            <div className="h-5 w-44 bg-slate-700 rounded"></div>
            <div className="flex space-x-2">
              <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
              <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorDisplay({ message, animeSlug }) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-2xl font-bold mb-4 text-red-500">Terjadi Kesalahan</h1>
      <p className="text-neutral-400 mb-8">{message}</p>
      <Link href="/" className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 transition">
        Kembali ke Beranda
      </Link>
    </div>
  );
}

const HISTORY_CACHE_KEY = 'juju-otaku-history';

function saveHistoryToCache(animeInfo, episodeSlug) {
  if (!animeInfo || !episodeSlug) return;

  try {
    const newItem = {
      id: episodeSlug, 
      userId: 'local-user',
      animeId: animeInfo.slug,
      episodeId: episodeSlug,
      title: animeInfo.title,
      image: animeInfo.image,
      watchedAt: new Date().toISOString(),
    };

    let currentHistory = [];
    try {
      currentHistory = JSON.parse(localStorage.getItem(HISTORY_CACHE_KEY)) || [];
      if (!Array.isArray(currentHistory)) {
        currentHistory = [];
      }
    } catch (e) {
      currentHistory = [];
    }

    const filteredHistory = currentHistory.filter(
      (item) => item.episodeId !== episodeSlug
    );

    const newHistory = [newItem, ...filteredHistory];
    const cappedHistory = newHistory.slice(0, 50);

    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(cappedHistory));
    console.log(`Riwayat disimpan ke cache (${episodeSlug}).`);

  } catch (error) {
    console.error("Gagal menyimpan riwayat ke cache:", error);
  }
}

function WatchPageContent({ params, episodeSlug }) {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();

  const [episodeTitle, setEpisodeTitle] = useState(null);
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStreamUrl, setCurrentStreamUrl] = useState(null);
  const [activeIdentifier, setActiveIdentifier] = useState(null);
  const [isSwitchingServer, setIsSwitchingServer] = useState(false);
  const [isValidPrev, setIsValidPrev] = useState(false);
  const [isValidNext, setIsValidNext] = useState(false);
  const [animeInfo, setAnimeInfo] = useState(null);

  const apiUrl = ''; // internal API

  useEffect(() => {
    if (!episodeSlug) {
      setError("Slug episode tidak valid.");
      setIsLoading(false);
      return;
    }

    async function fetchEpisodeData() {
      setIsLoading(true);
      setError(null);
      setCurrentStreamUrl(null);
      setServers([]);
      setEpisodeTitle(null);
      setIsValidPrev(false);
      setIsValidNext(false);

      try {
        const srcParam = searchParams.get('source') || 'otakudesu';
        const episodeResponse = await fetch(`/api/anime/episode?source=${encodeURIComponent(srcParam)}&slug=${encodeURIComponent(episodeSlug)}`);
        if (!episodeResponse.ok) {
          throw new Error(`Gagal mengambil data episode. Status: ${episodeResponse.status}`);
        }
        const episodeData = await episodeResponse.json();

        setEpisodeTitle(episodeData.title);
        setServers(episodeData.streams || []);

        const defaultStream = episodeData.streams?.[0];
        if (defaultStream) {
          setCurrentStreamUrl(defaultStream.url);
          setActiveIdentifier(defaultStream.url);
        } else {
          setCurrentStreamUrl(null);
        }

        const slugFromUrl = searchParams.get('slug');
        const titleFromUrl = searchParams.get('title');
        const imageFromUrl = searchParams.get('image');

        if (slugFromUrl && titleFromUrl && imageFromUrl) {
          const info = {
            slug: slugFromUrl,
            title: titleFromUrl,
            image: imageFromUrl
          };
          setAnimeInfo(info);
          sessionStorage.setItem('lastWatchedAnimeInfo', JSON.stringify(info));
        } else {
          const cachedInfo = sessionStorage.getItem('lastWatchedAnimeInfo');
          if (cachedInfo) {
            setAnimeInfo(JSON.parse(cachedInfo));
          } else {
            console.warn("Data riwayat (slug, title, image) tidak ditemukan di query params ATAU session storage.");
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEpisodeData();
  }, [episodeSlug, apiUrl, searchParams]);


  useEffect(() => {
    const useDatabase = process.env.NEXT_PUBLIC_USE_DATABASE === 'true';

    if (!animeInfo || !animeInfo.slug || !animeInfo.title || !animeInfo.image || sessionStatus === 'loading') {
      return;
    }

    if (useDatabase && session) {
      const saveHistoryToDb = async () => {
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              animeId: animeInfo.slug,
              episodeId: episodeSlug,
              title: animeInfo.title,
              image: animeInfo.image,
            }),
          });
          console.log(`Riwayat disimpan ke DB (${episodeSlug}).`);
        } catch (err) {
          console.error("Gagal menyimpan riwayat ke DB:", err);
        }
      };
      saveHistoryToDb();

    } else if (!useDatabase) {
      saveHistoryToCache(animeInfo, episodeSlug);
    }
  }, [animeInfo, session, sessionStatus, episodeSlug]);


  const handleServerClick = (server) => {
    setIsSwitchingServer(true);
    setActiveIdentifier(server.url);
    setCurrentStreamUrl(server.url);
    setTimeout(() => {
      setIsSwitchingServer(false);
    }, 300);
  };

  const { prevSlug, nextSlug } = useMemo(() => {
    if (!episodeSlug) return { prevSlug: null, nextSlug: null };
    const match = episodeSlug.match(/-episode-(\d+)$/);
    if (!match) return { prevSlug: null, nextSlug: null };
    const baseSlug = episodeSlug.substring(0, match.index);
    const currentEpisodeNumber = parseInt(match[1], 10);
    const nextSlug = `${baseSlug}-episode-${currentEpisodeNumber + 1}`;
    const prevSlug = currentEpisodeNumber > 1 ? `${baseSlug}-episode-${currentEpisodeNumber - 1}` : null;
    return { prevSlug, nextSlug };
  }, [episodeSlug]);

  useEffect(() => {
    const checkEpisodeExistence = async () => {
      if (prevSlug) {
        try {
          const response = { ok: false };
          setIsValidPrev(response.ok);
        } catch (error) {
          console.error("Error checking prevSlug:", error);
          setIsValidPrev(false);
        }
      } else {
        setIsValidPrev(false);
      }
      if (nextSlug) {
        try {
          const response = { ok: false };
          setIsValidNext(response.ok);
        } catch (error) {
          console.error("Error checking nextSlug:", error);
          setIsValidNext(false);
        }
      } else {
        setIsValidNext(false);
      }
    };
    if (prevSlug || nextSlug) checkEpisodeExistence();
  }, [prevSlug, nextSlug, apiUrl]);


  if (isLoading) {
    return <WatchPageSkeleton />;
  }
  if (error) {
    return <ErrorDisplay message={error} animeSlug={null} />;
  }
  if (!servers || servers.length === 0) {
    return <ErrorDisplay message="Data episode tidak ditemukan atau tidak ada server." animeSlug={null} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Navigation />

        <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden mb-4 shadow-lg">
          {isSwitchingServer && (
            <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 bg-neutral-900">
              <PlayCircleIcon className="h-16 w-16 text-pink-500 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold animate-pulse">Memuat Server...</h2>
            </div>
          )}
          {!isSwitchingServer && currentStreamUrl && (
            <iframe
              src={currentStreamUrl}
              allowFullScreen
              className="w-full h-full border-0"
              key={currentStreamUrl}
            ></iframe>
          )}
          {!isSwitchingServer && !currentStreamUrl && (
            <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 bg-neutral-900">
              <PlayCircleIcon className="h-16 w-16 text-pink-500 mb-4" />
              <h2 className="text-xl font-bold">Server Tidak Tersedia</h2>
              <p className="text-neutral-400">Silakan pilih server lain di bawah.</p>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-3">Pilih Server</h2>
          <div className='w-full h-full p-4 bg-neutral-800 rounded-lg shadow-xl'>
            <div className='mb-4 p-3 bg-neutral-700 rounded-md border border-yellow-500/50 flex items-start'>
              <p className='text-sm text-neutral-200 font-medium'>
                Server error? Coba beralih ke server lain di bawah ini.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 p-2 border-t border-neutral-700 pt-4">
              {servers.map((server) => (
                <button
                  key={server.url}
                  type="button"
                  onClick={() => handleServerClick(server)}
                  disabled={isSwitchingServer}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${activeIdentifier === server.url
                      ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 ring-2 ring-pink-400'
                      : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600 hover:text-white'
                    }`}
                >
                  {server.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 truncate">{episodeTitle || 'Memuat judul...'}</h1>
          <div className="flex justify-between items-center">
            <span className="text-sm text-fuchsia-400">JujuOtaku Internal API · Tanpa Iklan</span>
            <div className="flex space-x-2">
              
              {isValidPrev && (
                <Link href={`/watch/${prevSlug}`} className="bg-neutral-700 p-2 rounded-full hover:bg-pink-600 transition">
                  <ChevronLeftIcon className="h-6 w-6" />
                </Link>
              )}
              {isValidNext && (
                <Link href={`/watch/${nextSlug}`} className="bg-neutral-700 p-2 rounded-full hover:bg-pink-600 transition">
                <ChevronRightIcon className="h-6 w-6" />
              </Link>
            )}
            </div>
          </div>
        </div>

      </div>
    </div >
  );
}

export default function WatchPage({ params }) {
  const resolvedParams = React.use ? React.use(params) : params;
  const episodeSlugArray = resolvedParams?.episodeSlug;
  const episodeSlug = Array.isArray(episodeSlugArray) ? episodeSlugArray[episodeSlugArray.length - 1] : episodeSlugArray || null;

  return (
    <React.Suspense fallback={<WatchPageSkeleton />}>
      <WatchPageContent params={params} episodeSlug={episodeSlug} />
    </React.Suspense>
  );
}