-- Create table to track AI model predictions for historical accuracy
CREATE TABLE public.ai_model_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  market_title TEXT NOT NULL,
  outcome_label TEXT, -- For multi-outcome markets (e.g., "Germany", "Spain")
  model_name TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  predicted_sentiment TEXT NOT NULL, -- 'bullish', 'bearish', 'neutral'
  predicted_probability NUMERIC(5,2), -- AI's estimated probability
  market_probability NUMERIC(5,2), -- Market probability at time of prediction
  confidence TEXT NOT NULL, -- 'high', 'medium', 'low'
  trust_score INTEGER NOT NULL, -- 0-100
  data_points_cited INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track actual outcomes when markets resolve
CREATE TABLE public.ai_model_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL UNIQUE,
  actual_outcome TEXT NOT NULL, -- 'yes', 'no', or specific outcome for multi-outcome
  resolved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create view for model accuracy stats
CREATE TABLE public.ai_model_accuracy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL UNIQUE,
  model_provider TEXT NOT NULL,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_trust_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_model_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_accuracy ENABLE ROW LEVEL SECURITY;

-- Allow public read access (predictions are public data)
CREATE POLICY "Allow public read access to predictions" 
ON public.ai_model_predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to outcomes" 
ON public.ai_model_outcomes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to accuracy" 
ON public.ai_model_accuracy 
FOR SELECT 
USING (true);

-- Allow insert from authenticated/service role for edge functions
CREATE POLICY "Allow service insert to predictions" 
ON public.ai_model_predictions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow service insert to outcomes" 
ON public.ai_model_outcomes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow service update to accuracy" 
ON public.ai_model_accuracy 
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_predictions_market_id ON public.ai_model_predictions(market_id);
CREATE INDEX idx_predictions_model ON public.ai_model_predictions(model_name);
CREATE INDEX idx_outcomes_market_id ON public.ai_model_outcomes(market_id);