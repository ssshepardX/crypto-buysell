-- Add the 'risk' column to the signals_log table
ALTER TABLE public.signals_log
ADD COLUMN risk TEXT;

-- Add a comment to explain the purpose of the new column
COMMENT ON COLUMN public.signals_log.risk IS 'The risk level of the trade signal (e.g., Low, Moderate, High), determined by AI analysis.';