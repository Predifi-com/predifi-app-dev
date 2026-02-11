import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://predifi.com";
const OG_IMAGE = `${BASE_URL}/og-image.png`;

function frameHtml(
  imageUrl: string,
  postUrl: string,
  buttons: { label: string; action: string; target?: string }[]
) {
  const buttonMeta = buttons
    .map((b, i) => {
      const idx = i + 1;
      let tags = `<meta property="fc:frame:button:${idx}" content="${b.label}" />`;
      tags += `\n    <meta property="fc:frame:button:${idx}:action" content="${b.action}" />`;
      if (b.target) {
        tags += `\n    <meta property="fc:frame:button:${idx}:target" content="${b.target}" />`;
      }
      return tags;
    })
    .join("\n    ");

  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:post_url" content="${postUrl}" />
    ${buttonMeta}
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:title" content="Predifi - Prediction Markets" />
</head>
<body></body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const postUrl = url.toString();

    // Parse the frame POST body
    let buttonIndex = 1;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        buttonIndex = body?.untrustedData?.buttonIndex || 1;
      } catch {
        // Default to button 1
      }
    }

    // Button 1 actions return updated frame with market info
    if (buttonIndex === 1) {
      const html = frameHtml(OG_IMAGE, postUrl, [
        { label: "🔥 Hot Markets", action: "post" },
        { label: "⚔️ Arena", action: "link", target: `${BASE_URL}/arena` },
        { label: "💰 Trade Now", action: "link", target: `${BASE_URL}/markets` },
        { label: "🏠 Home", action: "link", target: BASE_URL },
      ]);

      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // Default: redirect to site
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: BASE_URL },
    });
  } catch (error) {
    console.error("Frame handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
