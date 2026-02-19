"use client"

import { useState } from "react"
import { InfiniteGrid } from "./infinite-grid"
import type { Genre } from "@/lib/tmdb"

interface BrowseContentProps {
  genres: Genre[]
  defaultApiType: string
  mediaType: "movie" | "tv"
}

export function BrowseContent({ genres, defaultApiType, mediaType }: BrowseContentProps) {
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined)

  return (
    <div>
      {/* Genre filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedGenre(undefined)}
          className={`text-xs px-4 py-2 rounded-full border transition-colors ${
            !selectedGenre
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
          }`}
        >
          Todos
        </button>
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => setSelectedGenre(genre.id === selectedGenre ? undefined : genre.id)}
            className={`text-xs px-4 py-2 rounded-full border transition-colors ${
              selectedGenre === genre.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {/* Grid with infinite scroll */}
      <InfiniteGrid
        key={`${defaultApiType}-${selectedGenre || "all"}`}
        apiType={defaultApiType}
        genreId={selectedGenre}
        mediaType={mediaType}
      />
    </div>
  )
}
