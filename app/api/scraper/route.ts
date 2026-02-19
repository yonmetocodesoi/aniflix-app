import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const INTERNAL_BASE_URL = "https://flixhq.to";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const query = searchParams.get("q");
    const id = searchParams.get("id");
    const mediaType = searchParams.get("type"); // movie, tv
    const season = searchParams.get("s");
    const episode = searchParams.get("e");

    const SCRAPER_URL = process.env.SCRAPER_URL;
    const CONSUMET_URL = process.env.CONSUMET_URL;

    try {
        if (action === "search") {
            if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

            // Try local Consumet API if available
            if (CONSUMET_URL) {
                try {
                    const resp = await fetch(`${CONSUMET_URL}/movies/flixhq/${encodeURIComponent(query)}`);
                    if (resp.ok) {
                        const data = await resp.json();
                        // Consumet format to our format
                        const results = (data.results || []).map((item: any) => ({
                            id: item.id,
                            title: item.title,
                            image: item.image,
                            type: item.type?.toLowerCase() || "movie"
                        }));
                        return NextResponse.json(results);
                    }
                } catch (e) {
                    console.error("Consumet API Error (Search):", e);
                }
            }

            // Try external scraper next
            if (SCRAPER_URL) {
                try {
                    const resp = await fetch(`${SCRAPER_URL}/search?q=${encodeURIComponent(query)}`);
                    if (resp.ok) return NextResponse.json(await resp.json());
                } catch (e) {
                    console.error("External Scraper Error (Search):", e);
                }
            }

            // Fallback to internal
            const results = await searchFlixHQ(query);
            return NextResponse.json(results);
        }

        if (action === "sources") {
            if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

            const cleanId = id.replace(/^\//, "");
            const isTv = mediaType?.toLowerCase().includes("tv") || cleanId.includes("/tv/");

            // Try local Consumet API if available
            if (CONSUMET_URL) {
                try {
                    const infoResp = await fetch(`${CONSUMET_URL}/movies/flixhq/info?id=${encodeURIComponent(cleanId)}`);
                    if (infoResp.ok) {
                        const infoData = await infoResp.json();
                        let episodeId = "";

                        if (isTv) {
                            const targetSeason = parseInt(season || "1");
                            const targetEpisode = parseInt(episode || "1");
                            // Try to find by season + number first
                            const ep = infoData.episodes?.find((e: any) =>
                                e.season === targetSeason && e.number === targetEpisode
                            );
                            if (ep) {
                                episodeId = ep.id;
                            } else {
                                // Fallback: use index (episode number - 1)
                                const idx = targetEpisode - 1;
                                if (infoData.episodes && infoData.episodes[idx]) {
                                    episodeId = infoData.episodes[idx].id;
                                }
                            }
                        } else {
                            episodeId = infoData.episodes?.[0]?.id;
                        }

                        if (episodeId) {
                            const watchResp = await fetch(`${CONSUMET_URL}/movies/flixhq/watch?episodeId=${encodeURIComponent(episodeId)}&mediaId=${encodeURIComponent(cleanId)}`);
                            if (watchResp.ok) {
                                const watchData = await watchResp.json();
                                if (watchData.sources && watchData.sources.length > 0) {
                                    // Use the Referer URL as embed link (streameeeeee.site embed player)
                                    const embedUrl = watchData.headers?.Referer;
                                    if (embedUrl) {
                                        return NextResponse.json({ link: embedUrl });
                                    }
                                    // Fallback: return first source URL directly
                                    const source = watchData.sources.find((s: any) => s.quality === "auto") || watchData.sources[0];
                                    return NextResponse.json({ link: source.url });
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Consumet API Error (Sources):", e);
                }
            }

            // If we have an external scraper
            if (SCRAPER_URL) {
                try {
                    const infoResp = await fetch(`${SCRAPER_URL}/info/${cleanId}`);
                    if (infoResp.ok) {
                        const infoData = await infoResp.json();
                        let targetEpisodeId = infoData.data_id;

                        const watchResp = await fetch(`${SCRAPER_URL}/watch/${targetEpisodeId}?is_tv=${isTv}`);
                        if (watchResp.ok) return NextResponse.json(await watchResp.json());
                    }
                } catch (e) {
                    console.error("External Scraper Error (Sources):", e);
                }
            }

            const sources = await getSources(id, isTv, season, episode);
            return NextResponse.json(sources);
        }

        return NextResponse.json({ message: "Scraper API" });
    } catch (error: any) {
        console.error("Scraper API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function searchFlixHQ(query: string) {
    const sanitized = query.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, "");
    const url = `${INTERNAL_BASE_URL}/search/${sanitized}`;

    const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const results: any[] = [];
    $(".film_list-wrap .flw-item").each((i, el) => {
        const $el = $(el);
        const $link = $el.find(".film-name a");
        const title = $link.attr("title");
        const href = $link.attr("href");
        const img = $el.find(".film-poster img").attr("data-src");

        if (title && href) {
            results.push({
                id: href.replace(/^\//, ""),
                title: title,
                image: img,
                type: href.includes("/tv/") ? "tv" : "movie"
            });
        }
    });
    return results;
}

async function getSources(mediaId: string, isTv: boolean, season?: string | null, episode?: string | null) {
    const url = `${INTERNAL_BASE_URL}/${mediaId}`;
    const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const dataId = $(".detail_page-watch").attr("data-id");
    if (!dataId) throw new Error("Could not find data-id");

    let episodeId = dataId;

    if (isTv) {
        const seasonsResp = await fetch(`${INTERNAL_BASE_URL}/ajax/v2/tv/seasons/${dataId}`, { headers: { "User-Agent": USER_AGENT } });
        const seasonsHtml = await seasonsResp.text();
        const $s = cheerio.load(seasonsHtml);

        const targetSeason = season || "1";
        let seasonId = "";
        $s(".dropdown-item").each((i, el) => {
            if ($(el).text().trim() === `Season ${targetSeason}`) seasonId = $(el).attr("data-id") || "";
        });

        if (!seasonId) seasonId = $s(".dropdown-item").first().attr("data-id") || "";

        if (seasonId) {
            const episodesResp = await fetch(`${INTERNAL_BASE_URL}/ajax/v2/tv/episodes/${seasonId}`, { headers: { "User-Agent": USER_AGENT } });
            const $e = cheerio.load(await episodesResp.text());
            const targetEpisode = episode || "1";
            $e(".nav-item a").each((i, el) => {
                const title = $(el).attr("title") || "";
                if (title.includes(`Eps ${targetEpisode}:`) || title.trim() === `Eps ${targetEpisode}`) episodeId = $(el).attr("data-id") || "";
            });
        }
    }

    const ajaxUrl = isTv ? `${INTERNAL_BASE_URL}/ajax/v2/episode/servers/${episodeId}` : `${INTERNAL_BASE_URL}/ajax/movie/episodes/${episodeId}`;
    const serversHtml = await (await fetch(ajaxUrl, { headers: { "User-Agent": USER_AGENT } })).text();
    const $srv = cheerio.load(serversHtml);
    const $firstServer = $srv(".nav-item a").first();
    const linkId = $firstServer.attr("data-linkid") || $firstServer.attr("data-id");

    if (!linkId) throw new Error("No server found");

    const sourcesUrl = isTv ? `${INTERNAL_BASE_URL}/ajax/v2/episode/sources/${linkId}` : `${INTERNAL_BASE_URL}/ajax/movie/episode/server/sources/${linkId}`;
    return await (await fetch(sourcesUrl, { headers: { "User-Agent": USER_AGENT } })).json();
}
