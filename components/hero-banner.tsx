"use client"

import Link from "next/link"
import { Play, Info } from "lucide-react"
import { IMAGE_BASE, type TMDBMovie } from "@/lib/tmdb"
import { useState, useEffect, useCallback } from "react"

interface HeroBannerProps {
  items: TMDBMovie[]
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const featured = items.filter((i) => i.backdrop_path).slice(0, 5)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % featured.length)
  }, [featured.length])

  useEffect(() => {
    const timer = setInterval(next, 8000)
    return () => clearInterval(timer)
  }, [next])

  const item = featured[current]
  if (!item) return null

  const title = item.title || item.name || ""
  const mediaType = item.media_type === "tv" || item.first_air_date ? "serie" : "filme"
  const detailUrl = mediaType === "serie" ? `/series/${item.id}` : `/filmes/${item.id}`

  return (
    <section className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden">
      {/* Backdrop image using native img for reliability */}
      {item.backdrop_path && (
        <img
          src={`${IMAGE_BASE}/w1280${item.backdrop_path}`}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 hero-gradient-left" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 md:px-12 pb-28 md:pb-32">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4 text-balance drop-shadow-lg">
            {title}
          </h2>
          <p className="text-sm md:text-base text-foreground/80 line-clamp-3 mb-6 leading-relaxed max-w-lg drop-shadow-md">
            {item.overview}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/assistir/${mediaType}/${item.id}`}
              className="flex items-center gap-2 bg-foreground text-background font-semibold px-6 py-2.5 rounded-sm hover:bg-foreground/85 transition-colors text-sm md:text-base"
            >
              <Play className="h-5 w-5 fill-current" />
              Assistir
            </Link>
            <Link
              href={detailUrl}
              className="flex items-center gap-2 bg-muted/60 text-foreground font-semibold px-6 py-2.5 rounded-sm hover:bg-muted/80 transition-colors backdrop-blur-sm text-sm md:text-base"
            >
              <Info className="h-5 w-5" />
              Mais Informacoes
            </Link>
          </div>
        </div>
      </div>

      {/* Indicator dots */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {featured.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1 rounded-full transition-all duration-500 ${
              idx === current ? "w-8 bg-primary" : "w-3 bg-foreground/30 hover:bg-foreground/50"
            }`}
            aria-label={`Ir para slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
