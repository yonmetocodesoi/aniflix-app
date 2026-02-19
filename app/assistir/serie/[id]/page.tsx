import { getTVDetails } from "@/lib/tmdb"
import { WatchPlayer } from "@/components/watch-player"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string; e?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const show = await getTVDetails(parseInt(id))
  return {
    title: `Assistir ${show.name} - Yure Flix`,
    description: show.overview,
  }
}

export default async function WatchSeriesPage({ params, searchParams }: Props) {
  const { id } = await params
  const { t, e } = await searchParams
  const show = await getTVDetails(parseInt(id))

  const season = parseInt(t || "1")
  const episode = parseInt(e || "1")
  const playerUrl = `https://playerflixapi.com/serie/${id}/${season}/${episode}`

  return (
    <WatchPlayer
      title={`${show.name || ""} - T${season}:E${episode}`}
      cleanTitle={show.name || ""}
      playerUrl={playerUrl}
      backUrl={`/series/${id}`}
      mediaType="tv"
      tmdbId={parseInt(id)}
      season={season}
      episode={episode}
      totalSeasons={show.number_of_seasons}
      seasons={show.seasons?.filter((s) => s.season_number > 0)}
    />
  )
}
