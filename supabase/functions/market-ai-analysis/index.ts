import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { asset, timeframe, currentPrice, baseline, yesProb } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const timeframeContext = timeframe === "hourly"
      ? "Analyze the likely price movement in the next 5-15 minutes. Focus on short-term momentum, recent candle patterns, and intra-hour volatility."
      : "Analyze the likely price movement over the next few hours. Consider daily trends, support/resistance levels, volume patterns, and broader market sentiment.";

    const systemPrompt = `You are a concise crypto market analyst for a prediction market platform. 
You provide brief, actionable analysis in 2-3 short bullet points maximum.
Focus on probability assessment for whether the asset will close above or below a specific baseline price.
Use trading terminology but keep it accessible. Be direct and confident in your assessment.
Never give financial advice disclaimers in the analysis itself.
Format: Use bullet points (•). Keep total response under 100 words.`;

    const userPrompt = `${asset}/USD prediction market analysis:
- Current price: $${currentPrice}
- Baseline (rate to beat): $${baseline}
- Current YES probability: ${yesProb.toFixed(1)}%
- Timeframe: ${timeframe}

${timeframeContext}

Provide a brief analysis with:
• Current momentum direction and strength
• Key factor affecting near-term price
• Your probability assessment (bullish/bearish lean)`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Groq API error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Analysis unavailable.";

    return new Response(JSON.stringify({ analysis: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("market-ai-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
