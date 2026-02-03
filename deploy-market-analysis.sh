#!/bin/bash

# Supabase Edge Function Deployment - Market Analysis
# This script configures secrets and deploys the enhanced function

set -e

echo "🔐 Configuring Supabase Secrets..."
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Set secrets
echo "Setting CRYPTOPANIC_API_KEY..."
supabase secrets set CRYPTOPANIC_API_KEY=a39083cef050e7d4dfdfbdabfd7d2c15364a98f4

echo ""
echo "✅ Secrets configured!"
echo ""
echo "📋 Current secrets:"
supabase secrets list

echo ""
echo "🚀 Deploying market-analysis function..."
echo ""

# Deploy the function
cd /home/zoopx/zoopx/predifi/predifi-app
supabase functions deploy market-analysis

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎉 Enhanced Features:"
echo "  ✅ 4 AI models (Gemini Pro/Flash, Groq, Hugging Face)"
echo "  ✅ Structured consensus response"
echo "  ✅ Real-time crypto prices (Binance)"
echo "  ✅ OHLC candles (15min, 6 hours)"
echo "  ✅ Technical analysis summary"
echo "  ✅ News integration (CryptoPanic)"
echo "  ✅ Rate limiting (2 req/sec, 100/month for news)"
echo "  ✅ Robust error handling (graceful fallbacks)"
echo ""
echo "📝 Rate Limits:"
echo "  • CryptoPanic: 2 req/sec, 100 req/month (Developer plan)"
echo "  • News data is 24h delayed on free tier"
echo "  • Automatic rate limiting enforced"
echo ""
