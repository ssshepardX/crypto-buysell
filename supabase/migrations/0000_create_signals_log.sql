-- Create the table to log all signals and track trade performance
CREATE TABLE public.signals_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('Buy', 'Sell')),
  status TEXT NOT NULL CHECK (status IN ('active', 'closed')),
  price NUMERIC NOT NULL,
  reasoning TEXT,
  tp1 NUMERIC,
  tp2 NUMERIC,
  tp3 NUMERIC,
  related_buy_id UUID REFERENCES public.signals_log(id),
  profit_loss_percent NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Add comments to explain columns
COMMENT ON COLUMN public.signals_log.status IS 'Status of the signal. A ''Buy'' signal is ''active'' until a corresponding ''Sell'' closes it.';
COMMENT ON COLUMN public.signals_log.tp1 IS 'Take Profit Level 1 (most likely).';
COMMENT ON COLUMN public.signals_log.tp2 IS 'Take Profit Level 2 (potential).';
COMMENT ON COLUMN public.signals_log.tp3 IS 'Take Profit Level 3 (optimistic/risky).';
COMMENT ON COLUMN public.signals_log.related_buy_id IS 'For ''Sell'' signals, this links back to the ''Buy'' signal it closes.';
COMMENT ON COLUMN public.signals_log.profit_loss_percent IS 'The calculated profit or loss percentage when a trade is closed.';

-- Enable RLS for security
ALTER TABLE public.signals_log ENABLE ROW LEVEL SECURITY;

-- Create policies:
-- 1. Allow public read access so the frontend can display history and win rate.
CREATE POLICY "Allow public read access to signals log" ON public.signals_log
FOR SELECT USING (true);

-- 2. Restrict write operations. In a real-world scenario, you'd likely want to
--    grant insert permissions only to a specific service role key used by the Edge Function.
--    For simplicity here, we'll allow authenticated users to insert, but this should be tightened.
CREATE POLICY "Allow authenticated users to insert signals" ON public.signals_log
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their signals" ON public.signals_log
FOR UPDATE TO authenticated USING (true);

-- Note: Deletion is typically handled via archival or soft deletes, so no DELETE policy for now.