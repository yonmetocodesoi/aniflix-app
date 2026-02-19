import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url", { status: 400 });
  }

  // Build an intermediary HTML page that wraps the embed
  // This page lives on OUR domain, so we can inject scripts freely
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
  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
  sandbox="allow-scripts allow-same-origin allow-presentation allow-pointer-lock translate allow-forms allow-modals"
></iframe>

<script>
// === ADSHIELD ENGINE ===

// 1. Block ALL popup attempts from this intermediate page
window.open = function() {
  console.log('[AdShield] Popup blocked');
  return null;
};

// 2. Override window.open on any child window that tries
try {
  Object.defineProperty(window, 'open', {
    value: function() { return null; },
    writable: false,
    configurable: false
  });
} catch(e) {}

// 3. Prevent the page from navigating away (ad redirects)
window.addEventListener('beforeunload', function(e) {
  e.preventDefault();
  return '';
});

// 4. Block any new window creation via links
// 4. Block any new window creation via links
document.addEventListener('click', function(e) {
  var target = e.target;
  // Find the closest anchor tag
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
  }
  if (target && target.tagName === 'A') {
    var href = target.getAttribute('href');
    var tgt = target.getAttribute('target');
    var isAd = (tgt === '_blank' || (href && !href.startsWith('#') && !href.startsWith('javascript:')));
    
    if (isAd) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[AdShield] Link blocked & removed:', href);
      
      // If the link wraps content (like the whole player), unwrap it instead of removing
      // checks if it has significant children (more than just text or small icon)
      if (target.children.length > 0 && target.innerText.length > 0) {
          // It might be wrapping the player. Try to disable the link behavior only.
          target.removeAttribute('href');
          target.removeAttribute('target');
          target.removeAttribute('onclick');
          target.style.cursor = 'default';
          // Re-dispatch click to the original target? 
          // Complex. Ideally we just neuter the link for next time.
      } else {
          // Likely an empty overlay or icon. Remove it.
          target.remove();
      }
    }
  }
}, true);

// 5. Prevent form submissions to new windows
document.addEventListener('submit', function(e) {
  var form = e.target;
  if (form.target === '_blank') {
    e.preventDefault();
    console.log('[AdShield] Form submission blocked');
  }
}, true);

// 6. Monitor and remove any injected ad elements
// 6. Monitor and remove any injected ad elements
// Removed aggressive DOM cleaning to preventing breaking player controls
// (Some players use classes like 'overlay' for their own UI)

console.log('[AdShield] Engine loaded successfully');

console.log('[AdShield] Engine loaded successfully');
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
