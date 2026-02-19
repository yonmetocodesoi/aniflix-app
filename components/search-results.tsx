"use client"

import { InfiniteGrid } from "./infinite-grid"

interface SearchResultsProps {
  query: string
}

export function SearchResults({ query }: SearchResultsProps) {
  return (
    <InfiniteGrid
      key={`search-${query}`}
      apiType="search"
      query={query}
    />
  )
}
