-- Add calibration metrics to ai_model_accuracy table
ALTER TABLE public.ai_model_accuracy
ADD COLUMN IF NOT EXISTS brier_score numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS calibration_data jsonb DEFAULT '[]'::jsonb;

-- Add outcome_resolved flag and actual probability to predictions for scoring
ALTER TABLE public.ai_model_predictions
ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS actual_outcome_won boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS brier_contribution numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone DEFAULT NULL;

-- Create function to calculate Brier score contribution for a prediction
-- Brier score = (predicted_probability/100 - actual_binary)^2
CREATE OR REPLACE FUNCTION public.calculate_prediction_brier(
  p_predicted_probability numeric,
  p_actual_won boolean
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_predicted_decimal numeric;
  v_actual numeric;
BEGIN
  -- Convert percentage to decimal
  v_predicted_decimal := p_predicted_probability / 100.0;
  
  -- Actual: 1 if won, 0 if lost
  v_actual := CASE WHEN p_actual_won THEN 1.0 ELSE 0.0 END;
  
  -- Brier score contribution (lower is better, 0-1 range)
  RETURN POWER(v_predicted_decimal - v_actual, 2);
END;
$$;

-- Create function to recalculate model accuracy and calibration
CREATE OR REPLACE FUNCTION public.recalculate_model_calibration(p_model_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_predictions integer;
  v_correct_predictions integer;
  v_accuracy_rate numeric;
  v_avg_brier numeric;
  v_calibration_bins jsonb;
BEGIN
  -- Count resolved predictions for this model
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE actual_outcome_won = true),
    COALESCE(AVG(brier_contribution), 0)
  INTO v_total_predictions, v_correct_predictions, v_avg_brier
  FROM ai_model_predictions
  WHERE model_name = p_model_name AND is_resolved = true;

  IF v_total_predictions = 0 THEN
    RETURN;
  END IF;

  v_accuracy_rate := (v_correct_predictions::numeric / v_total_predictions::numeric) * 100;

  -- Build calibration bins (0-10%, 10-20%, etc.)
  -- Each bin: {range, predicted_avg, actual_avg, count}
  SELECT jsonb_agg(bin_data ORDER BY bin_start)
  INTO v_calibration_bins
  FROM (
    SELECT 
      (bin_start || '-' || (bin_start + 10) || '%') as range,
      bin_start,
      ROUND(AVG(predicted_probability)::numeric, 1) as predicted_avg,
      ROUND(AVG(CASE WHEN actual_outcome_won THEN 100.0 ELSE 0.0 END)::numeric, 1) as actual_avg,
      COUNT(*) as count
    FROM (
      SELECT 
        predicted_probability,
        actual_outcome_won,
        FLOOR(predicted_probability / 10) * 10 as bin_start
      FROM ai_model_predictions
      WHERE model_name = p_model_name AND is_resolved = true
    ) binned
    GROUP BY bin_start
  ) bin_data;

  -- Upsert into ai_model_accuracy
  INSERT INTO ai_model_accuracy (
    model_name, 
    model_provider, 
    total_predictions, 
    correct_predictions, 
    accuracy_rate, 
    brier_score,
    calibration_data,
    last_updated
  )
  SELECT 
    p_model_name,
    COALESCE((SELECT model_provider FROM ai_model_predictions WHERE model_name = p_model_name LIMIT 1), 'Unknown'),
    v_total_predictions,
    v_correct_predictions,
    v_accuracy_rate,
    v_avg_brier,
    v_calibration_bins,
    NOW()
  ON CONFLICT (model_name) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    correct_predictions = EXCLUDED.correct_predictions,
    accuracy_rate = EXCLUDED.accuracy_rate,
    brier_score = EXCLUDED.brier_score,
    calibration_data = EXCLUDED.calibration_data,
    last_updated = NOW();
END;
$$;

-- Create index for resolved predictions lookup
CREATE INDEX IF NOT EXISTS idx_predictions_resolved ON ai_model_predictions(model_name, is_resolved) WHERE is_resolved = true;

-- Add unique constraint on model_name for upsert
ALTER TABLE ai_model_accuracy DROP CONSTRAINT IF EXISTS ai_model_accuracy_model_name_key;
ALTER TABLE ai_model_accuracy ADD CONSTRAINT ai_model_accuracy_model_name_key UNIQUE (model_name);