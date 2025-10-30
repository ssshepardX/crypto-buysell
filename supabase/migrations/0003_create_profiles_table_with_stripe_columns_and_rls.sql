-- Create profiles table to store user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Stripe-related columns
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,
  PRIMARY KEY (id)
);

-- Add comments for clarity
COMMENT ON TABLE public.profiles IS 'Stores public user profile information and subscription status.';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stores the Stripe Customer ID for the user.';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stores the active Stripe Subscription ID for the user.';
COMMENT ON COLUMN public.profiles.stripe_subscription_status IS 'Stores the status of the user''s subscription (e.g., active, canceled).';

-- Enable Row Level Security (RLS) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- 1. Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);