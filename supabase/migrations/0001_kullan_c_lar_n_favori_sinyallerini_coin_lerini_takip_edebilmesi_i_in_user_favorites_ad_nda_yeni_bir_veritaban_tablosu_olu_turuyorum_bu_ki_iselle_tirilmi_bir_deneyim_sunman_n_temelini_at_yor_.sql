-- Create a table to store user's favorite symbols
CREATE TABLE public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol) -- Ensures a user can't favorite the same symbol twice
);

-- Add comments for clarity
COMMENT ON TABLE public.user_favorites IS 'Stores the crypto symbols that users have marked as favorites.';
COMMENT ON COLUMN public.user_favorites.user_id IS 'The user who favorited the symbol.';
COMMENT ON COLUMN public.user_favorites.symbol IS 'The crypto symbol (e.g., BTC, ETH).';

-- Enable Row Level Security is CRITICAL
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access their own favorites
CREATE POLICY "Users can view their own favorites"
  ON public.user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);