import { NextRequest, NextResponse } from 'next/server';
import {
  getMovieDetails,
  getTVDetails,
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
  discoverMovies,
  discoverTV,
  discoverAnime,
  searchMulti,
  getPopularAnime,
  getTopRatedAnime,
  getTrendingAnime
} from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const page = parseInt(searchParams.get('page') || '1');
  const query = searchParams.get('query') || '';
  const genre = searchParams.get('genre') ? parseInt(searchParams.get('genre')!) : undefined;
  const mediaType = (searchParams.get('mediaType') as "movie" | "tv" | "all") || 'all';
  const timeWindow = (searchParams.get('timeWindow') as "day" | "week") || 'week';

  try {
    let data;

    // 1. Detalhes (se ID for fornecido)
    if (id) {
      if (type === 'movie') {
        data = await getMovieDetails(parseInt(id));
      } else if (type === 'tv') {
        data = await getTVDetails(parseInt(id));
      } else {
        return NextResponse.json({ error: 'Invalid type for ID' }, { status: 400 });
      }
    }
    // 2. Listagens e Buscas (se sÃ³ Type for fornecido)
    else {
      switch (type) {
        // Trending
        case 'trending':
          data = await getTrending(mediaType, timeWindow);
          break;

        // Movies
        case 'movies_popular':
          data = await getPopularMovies(page);
          break;
        case 'movies_top_rated':
          data = await getTopRatedMovies(page);
          break;
        case 'movies_now_playing':
          data = await getNowPlayingMovies(page);
          break;
        case 'movies_upcoming':
          data = await getUpcomingMovies(page);
          break;
        case 'discover_movies':
          data = await discoverMovies(page, genre);
          break;

        // TV
        case 'tv_popular':
          data = await getPopularTV(page);
          break;
        case 'tv_top_rated':
          data = await getTopRatedTV(page);
          break;
        case 'tv_on_the_air':
          data = await getOnTheAirTV(page);
          break;
        case 'discover_tv':
          data = await discoverTV(page, genre);
          break;

        // Anime
        case 'discover_anime':
          data = await discoverAnime(page, genre);
          break;
        case 'anime_popular':
          data = await getPopularAnime(page);
          break;
        case 'anime_top_rated':
          data = await getTopRatedAnime(page);
          break;
        case 'anime_trending':
          data = await getTrendingAnime();
          break;

        // Search
        case 'search':
          if (!query) return NextResponse.json({ results: [] });
          data = await searchMulti(query, page);
          break;

        default:
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('TMDB API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
