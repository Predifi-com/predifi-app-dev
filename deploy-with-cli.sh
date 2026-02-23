#!/bin/bash

# Supabase Deployment Script
# This script helps you deploy the enhanced market-analysis function

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║      🚀 MARKET ANALYSIS - SUPABASE DEPLOYMENT HELPER 🚀                  ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Project info from .env
PROJECT_ID="ohvsrapyopgbsissbvpv"
PROJECT_URL="https://ohvsrapyopgbsissbvpv.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odnNyYXB5b3BnYnNpc3NidnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkwODIsImV4cCI6MjA4NTcwNTA4Mn0.DE4tBkzdyfz4KTogozry3TrUzlQvn5lOngK9rZpheNs"

echo "📋 Project Information:"
echo "  Project ID: $PROJECT_ID"
echo "  Project URL: $PROJECT_URL"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "Installing Supabase CLI..."
    curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz -o /tmp/supabase.tar.gz
    tar -xzf /tmp/supabase.tar.gz -C /tmp
    sudo mv /tmp/supabase /usr/local/bin/
    echo "✅ Supabase CLI installed"
else
    echo "✅ Supabase CLI found: $(supabase --version)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                 🔐 AUTHENTICATION REQUIRED                                 "
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Since this project was created by Lovable AI, you need to:"
echo ""
echo "1. Go to: https://app.supabase.com"
echo "2. Log in with the account that created the project"
echo "3. Navigate to: Account → Access Tokens"
echo "4. Generate a new Personal Access Token"
echo "5. Copy the token (starts with 'sbp_')"
echo ""
echo "Then run:"
echo "  supabase login"
echo ""
echo "Or set the environment variable:"
echo "  export SUPABASE_ACCESS_TOKEN=sbp_your_token_here"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Have you completed the login? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please complete the login first, then run this script again."
    exit 1
fi

echo ""
echo "🔗 Linking to Supabase project..."
supabase link --project-ref $PROJECT_ID

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to link project. Please check your access token."
    echo ""
    echo "If you haven't logged in yet, run:"
    echo "  supabase login"
    echo ""
    echo "Or set the environment variable:"
    echo "  export SUPABASE_ACCESS_TOKEN=sbp_your_token_here"
    echo ""
    exit 1
fi

echo "✅ Project linked successfully!"
echo ""

# Check current secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                      🔐 CHECKING CURRENT SECRETS                           "
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Current secrets in Supabase:"
supabase secrets list

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                      🔑 REQUIRED SECRETS                                   "
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "The following secrets are required for the market-analysis function:"
echo ""
echo "  1. GOOGLE_API_KEY         - Gemini API (for LLM analysis)"
echo "  2. GROQ_API_KEY           - Groq API (for free LLM)"
echo "  3. CRYPTOPANIC_API_KEY    - CryptoPanic API (for news)"
echo ""
echo "Let's set them up..."
echo ""

# Set GROQ_API_KEY
echo "📝 Setting GROQ_API_KEY..."
supabase secrets set GROQ_API_KEY="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"
echo "✅ GROQ_API_KEY set"
echo ""

# Set CRYPTOPANIC_API_KEY
echo "📝 Setting CRYPTOPANIC_API_KEY..."
supabase secrets set CRYPTOPANIC_API_KEY="a39083cef050e7d4dfdfbdabfd7d2c15364a98f4"
echo "✅ CRYPTOPANIC_API_KEY set"
echo ""

# GOOGLE_API_KEY needs to be provided by user
echo "⚠️  GOOGLE_API_KEY (Gemini) - You need to provide this"
echo ""
read -p "Do you have a Google/Gemini API key? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter your GOOGLE_API_KEY: " GOOGLE_KEY
    if [ ! -z "$GOOGLE_KEY" ]; then
        supabase secrets set GOOGLE_API_KEY="$GOOGLE_KEY"
        echo "✅ GOOGLE_API_KEY set"
    fi
else
    echo ""
    echo "⚠️  WARNING: GOOGLE_API_KEY not set"
    echo "   - Gemini Pro and Gemini Flash models will not work"
    echo "   - Only Groq and Hugging Face models will be available"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                      📦 DEPLOYING FUNCTION                                 "
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Deploying market-analysis function..."
supabase functions deploy market-analysis

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "                      ✅ DEPLOYMENT SUCCESSFUL!                             "
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎉 Enhanced features now live:"
    echo "  ✅ 4 AI models (Gemini Pro/Flash, Groq, Hugging Face)"
    echo "  ✅ Structured consensus response"
    echo "  ✅ Real-time crypto prices (Binance)"
    echo "  ✅ OHLC candles (15min, 6 hours)"
    echo "  ✅ Technical analysis summary"
    echo "  ✅ News integration (CryptoPanic)"
    echo "  ✅ Rate limiting (2 req/sec, 100/month for news)"
    echo "  ✅ Robust error handling"
    echo ""
    echo "📝 Configured Secrets:"
    supabase secrets list
    echo ""
    echo "🧪 Test your deployment:"
    echo ""
    echo "curl -X POST $PROJECT_URL/functions/v1/market-analysis \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -H 'Authorization: Bearer $ANON_KEY' \\"
    echo "  -d '{\"marketTitle\":\"Will Bitcoin reach \$100k?\",\"yesPercentage\":65,\"noPercentage\":35,\"volume\":\"1500000\"}'"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "                      ❌ DEPLOYMENT FAILED                                  "
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "  1. Not authenticated: Run 'supabase login'"
    echo "  2. Project not linked: Run 'supabase link --project-ref $PROJECT_ID'"
    echo "  3. Missing secrets: Check 'supabase secrets list'"
    echo ""
    exit 1
fi
