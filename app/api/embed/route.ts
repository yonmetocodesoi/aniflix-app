import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url", { status: 400 });
  }

  // Build a clean intermediary HTML page that wraps the embed
  // Adicionamos TODAS as permissões de sandbox possíveis para evitar erros de bloqueio de recursos
  // E garantimos que o referrer policy seja respeitado para os servidores de vídeo funcionarem
  const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
<title>Player</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  iframe { 
    width: 100%; 
    height: 100%; 
    border: none;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
</head>
<body>
  <iframe
  id="player"
  src="${url.replace(/"/g, '&quot;')}"
  allowfullscreen
  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope; volume-control; clipboard-write; display-capture; geolocation; microphone; camera; midi; bluetooth; payment"
  sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation allow-storage-access-by-user-activation"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>

<script>
  // Dummy variable to fool some adblock detectors
  window.canRunAds = true;
  window.isAdblockActive = false;
  
  // Tentar notificar o pai caso o iframe mude
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
      window.parent.postMessage(event.data, '*');
    }
  });

  // Listener para controle remoto do player via postMessage
  window.addEventListener('message', (event) => {
    const iframe = document.getElementById('player');
    if (iframe && iframe.contentWindow) {
      if (event.data.type === 'PLAY' || event.data.type === 'PAUSE') {
        iframe.contentWindow.postMessage(event.data, '*');
      }
    }
  });
</script>
</body>
</html>`;


  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer-when-downgrade",
      "X-Frame-Options": "ALLOWALL",
    },
  });
}
