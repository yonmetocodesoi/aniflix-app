"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Play } from "lucide-react"
import { IMAGE_BASE, type TMDBEpisode, type TMDBSeason } from "@/lib/tmdb"

interface SeasonSelectorProps {
  tvId: number
  seasons: TMDBSeason[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SeasonSelector({ tvId, seasons }: SeasonSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.season_number || 1)

  const { data, isLoading } = useSWR<{ episodes: TMDBEpisode[] }>(
    `/api/tmdb?type=season_details&tvId=${tvId}&season=${selectedSeason}`,
    fetcher
  )

  return (
    <section className="px-4 md:px-12 mb-10">
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <h3 className="text-lg md:text-xl font-semibold text-foreground">Episodios</h3>
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          className="bg-secondary border border-border text-foreground text-sm rounded-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Selecionar temporada"
        >
          {seasons.map((season) => (
            <option key={season.season_number} value={season.season_number}>
              Temporada {season.season_number}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-secondary rounded-md animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.episodes?.map((episode) => (
            <Link
              key={episode.id}
              href={`/assistir/serie/${tvId}?t=${episode.season_number}&e=${episode.episode_number}`}
              className="group flex gap-3 bg-card hover:bg-accent rounded-md overflow-hidden transition-colors border border-border/50"
            >
              <div className="relative w-[160px] flex-shrink-0 aspect-video bg-secondary">
                {episode.still_path ? (
                  <img
                    src={`${IMAGE_BASE}/w300${episode.still_path}`}
                    alt={episode.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Play className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-8 w-8 text-foreground fill-current" />
                  </div>
                </div>
              </div>
              <div className="py-2 pr-3 flex flex-col justify-center min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {episode.episode_number}. {episode.name}
                </p>
                {episode.runtime && (
                  <p className="text-xs text-muted-foreground mt-0.5">{episode.runtime} min</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {episode.overview || "Sem descricao disponivel."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
