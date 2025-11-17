-- Supabase RPC for atomically finding and locking a pending job
-- This prevents multiple workers from processing the same job.

CREATE OR REPLACE FUNCTION find_and_lock_job()
RETURNS TABLE (
  id uuid,
  symbol text,
  status text,
  price_at_detection decimal,
  price_change decimal,
  volume_spike decimal,
  orderbook_json text,
  social_json text,
  created_at timestamp with time zone
) AS $$
DECLARE
  job_id uuid;
BEGIN
  -- Find the oldest pending job and lock the row
  SELECT j.id INTO job_id
  FROM analysis_jobs AS j
  WHERE j.status = 'PENDING'
  ORDER BY j.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If a job was found, update its status to 'PROCESSING'
  IF job_id IS NOT NULL THEN
    UPDATE analysis_jobs
    SET status = 'PROCESSING'
    WHERE analysis_jobs.id = job_id;

    -- Return the locked and updated job
    RETURN QUERY
    SELECT
      j.id,
      j.symbol,
      j.status,
      j.price_at_detection,
      j.price_change,
      j.volume_spike,
      j.orderbook_json,
      j.social_json,
      j.created_at
    FROM analysis_jobs AS j
    WHERE j.id = job_id;
  ELSE
    -- No pending job found
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;
