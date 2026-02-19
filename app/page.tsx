import { getTrending, getPopularMovies, getTopRatedMovies, getNowPlayingMovies, getPopularTV, getTopRatedTV, getOnTheAirTV } from "@/lib/tmdb"
import { Navbar } from "@/components/navbar"
import { HeroBanner } from "@/components/hero-banner"
import { ContentRow } from "@/components/content-row"
import { Footer } from "@/components/footer"

export default async function HomePage() {
  const [trending, popularMovies, topRatedMovies, nowPlaying, popularTV, topRatedTV, onTheAirTV] =
    await Promise.all([
      getTrending("all", "week"),
      getPopularMovies(),
      getTopRatedMovies(),
      getNowPlayingMovies(),
      getPopularTV(),
      getTopRatedTV(),
      getOnTheAirTV(),
    ])

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroBanner items={trending.results} />

      <div className="-mt-20 relative z-10 pb-10">
        {trending?.results?.length > 0 && <ContentRow title="Em Alta" items={trending.results} />}
        {popularMovies?.results?.length > 0 && <ContentRow title="Filmes Populares" items={popularMovies.results} mediaType="movie" />}
        {nowPlaying?.results?.length > 0 && <ContentRow title="Em Cartaz" items={nowPlaying.results} mediaType="movie" />}
        {topRatedMovies?.results?.length > 0 && <ContentRow title="Filmes Mais Bem Avaliados" items={topRatedMovies.results} mediaType="movie" />}
        {popularTV?.results?.length > 0 && <ContentRow title="Series Populares" items={popularTV.results} mediaType="tv" />}
        {onTheAirTV?.results?.length > 0 && <ContentRow title="Series no Ar" items={onTheAirTV.results} mediaType="tv" />}
        {topRatedTV?.results?.length > 0 && <ContentRow title="Series Mais Bem Avaliadas" items={topRatedTV.results} mediaType="tv" />}
      </div>

      <Footer />
    </main>
  )
}
