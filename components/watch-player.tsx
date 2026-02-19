"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight, Tv, Server, Loader2, ShieldCheck, Maximize, RotateCcw } from "lucide-react"
import type { TMDBSeason } from "@/lib/tmdb"
import { WatchPartyControls } from "./watch-party-controls"

interface WatchPlayerProps {
  title: string
  cleanTitle?: string
  playerUrl: string | null
  backUrl: string
  mediaType: "movie" | "tv"
  tmdbId: number
  season?: number
  episode?: number
  totalSeasons?: number
  seasons?: TMDBSeason[]
}

export function WatchPlayer({
  title,
  cleanTitle,
  playerUrl,
  backUrl,
  mediaType,
  tmdbId,
  season = 1,
  episode = 1,
  seasons,
}: WatchPlayerProps) {
  const router = useRouter()
  const [activeServer, setActiveServer] = useState(0)
  const [scraperUrl, setScraperUrl] = useState<string | null>(null)
  const [isLoadingScraper, setIsLoadingScraper] = useState(false)
  const [scraperError, setScraperError] = useState<string | null>(null)
  const [imdbId, setImdbId] = useState<string | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const [playerKey, setPlayerKey] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false); // Locked when receiving sync

  // Buscar IMDB ID
  useEffect(() => {
    async function fetchImdbId() {
      try {
        const endpoint = mediaType === "movie" ? `/api/tmdb?type=movie&id=${tmdbId}` : `/api/tmdb?type=tv&id=${tmdbId}`
        const res = await fetch(endpoint)
        const data = await res.json()
        setImdbId(data.external_ids?.imdb_id || null)
      } catch (e) {
        console.error("Failed to fetch IMDB ID:", e)
      }
    }
    fetchImdbId()
  }, [tmdbId, mediaType])

  // Player options
  const playerOptions = mediaType === "movie"
    ? [
      { id: 0, name: "Dublado 1", url: (imdbId ? `https://playerflixapi.com/filme/${imdbId}` : null) || playerUrl },
      { id: 1, name: "Dublado 2", url: (imdbId ? `https://embed.warezcdn.link/filme/${imdbId}` : null) },
      { id: 2, name: "VidSrc (Legendado)", url: `https://vidsrc.xyz/embed/movie/${tmdbId}` },
      { id: 3, name: "Servidor 2", url: scraperUrl },
      { id: 4, name: "SuperEmbed", url: `https://multiembed.mov/?video_id=${imdbId}&tmdb_id=${tmdbId}` },
    ]
    : [
      { id: 0, name: "Dublado 1", url: `https://playerflixapi.com/serie/${tmdbId}/${season}/${episode}` },
      { id: 1, name: "VidSrc", url: `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}` },
      { id: 2, name: "Servidor 2", url: scraperUrl },
      { id: 3, name: "SuperEmbed", url: `https://multiembed.mov/?video_id=${imdbId}&tmdb_id=${tmdbId}&s=${season}&e=${episode}` },
    ];

  // Helper dedicated to get the URL for the current active server
  const getActiveUrl = () => {
    if (activeServer === 3 && mediaType === "movie") return scraperUrl;
    if (activeServer === 2 && mediaType === "tv") return scraperUrl;

    const option = playerOptions.find(p => p.id === activeServer);
    return option?.url || playerUrl;
  };

  const currentPlayerUrl = getActiveUrl();

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      playerContainerRef.current.requestFullscreen().catch((err) => console.error(err))
    }
  }

  const forceReload = () => {
    setPlayerKey((prev) => prev + 1)
  }

  const currentSeason = seasons?.find((s) => s.season_number === season)
  const totalEpisodes = currentSeason?.episode_count || 1

  // Block pop-ups from the parent page
  useEffect(() => {
    const originalOpen = window.open
    window.open = function (...args: any[]) {
      console.log("[AdShield] Pop-up bloqueado:", args[0])
      return null
    }
    return () => { window.open = originalOpen }
  }, [])

  useEffect(() => {
    const isScraper = (mediaType === "movie" && activeServer === 3) || (mediaType === "tv" && activeServer === 2);
    if (isScraper && !scraperUrl) {
      fetchScraperUrl()
    }
  }, [activeServer, title, season, episode])

  async function fetchScraperUrl() {
    setIsLoadingScraper(true)
    setScraperError(null)
    try {
      const queryTitle = cleanTitle || title.split(" - T")[0].split(" - ")[0].trim()

      const searchResp = await fetch(`/api/scraper?action=search&q=${encodeURIComponent(queryTitle)}`)
      const searchData = await searchResp.json()

      if (searchData && searchData.length > 0) {
        const bestMatch = searchData.find((item: any) =>
          item.type?.toLowerCase().includes(mediaType)
        ) || searchData[0]

        const sourcesResp = await fetch(
          `/api/scraper?action=sources&id=${bestMatch.id}&type=${bestMatch.type}&s=${season}&e=${episode}`
        )
        const sourcesData = await sourcesResp.json()

        if (sourcesData.link) {
          setScraperUrl(sourcesData.link)
        } else {
          setScraperError("Link não encontrado no Servidor 2")
        }
      } else {
        setScraperError("Conteúdo não encontrado no Servidor 2")
      }
    } catch (error) {
      console.error("Scraper error:", error)
      setScraperError("Erro ao carregar link do Servidor 2")
    } finally {
      setIsLoadingScraper(false)
    }
  }

  const goToEpisode = (s: number, e: number) => {
    setScraperUrl(null)
    setScraperError(null)
    router.push(`/assistir/serie/${tmdbId}?t=${s}&e=${e}`)
  }

  const hasPrev = episode > 1 || season > 1
  const hasNext =
    episode < totalEpisodes || (seasons && season < seasons[seasons.length - 1]?.season_number)

  const goPrev = () => {
    if (episode > 1) {
      goToEpisode(season, episode - 1)
    } else if (season > 1) {
      const prevSeason = seasons?.find((s) => s.season_number === season - 1)
      goToEpisode(season - 1, prevSeason?.episode_count || 1)
    }
  }

  const goNext = () => {
    if (episode < totalEpisodes) {
      goToEpisode(season, episode + 1)
    } else if (seasons && season < seasons[seasons.length - 1]?.season_number) {
      goToEpisode(season + 1, 1)
    }
  }

  useEffect(() => {
    // Comunicar conteúdo ativo para o rastreador
    (window as any).activeMedia = {
      title: title,
      type: mediaType,
      season: season,
      episode: episode,
      timestamp: Date.now()
    };
    return () => {
      (window as any).activeMedia = null;
    };
  }, [title, mediaType, season, episode]);

  // --- WATCH PARTY LOGIC ---
  const handleSyncAction = (action: any) => {
    console.log("Sync Action Received:", action);

    if (action.type === 'URL') {
      // Sync Server/Episode change
      setIsSyncing(true);
      const { server, season: s, episode: e } = action.payload;

      if (server !== undefined && server !== activeServer) {
        setActiveServer(server);
      }

      if (s !== undefined && e !== undefined) {
        // Only navigate if different
        if (s != season || e != episode) {
          goToEpisode(s, e);
        }
      }
      // Unblock syncing lock after short delay
      setTimeout(() => setIsSyncing(false), 2000);
    }

    if (action.type === 'PLAY') {
      // Try to create a play event for the iframe
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'PLAY' }, '*');
      }
    }

    if (action.type === 'PAUSE') {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'PAUSE' }, '*');
      }
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10 relative z-50">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backUrl}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm hidden md:inline">Voltar</span>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-base font-semibold text-white truncate max-w-[200px] md:max-w-md">
              {title}
            </h1>
            <div className="flex gap-2 mt-1.5 overflow-x-auto scrollbar-hide no-scrollbar pb-1">
              {playerOptions.map((player) => (
                <button
                  key={player.id}
                  onClick={() => player.url && setActiveServer(player.id)}
                  disabled={!player.url && !((activeServer === 3 && mediaType === "movie") || (activeServer === 2 && mediaType === "tv"))}
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full transition-all ${activeServer === player.id
                    ? 'bg-red-600 text-white'
                    : (player.url || ((player.id === 3 && mediaType === "movie") || (player.id === 2 && mediaType === "tv")))
                      ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                    }`}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Watch Party Controls */}
          <WatchPartyControls
            onSyncAction={handleSyncAction}
            currentMedia={{ server: activeServer, season, episode, title }}
          />

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* External Controls to bypass overlay */}
          <button
            onClick={forceReload}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full transition-colors"
            title="Recarregar Player (Liberar)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full transition-colors"
            title="Tela Cheia (Forçar)"
          >
            <Maximize className="h-4 w-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Ad Shield indicator */}
          <div className="flex items-center gap-1.5 bg-emerald-900/50 px-2 py-1 rounded text-[10px] text-emerald-400 border border-emerald-800/50">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">AdShield</span>
          </div>

          {mediaType === "tv" && (
            <div className="flex items-center gap-2 flex-shrink-0 bg-zinc-900/50 p-1 rounded-md border border-white/5">
              <Tv className="h-4 w-4 text-zinc-500" />
              <select
                value={season}
                onChange={(e) => goToEpisode(Number(e.target.value), 1)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
                aria-label="Temporada"
              >
                {seasons?.map((s) => (
                  <option key={s.season_number} value={s.season_number} className="bg-zinc-900">
                    T{s.season_number}
                  </option>
                ))}
              </select>
              <div className="w-px h-3 bg-white/10" />
              <select
                value={episode}
                onChange={(e) => goToEpisode(season, Number(e.target.value))}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
                aria-label="Episodio"
              >
                {Array.from({ length: totalEpisodes }, (_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-zinc-900">
                    E{i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Player */}
      <div ref={playerContainerRef} className="flex-1 relative bg-zinc-950 flex flex-col justify-center overflow-hidden">
        {isLoadingScraper && ((activeServer === 3 && mediaType === "movie") || (activeServer === 2 && mediaType === "tv")) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
              <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
            </div>
            <p className="text-zinc-400 text-sm animate-pulse font-medium">Sincronizando Servidor 2...</p>
          </div>
        ) : currentPlayerUrl ? (
          /* Player wrapped in /api/embed for ad blocking */
          <iframe
            key={playerKey}
            src={`/api/embed?url=${encodeURIComponent(currentPlayerUrl)}`}
            className="w-full h-full flex-1 aspect-video"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            title={title}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <div className="relative inline-block mb-6">
                <Server className="h-16 w-16 text-zinc-800 mx-auto" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-600/5 blur-3xl rounded-full" />
              </div>
              <p className="text-xl font-bold text-white mb-3">
                {scraperError || "Player não disponível"}
              </p>
              <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                {((activeServer === 3 && mediaType === "movie") || (activeServer === 2 && mediaType === "tv"))
                  ? "Este título não foi encontrado no Servidor 2. Tente os canais de áudio Dublado acima."
                  : "Não foi possível encontrar o conteúdo nos nossos servidores principais."}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setActiveServer(0)
                  }}
                  className="bg-red-600 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                >
                  Tentar Dublado 1
                </button>
                <Link
                  href={backUrl}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-4 underline underline-offset-4"
                >
                  Voltar para detalhes
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Episode navigation for series */}
      {mediaType === "tv" && (
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-black/90 backdrop-blur-md border-t border-white/10">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Anterior
          </button>

          <div className="hidden sm:flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-0.5">S0{season} • E{episode < 10 ? `0${episode}` : episode}</span>
            <span className="text-xs text-zinc-400 font-medium">Assistindo Agora</span>
          </div>

          <button
            onClick={goNext}
            disabled={!hasNext}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            Próximo
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
