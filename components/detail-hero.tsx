"use client"

import Link from "next/link"
import { Play, Star, Clock, Calendar, Tv, Film } from "lucide-react"
import { IMAGE_BASE, type TMDBVideo } from "@/lib/tmdb"
import { useState } from "react"

interface DetailHeroProps {
  title: string
  overview: string
  backdrop: string | null
  poster: string | null
  rating: number
  year: string
  runtime?: number
  seasons?: number
  genres: { id: number; name: string }[]
  tagline?: string
  watchUrl: string
  trailer?: TMDBVideo
  isSeries?: boolean
}

export function DetailHero({
  title,
  overview,
  backdrop,
  poster,
  rating,
  year,
  runtime,
  seasons,
  genres,
  tagline,
  watchUrl,
  trailer,
  isSeries,
}: DetailHeroProps) {
  const [showTrailer, setShowTrailer] = useState(false)

  return (
    <section className="relative w-full min-h-[80vh] md:min-h-[85vh]">
      {/* Backdrop */}
      {backdrop && (
        <div className="absolute inset-0">
          <img
            src={`${IMAGE_BASE}/w1280${backdrop}`}
            alt={title}
            className="w-full h-full object-cover object-top"
            loading="eager"
          />
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 hero-gradient-left" />
        </div>
      )}

      {/* Content */}
      <div className="relative pt-24 md:pt-32 pb-16 px-4 md:px-12">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 max-w-7xl mx-auto">
          {/* Poster */}
          {poster && (
            <div className="hidden md:block flex-shrink-0 w-[260px] lg:w-[300px]">
              <div className="aspect-[2/3] relative rounded-md overflow-hidden shadow-2xl shadow-black/50">
                <img
                  src={`${IMAGE_BASE}/w500${poster}`}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex flex-col justify-end flex-1 max-w-2xl">
            {tagline && (
              <p className="text-sm text-primary font-medium uppercase tracking-wider mb-2">{tagline}</p>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4 text-balance drop-shadow-lg">
              {title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
              {rating > 0 && (
                <span className="flex items-center gap-1 text-foreground">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  {rating.toFixed(1)}
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {year}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.floor(runtime / 60)}h {runtime % 60}min
                </span>
              )}
              {seasons && (
                <span className="flex items-center gap-1">
                  <Tv className="h-4 w-4" />
                  {seasons} {seasons === 1 ? "temporada" : "temporadas"}
                </span>
              )}
              {!isSeries && (
                <span className="flex items-center gap-1">
                  <Film className="h-4 w-4" />
                  Filme
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {genres.map((genre) => (
                <span
                  key={genre.id}
                  className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Overview */}
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed mb-6 line-clamp-5">
              {overview}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={watchUrl}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-7 py-3 rounded-sm hover:bg-primary/90 transition-colors text-sm md:text-base"
              >
                <Play className="h-5 w-5 fill-current" />
                Assistir Agora
              </Link>
              {trailer && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold px-7 py-3 rounded-sm hover:bg-accent transition-colors text-sm md:text-base"
                >
                  <Play className="h-5 w-5" />
                  Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title={trailer.name}
              className="w-full h-full rounded-md"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-foreground hover:text-primary transition-colors text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
