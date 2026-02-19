"use client"
import { useAuth } from "@/components/auth-provider";
import { WatchPlayer } from "@/components/watch-player";
import { getMovieDetails } from "@/lib/tmdb";
import { useEffect, useState, use } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Lock } from "lucide-react";

export default function WatchMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const { user, login, loading } = useAuth();
  const [movie, setMovie] = useState<any>(null);

  useEffect(() => {
    getMovieDetails(parseInt(id)).then(setMovie);
  }, [id]);

  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-20 pb-10">
        {movie && (
          <WatchPlayer
            title={movie.title || ""}
            cleanTitle={movie.title || ""}
            // O pulo do gato: Busca o ID no lugar certo (external_ids) ou usa TMDB como fallback
            playerUrl={
              (movie.external_ids?.imdb_id || movie.imdb_id)
                ? `https://playerflixapi.com/filme/${movie.external_ids?.imdb_id || movie.imdb_id}`
                : `https://vidsrc.to/embed/movie/${id}`
            }
            backUrl={`/filmes/${id}`}
            mediaType="movie"
            tmdbId={parseInt(id)}
          />
        )}
      </div>
      <Footer />
    </main>
  );
}
