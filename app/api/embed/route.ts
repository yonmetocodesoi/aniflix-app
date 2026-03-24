import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url", { status: 400 });
  }

  // Build a clean intermediary HTML page that wraps the embed
  // This helps with referrer policy and providing a clean container
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  iframe { width: 100%; height: 100%; border: none; }
</style>
</head>
<body>
<iframe
  id="player"
  src="${url.replace(/"/g, '&quot;')}"
  allowfullscreen
  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope; volume-control; clipboard-write; display-capture; geolocation; microphone; camera"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
</body>
</html>`;


  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  });
}
