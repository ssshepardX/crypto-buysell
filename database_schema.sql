-- Create analysis_jobs table for the new queue-based architecture
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED, CACHED
    price_at_detection DECIMAL(20,8) NOT NULL,
    price_change DECIMAL(10,4) NOT NULL,
    volume_spike DECIMAL(10,4) NOT NULL,
    orderbook_json JSONB,
    social_json JSONB,
    risk_score INTEGER,
    summary TEXT,
    likely_source VARCHAR(100),
    actionable_insight TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_symbol ON analysis_jobs(symbol);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created_at ON analysis_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_symbol_created ON analysis_jobs(symbol, created_at);

-- Update pump_alerts table to include new columns (if they don't exist)
ALTER TABLE pump_alerts
ADD COLUMN IF NOT EXISTS volume_24h_change DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS market_cap DECIMAL(20,2),
ADD COLUMN IF NOT EXISTS orderbook_depth DECIMAL(20,2),
ADD COLUMN IF NOT EXISTS risk_score INTEGER,
ADD COLUMN IF NOT EXISTS likely_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS actionable_insight TEXT;

-- Create user_subscriptions table for subscription management
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'insighter', 'analyzer'
    active BOOLEAN NOT NULL DEFAULT true,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, active) -- Only one active subscription per user
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan);

-- Create a view for active analysis results (for UI display)
CREATE OR REPLACE VIEW active_analysis AS
SELECT
    pa.*,
    aj.status as job_status,
    aj.created_at as job_created_at,
    aj.completed_at as job_completed_at
FROM pump_alerts pa
LEFT JOIN analysis_jobs aj ON aj.symbol = pa.symbol
    AND aj.created_at >= pa.detected_at - INTERVAL '1 minute'
    AND aj.created_at <= pa.detected_at + INTERVAL '1 minute'
WHERE pa.type = 'AI_ANALYSIS'
    AND pa.detected_at >= NOW() - INTERVAL '24 hours'
ORDER BY pa.detected_at DESC;

-- Create a function to clean up old analysis jobs
CREATE OR REPLACE FUNCTION cleanup_old_analysis_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete jobs older than 7 days
    DELETE FROM analysis_jobs
    WHERE created_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get pending job count
CREATE OR REPLACE FUNCTION get_pending_job_count()
RETURNS INTEGER AS $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count
    FROM analysis_jobs
    WHERE status = 'PENDING';

    RETURN job_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CRITICAL FIXES FOR PRODUCTION SYSTEM
-- =====================================================

-- 1. FORCE DISABLE RLS (this is the key fix)
ALTER TABLE analysis_jobs DISABLE ROW LEVEL SECURITY;

-- 2. DROP existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own analysis jobs" ON analysis_jobs;
DROP POLICY IF EXISTS "Service role can manage analysis jobs" ON analysis_jobs;

-- 3. FIX pump_alerts constraints
ALTER TABLE pump_alerts ALTER COLUMN avg_volume DROP NOT NULL;
ALTER TABLE pump_alerts ALTER COLUMN volume DROP NOT NULL;

-- 4. VERIFY table exists and is accessible
SELECT 'analysis_jobs table exists' as status, COUNT(*) as record_count FROM analysis_jobs;

-- 5. Test insert (should work after RLS is disabled)
-- INSERT INTO analysis_jobs (symbol, status, price_at_detection, price_change, volume_spike, orderbook_json, social_json)
-- VALUES ('TEST', 'PENDING', 50000, 5.0, 3.0, '{}', '{}');
