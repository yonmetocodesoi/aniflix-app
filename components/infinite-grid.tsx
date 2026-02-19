"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import useSWRInfinite from "swr/infinite"
import { MovieCard } from "./movie-card"
import type { TMDBMovie, TMDBResponse } from "@/lib/tmdb"
import { Loader2 } from "lucide-react"

interface InfiniteGridProps {
  apiType: string
  genreId?: number
  query?: string
  mediaType?: "movie" | "tv"
  initialData?: TMDBMovie[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function InfiniteGrid({ apiType, genreId, query, mediaType, initialData }: InfiniteGridProps) {
  const [mounted, setMounted] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getKey = (pageIndex: number, previousPageData: TMDBResponse | null) => {
    if (previousPageData && previousPageData.page >= previousPageData.total_pages) return null
    const page = pageIndex + 1
    let url = `/api/tmdb?type=${apiType}&page=${page}`
    if (genreId) url += `&genre=${genreId}`
    if (query) url += `&query=${encodeURIComponent(query)}`
    return url
  }

  const { data, size, setSize, isValidating } = useSWRInfinite<TMDBResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  })

  const allItems = data ? data.flatMap((page) => page.results || []) : initialData || []
  const isEnd = data && data[data.length - 1]?.page >= data[data.length - 1]?.total_pages
  const isLoading = !data && !initialData

  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && !isValidating && !isEnd) {
        setSize((s) => s + 1)
      }
    },
    [isValidating, isEnd, setSize]
  )

  useEffect(() => {
    if (!mounted) return
    const observer = new IntersectionObserver(onIntersect, { rootMargin: "400px" })
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [onIntersect, mounted])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-secondary rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  // Deduplicate by id
  const seen = new Set<number>()
  const uniqueItems = allItems.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {uniqueItems.map((item) => (
          <MovieCard key={item.id} item={item} mediaType={mediaType} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="w-full flex justify-center py-8">
        {isValidating && (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        )}
        {isEnd && uniqueItems.length > 0 && (
          <p className="text-sm text-muted-foreground">Voce chegou ao fim da lista.</p>
        )}
      </div>
    </>
  )
}
