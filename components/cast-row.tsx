"use client"

import { IMAGE_BASE, type TMDBCast } from "@/lib/tmdb"
import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CastRowProps {
  cast: TMDBCast[]
}

export function CastRow({ cast }: CastRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.6
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <section className="px-4 md:px-12 mb-10">
      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Elenco</h3>
      <div className="group relative -mx-4 md:-mx-12">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-20 w-10 md:w-14 bg-gradient-to-r from-background/90 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Rolar elenco para esquerda"
        >
          <ChevronLeft className="h-8 w-8 text-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto carousel-scroll scrollbar-hide px-4 md:px-12"
        >
          {cast.map((person) => (
            <div
              key={person.id}
              className="flex-shrink-0 w-[110px] md:w-[130px] text-center"
            >
              <div className="aspect-square relative rounded-full overflow-hidden bg-secondary mb-2 mx-auto w-[90px] h-[90px] md:w-[110px] md:h-[110px]">
                {person.profile_path ? (
                  <img
                    src={`${IMAGE_BASE}/w185${person.profile_path}`}
                    alt={person.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-bold">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-foreground truncate">{person.name}</p>
              <p className="text-xs text-muted-foreground truncate">{person.character}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-20 w-10 md:w-14 bg-gradient-to-l from-background/90 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Rolar elenco para direita"
        >
          <ChevronRight className="h-8 w-8 text-foreground" />
        </button>
      </div>
    </section>
  )
}
