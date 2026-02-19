const TMDB_API_KEY = process.env.TMDB_API_KEY!
const BASE_URL = "https://api.themoviedb.org/3"
export const IMAGE_BASE = "https://image.tmdb.org/t/p"

export interface TMDBMovie {
  id: number
  title: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date?: string
  first_air_date?: string
  genre_ids: number[]
  media_type?: string
  imdb_id?: string
  popularity: number
}

export interface TMDBMovieDetail {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date?: string
  first_air_date?: string
  genres: { id: number; name: string }[]
  runtime?: number
  number_of_seasons?: number
  number_of_episodes?: number
  tagline?: string
  status: string
  imdb_id?: string
  seasons?: TMDBSeason[]
  videos?: { results: TMDBVideo[] }
  credits?: { cast: TMDBCast[] }
  similar?: { results: TMDBMovie[] }
  external_ids?: { imdb_id?: string }
}

export interface TMDBSeason {
  id: number
  name: string
  season_number: number
  episode_count: number
  poster_path: string | null
  overview: string
  air_date: string | null
}

export interface TMDBEpisode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path: string | null
  vote_average: number
  air_date: string | null
  runtime: number | null
}

export interface TMDBVideo {
  key: string
  site: string
  type: string
  name: string
}

export interface TMDBCast {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface TMDBResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export interface Genre {
  id: number
  name: string
}

async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`)
    url.searchParams.set("api_key", TMDB_API_KEY)
    url.searchParams.set("language", "pt-BR")
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) {
      console.warn(`TMDB API warning: ${res.status} for ${endpoint}`);
      return { results: [], genres: [], page: 1, total_pages: 0, total_results: 0 } as any;
    }
    return res.json()
  } catch (e) {
    console.error(`TMDB Fetch Error for ${endpoint}:`, e);
    return { results: [], genres: [], page: 1, total_pages: 0, total_results: 0 } as any;
  }
}

// Movies
export async function getTrending(mediaType: "movie" | "tv" | "all" = "all", timeWindow: "day" | "week" = "week") {
  return fetchTMDB<TMDBResponse>(`/trending/${mediaType}/${timeWindow}`)
}

export async function getPopularMovies(page = 1) {
  return fetchTMDB<TMDBResponse>(`/movie/popular`, { page: String(page) })
}

export async function getTopRatedMovies(page = 1) {
  return fetchTMDB<TMDBResponse>(`/movie/top_rated`, { page: String(page) })
}

export async function getNowPlayingMovies(page = 1) {
  return fetchTMDB<TMDBResponse>(`/movie/now_playing`, { page: String(page) })
}

export async function getUpcomingMovies(page = 1) {
  return fetchTMDB<TMDBResponse>(`/movie/upcoming`, { page: String(page) })
}

// TV Shows
export async function getPopularTV(page = 1) {
  return fetchTMDB<TMDBResponse>(`/tv/popular`, { page: String(page) })
}

export async function getTopRatedTV(page = 1) {
  return fetchTMDB<TMDBResponse>(`/tv/top_rated`, { page: String(page) })
}

export async function getOnTheAirTV(page = 1) {
  return fetchTMDB<TMDBResponse>(`/tv/on_the_air`, { page: String(page) })
}

// Details
export async function getMovieDetails(id: number) {
  return fetchTMDB<TMDBMovieDetail>(`/movie/${id}`, { append_to_response: "videos,credits,similar,external_ids" })
}

export async function getTVDetails(id: number) {
  return fetchTMDB<TMDBMovieDetail>(`/tv/${id}`, { append_to_response: "videos,credits,similar,external_ids" })
}

export async function getSeasonDetails(tvId: number, seasonNumber: number) {
  return fetchTMDB<{ episodes: TMDBEpisode[]; name: string; overview: string; season_number: number }>(`/tv/${tvId}/season/${seasonNumber}`)
}

// Search
export async function searchMulti(query: string, page = 1) {
  return fetchTMDB<TMDBResponse>(`/search/multi`, { query, page: String(page) })
}

// Genres
export async function getMovieGenres() {
  return fetchTMDB<{ genres: Genre[] }>(`/genre/movie/list`)
}

export async function getTVGenres() {
  return fetchTMDB<{ genres: Genre[] }>(`/genre/tv/list`)
}

// Discover
export async function discoverMovies(page = 1, genreId?: number) {
  const params: Record<string, string> = { page: String(page), sort_by: "popularity.desc" }
  if (genreId) params.with_genres = String(genreId)
  return fetchTMDB<TMDBResponse>(`/discover/movie`, params)
}

export async function discoverTV(page = 1, genreId?: number) {
  const params: Record<string, string> = { page: String(page), sort_by: "popularity.desc" }
  if (genreId) params.with_genres = String(genreId)
  return fetchTMDB<TMDBResponse>(`/discover/tv`, params)
}

// Anime - TMDB genre ID 16 = Animation, with origin_country=JP for Japanese anime
export async function getPopularAnime(page = 1) {
  return fetchTMDB<TMDBResponse>(`/discover/tv`, {
    page: String(page),
    sort_by: "popularity.desc",
    with_genres: "16",
    with_origin_country: "JP",
  })
}

export async function getTopRatedAnime(page = 1) {
  return fetchTMDB<TMDBResponse>(`/discover/tv`, {
    page: String(page),
    sort_by: "vote_average.desc",
    with_genres: "16",
    with_origin_country: "JP",
    "vote_count.gte": "200",
  })
}

export async function getTrendingAnime() {
  // We'll use discover with popularity and animation + JP filter for trending anime
  return fetchTMDB<TMDBResponse>(`/discover/tv`, {
    sort_by: "popularity.desc",
    with_genres: "16",
    with_origin_country: "JP",
    "first_air_date.gte": "2024-01-01",
  })
}

export async function discoverAnime(page = 1, genreId?: number) {
  const params: Record<string, string> = {
    page: String(page),
    sort_by: "popularity.desc",
    with_origin_country: "JP",
  }
  // If genreId is provided, combine Animation (16) with the other genre
  if (genreId) {
    params.with_genres = `16,${genreId}`
  } else {
    params.with_genres = "16"
  }
  return fetchTMDB<TMDBResponse>(`/discover/tv`, params)
}

// Anime-specific genres to filter within anime
export function getAnimeSubGenres(): Genre[] {
  return [
    { id: 10759, name: "Acao e Aventura" },
    { id: 16, name: "Animacao" },
    { id: 35, name: "Comedia" },
    { id: 18, name: "Drama" },
    { id: 10765, name: "Sci-Fi e Fantasia" },
    { id: 9648, name: "Misterio" },
    { id: 10751, name: "Familia" },
  ]
}
