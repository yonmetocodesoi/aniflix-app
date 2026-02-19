"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MovieCard } from "./movie-card"
import type { TMDBMovie } from "@/lib/tmdb"

interface ContentRowProps {
  title: string
  items: TMDBMovie[]
  mediaType?: "movie" | "tv"
}

export function ContentRow({ title, items, mediaType }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeft(scrollLeft > 20)
    setShowRight(scrollLeft + clientWidth < scrollWidth - 20)
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  if (!items || items.length === 0) return null

  return (
    <section className="relative px-4 md:px-12 mb-10">
      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">{title}</h3>

      <div className="group relative -mx-4 md:-mx-12">
        {/* Left Arrow */}
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 w-10 md:w-14 bg-gradient-to-r from-background/90 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="h-8 w-8 text-foreground" />
          </button>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto carousel-scroll scrollbar-hide px-4 md:px-12"
        >
          {items.map((item) => (
            <MovieCard key={item.id} item={item} mediaType={mediaType} />
          ))}
        </div>

        {/* Right Arrow */}
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-20 w-10 md:w-14 bg-gradient-to-l from-background/90 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="h-8 w-8 text-foreground" />
          </button>
        )}
      </div>
    </section>
  )
}
