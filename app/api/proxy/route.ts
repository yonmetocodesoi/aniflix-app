import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    try {
        const resp = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                "Referer": "https://streameeeeee.site/",
                "Origin": "https://streameeeeee.site",
            },
        });

        if (!resp.ok) {
            return new NextResponse(`Upstream error: ${resp.status}`, { status: resp.statusText ? 502 : resp.status });
        }

        const contentType = resp.headers.get("content-type") || "application/octet-stream";
        const body = await resp.arrayBuffer();

        // For m3u8 playlists, we need to rewrite the segment URLs to also go through our proxy
        if (contentType.includes("mpegurl") || url.endsWith(".m3u8")) {
            let text = new TextDecoder().decode(body);
            const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

            // Rewrite relative URLs to absolute and proxy them
            text = text.replace(/^(?!#)(.+\.ts.*)$/gm, (match) => {
                const absoluteUrl = match.startsWith("http") ? match : baseUrl + match;
                return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            });

            // Also rewrite m3u8 references (for multi-quality playlists)
            text = text.replace(/^(?!#)(.+\.m3u8.*)$/gm, (match) => {
                const absoluteUrl = match.startsWith("http") ? match : baseUrl + match;
                return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            });

            return new NextResponse(text, {
                headers: {
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache",
                },
            });
        }

        return new NextResponse(body, {
            headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error: any) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
