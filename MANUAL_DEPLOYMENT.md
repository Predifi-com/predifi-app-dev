# 🚀 Manual Deployment Guide - Supabase Dashboard

## Overview
Since the project was created by Lovable AI, you'll need to access the Supabase dashboard directly to deploy.

---

## 📋 Project Information

- **Project ID**: `dkmhcfgkiqerrizqxsbg`
- **Project URL**: `https://dkmhcfgkiqerrizqxsbg.supabase.co`
- **Dashboard**: https://app.supabase.com/project/dkmhcfgkiqerrizqxsbg

---

## Step 1: Access Supabase Dashboard

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - You'll need to log in with the account that created the project
   - If you don't know the credentials, check with your team or Lovable AI

2. **Find Your Project**
   - Look for project: `dkmhcfgkiqerrizqxsbg`
   - Or navigate directly to: https://app.supabase.com/project/dkmhcfgkiqerrizqxsbg

---

## Step 2: Configure Secrets (CRITICAL)

1. **Navigate to Secrets**
   - Click: **Settings** (left sidebar)
   - Click: **Edge Functions**
   - Scroll down to: **Secrets** section

2. **Check Existing Secrets**
   - See if `GOOGLE_API_KEY` already exists
   - See if `GROQ_API_KEY` already exists

3. **Add Required Secrets**

### Add GROQ_API_KEY
```
Secret Name: GROQ_API_KEY
Secret Value: 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
```
Click "Add secret"

### Add CRYPTOPANIC_API_KEY
```
Secret Name: CRYPTOPANIC_API_KEY
Secret Value: a39083cef050e7d4dfdfbdabfd7d2c15364a98f4
```
Click "Add secret"

### Add/Verify GOOGLE_API_KEY (if not already present)
```
Secret Name: GOOGLE_API_KEY
Secret Value: [Your Gemini API key]
```
**Note**: If you don't have a Gemini API key, the function will still work with Groq and Hugging Face models only.

---

## Step 3: Deploy Function

### Method A: Re-deploy Existing Function (Recommended)

1. **Navigate to Edge Functions**
   - Click: **Edge Functions** (left sidebar)
   - Look for: `market-analysis` function

2. **Deploy Latest Version**
   - Click on the `market-analysis` function
   - Click: **"Deploy"** button (top right)
   - Or: **"Redeploy"** if it's already deployed
   - Wait for status: **"Deployed"** (green indicator)

### Method B: Upload New Code (if function doesn't exist)

1. **Create New Function**
   - Go to: **Edge Functions**
   - Click: **"Create function"**
   - Name: `market-analysis`

2. **Upload Code**
   - Method 1 (Recommended): Use the editor in dashboard
     - Copy entire contents of: `/home/zoopx/zoopx/predifi/predifi-app/supabase/functions/market-analysis/index.ts`
     - Paste into the editor
     - Click: **"Deploy"**
   
   - Method 2: Use CLI (if you can login)
     ```bash
     supabase login
     supabase link --project-ref dkmhcfgkiqerrizqxsbg
     supabase functions deploy market-analysis
     ```

---

## Step 4: Verify Deployment

1. **Check Function Status**
   - Status should show: **"Deployed"** with green indicator
   - Note the function URL: `https://dkmhcfgkiqerrizqxsbg.supabase.co/functions/v1/market-analysis`

2. **View Logs**
   - Click on the function
   - Click: **"Logs"** tab
   - Look for any deployment errors

3. **Test the Function**

Use this curl command:
```bash
curl -X POST https://dkmhcfgkiqerrizqxsbg.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWhjZmdraXFlcnJpenF4c2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTg4NjEsImV4cCI6MjA3NzU5NDg2MX0.h-dwszog4JSv1FmvOm8OLF4Wjq546dvr4QOJfHiJCvg" \
  -d '{
    "marketTitle": "Will Bitcoin reach $100k?",
    "yesPercentage": 65,
    "noPercentage": 35,
    "volume": "1500000"
  }'
```

**Expected Response:**
- ✅ `consensus` object with sentiment and confidence
- ✅ `modelAnalyses` array with 4 AI models (or 2-3 if Gemini not configured)
- ✅ `cryptoData` object with current price and 24 OHLC candles
- ✅ `cryptoData.technicalSummary` with trend analysis
- ✅ `news` array with 0-5 news items (may be empty if quota reached)

---

## Step 5: Monitor Function

1. **View Logs**
   - Dashboard → Edge Functions → market-analysis → Logs
   - Look for:
     - ✅ "Fetching Binance data for BTCUSDT..."
     - ✅ "Retrieved X news items from CryptoPanic"
     - ✅ "Analysis generated from 4 models"

2. **Check for Errors**
   - Any red error messages?
   - Check if secrets are properly configured
   - Verify external APIs are accessible

---

## 🔑 Secrets Summary

After configuration, you should have:

| Secret Name | Required? | Purpose | Value |
|------------|-----------|---------|-------|
| `GOOGLE_API_KEY` | Optional | Gemini Pro/Flash | Your key |
| `GROQ_API_KEY` | ✅ Required | Free LLM (Llama 3.1) | `gsk_TBAGll...` |
| `CRYPTOPANIC_API_KEY` | ✅ Required | News integration | `a39083ce...` |

**Note**: If `GOOGLE_API_KEY` is not set:
- Gemini Pro and Gemini Flash will not work
- Function will still work with 2 models (Groq + Hugging Face)
- Consensus algorithm will still work

---

## 🧪 Testing Checklist

After deployment, test with:

### Test 1: Bitcoin Market (Full Features)
```bash
curl -X POST https://dkmhcfgkiqerrizqxsbg.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWhjZmdraXFlcnJpenF4c2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTg4NjEsImV4cCI6MjA3NzU5NDg2MX0.h-dwszog4JSv1FmvOm8OLF4Wjq546dvr4QOJfHiJCvg" \
  -d '{"marketTitle":"Will Bitcoin reach $100k?","yesPercentage":65,"noPercentage":35,"volume":"1500000"}' \
  | jq '.'
```

**Verify:**
- [ ] 4 model analyses returned (or 2 if Gemini not configured)
- [ ] Consensus sentiment and confidence
- [ ] cryptoData with 24 OHLC candles
- [ ] technicalSummary present
- [ ] news array present (may be empty)

### Test 2: Check OHLC Candles
```bash
curl -X POST https://dkmhcfgkiqerrizqxsbg.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWhjZmdraXFlcnJpenF4c2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTg4NjEsImV4cCI6MjA3NzU5NDg2MX0.h-dwszog4JSv1FmvOm8OLF4Wjq546dvr4QOJfHiJCvg" \
  -d '{"marketTitle":"Will ETH reach $5000?","yesPercentage":42,"noPercentage":58,"volume":"850000"}' \
  | jq '.cryptoData.candles | length'
```

**Expected:** `24`

### Test 3: Non-Crypto Market (Fallback)
```bash
curl -X POST https://dkmhcfgkiqerrizqxsbg.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWhjZmdraXFlcnJpenF4c2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTg4NjEsImV4cCI6MjA3NzU5NDg2MX0.h-dwszog4JSv1FmvOm8OLF4Wjq546dvr4QOJfHiJCvg" \
  -d '{"marketTitle":"Will Trump win 2024?","yesPercentage":52,"noPercentage":48,"volume":"2500000"}' \
  | jq '.'
```

**Verify:**
- [ ] Models still work
- [ ] No cryptoData field (not a crypto market)
- [ ] No news field

---

## 🚨 Troubleshooting

### Can't access dashboard?
- Check with your team for Supabase login credentials
- If created by Lovable AI, check Lovable's project settings
- Contact Supabase support if needed

### Secrets not showing?
- Make sure you're in the correct project
- Check Settings → Edge Functions → Secrets section
- Refresh the page

### Function not deploying?
- Check for syntax errors in code
- View deployment logs in dashboard
- Verify all required secrets are set

### Function deployed but not working?
- Check function logs for errors
- Verify secrets are correctly formatted (no extra spaces)
- Test with curl command above

---

## 📞 Need Help?

If you can't access the dashboard:

1. **Check with your team** for Supabase credentials
2. **Contact Lovable AI** support (if they created the project)
3. **Create a new Supabase project** and migrate
4. **Use alternative deployment** method (see deploy-with-cli.sh)

---

## ✅ Success Indicators

After successful deployment:

- ✅ Function status: "Deployed" (green)
- ✅ Secrets configured (3 secrets minimum)
- ✅ Test returns valid JSON response
- ✅ Logs show successful API calls
- ✅ OHLC candles present in response
- ✅ Technical summary present
- ✅ No error messages in logs

---

**Once deployed, all enhancements will be live!** 🚀

See DEPLOYMENT_SUMMARY.md for complete feature documentation.
