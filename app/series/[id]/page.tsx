import { getTVDetails, IMAGE_BASE } from "@/lib/tmdb"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContentRow } from "@/components/content-row"
import { DetailHero } from "@/components/detail-hero"
import { CastRow } from "@/components/cast-row"
import { SeasonSelector } from "@/components/season-selector"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const show = await getTVDetails(parseInt(id))
  return {
    title: `${show.name} - Yure Flix`,
    description: show.overview,
    openGraph: {
      images: show.backdrop_path ? [`${IMAGE_BASE}/w1280${show.backdrop_path}`] : [],
    },
  }
}

export default async function SeriesDetailPage({ params }: Props) {
  const { id } = await params
  const show = await getTVDetails(parseInt(id))

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <DetailHero
        title={show.name || ""}
        overview={show.overview}
        backdrop={show.backdrop_path}
        poster={show.poster_path}
        rating={show.vote_average}
        year={(show.first_air_date || "").slice(0, 4)}
        seasons={show.number_of_seasons}
        genres={show.genres}
        tagline={show.tagline}
        watchUrl={`/assistir/serie/${show.id}?t=1&e=1`}
        trailer={show.videos?.results?.find((v) => v.type === "Trailer" && v.site === "YouTube")}
        isSeries
      />

      <div className="relative z-10 pb-10">
        {show.seasons && show.seasons.length > 0 && (
          <SeasonSelector
            tvId={parseInt(id)}
            seasons={show.seasons.filter((s) => s.season_number > 0)}
          />
        )}
        {show.credits?.cast && show.credits.cast.length > 0 && (
          <CastRow cast={show.credits.cast.slice(0, 20)} />
        )}
        {show.similar?.results && show.similar.results.length > 0 && (
          <ContentRow title="Titulos Semelhantes" items={show.similar.results} mediaType="tv" />
        )}
      </div>

      <Footer />
    </main>
  )
}
