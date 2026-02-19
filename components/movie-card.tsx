"use client"

import Link from "next/link"
import { Play, Star } from "lucide-react"
import { IMAGE_BASE, type TMDBMovie } from "@/lib/tmdb"

interface MovieCardProps {
  item: TMDBMovie
  mediaType?: "movie" | "tv"
}

export function MovieCard({ item, mediaType }: MovieCardProps) {
  const title = item.title || item.name || ""
  const resolvedType = mediaType || (item.media_type === "tv" || item.first_air_date ? "tv" : "movie")
  const detailUrl = resolvedType === "tv" ? `/series/${item.id}` : `/filmes/${item.id}`
  const year = (item.release_date || item.first_air_date || "").slice(0, 4)

  if (!item.poster_path) return null

  return (
    <Link
      href={detailUrl}
      className="poster-card relative flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px] rounded-sm overflow-hidden group/card"
    >
      <div className="aspect-[2/3] relative bg-secondary">
        <img
          src={`${IMAGE_BASE}/w342${item.poster_path}`}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/60 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
            <div className="bg-primary rounded-full p-3">
              <Play className="h-5 w-5 text-primary-foreground fill-current" />
            </div>
          </div>
        </div>

        {/* Rating badge */}
        {item.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-sm px-1.5 py-0.5">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium text-foreground">{item.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Title area */}
      <div className="py-2 px-0.5">
        <p className="text-xs md:text-sm font-medium text-foreground truncate">{title}</p>
        {year && <p className="text-xs text-muted-foreground">{year}</p>}
      </div>
    </Link>
  )
}
