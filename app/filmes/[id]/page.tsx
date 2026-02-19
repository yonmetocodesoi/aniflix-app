import { getMovieDetails, IMAGE_BASE } from "@/lib/tmdb"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContentRow } from "@/components/content-row"
import { DetailHero } from "@/components/detail-hero"
import { CastRow } from "@/components/cast-row"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const movie = await getMovieDetails(parseInt(id))
  return {
    title: `${movie.title} - Yure Flix`,
    description: movie.overview,
    openGraph: {
      images: movie.backdrop_path ? [`${IMAGE_BASE}/w1280${movie.backdrop_path}`] : [],
    },
  }
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params
  const movie = await getMovieDetails(parseInt(id))

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <DetailHero
        title={movie.title || ""}
        overview={movie.overview}
        backdrop={movie.backdrop_path}
        poster={movie.poster_path}
        rating={movie.vote_average}
        year={(movie.release_date || "").slice(0, 4)}
        runtime={movie.runtime}
        genres={movie.genres}
        tagline={movie.tagline}
        watchUrl={`/assistir/filme/${movie.id}`}
        trailer={movie.videos?.results?.find((v) => v.type === "Trailer" && v.site === "YouTube")}
      />

      <div className="relative z-10 pb-10">
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <CastRow cast={movie.credits.cast.slice(0, 20)} />
        )}
        {movie.similar?.results && movie.similar.results.length > 0 && (
          <ContentRow title="Titulos Semelhantes" items={movie.similar.results} mediaType="movie" />
        )}
      </div>

      <Footer />
    </main>
  )
}
