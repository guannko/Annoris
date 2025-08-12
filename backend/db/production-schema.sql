-- Brain System Production Schema
-- Metrics, Pulse Logs, Version Management

-- Metrics table for performance tracking
CREATE TABLE IF NOT EXISTS brain_metrics(
  ts timestamptz DEFAULT now(),
  metric text NOT NULL,
  value double precision NOT NULL,
  tags jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX ON brain_metrics(metric, ts);

-- Pulse logs for impulse tracking
CREATE TABLE IF NOT EXISTS pulse_logs(
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pulse text NOT NULL,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  success boolean,
  duration_ms int,
  notes text
);
CREATE INDEX ON pulse_logs(pulse, started_at);

-- Version management with atomic switching
CREATE TABLE IF NOT EXISTS brain_index(
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  embedding_model text DEFAULT 'simple-hash',
  files_hash text,
  files_count int,
  active boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX ON brain_index(active, created_at);

-- Atomic version switch function
CREATE OR REPLACE FUNCTION switch_brain_version(new_version_id uuid)
RETURNS void AS $$
BEGIN
  -- Single transaction for atomic switch
  UPDATE brain_index SET active = false WHERE active = true;
  UPDATE brain_index SET active = true WHERE id = new_version_id;
END;
$$ LANGUAGE plpgsql;

-- Hit rate tracking
CREATE TABLE IF NOT EXISTS rag_hits(
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query text,
  hit boolean,
  relevance double precision,
  files_used text[],
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON rag_hits(created_at, hit);

-- Helper view for metrics
CREATE OR REPLACE VIEW brain_health AS
SELECT 
  (SELECT version FROM brain_index WHERE active = true) as active_version,
  (SELECT created_at FROM brain_index WHERE active = true) as version_created,
  EXTRACT(EPOCH FROM (now() - (SELECT created_at FROM brain_index WHERE active = true)))/60 as freshness_minutes,
  (SELECT COUNT(*) FROM brain_index) as total_versions,
  (SELECT AVG(CASE WHEN hit THEN 1 ELSE 0 END)::numeric(3,2) 
   FROM rag_hits 
   WHERE created_at > now() - interval '24 hours') as hit_rate_24h,
  (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY value) 
   FROM brain_metrics 
   WHERE metric = 'search_latency_ms' 
   AND ts > now() - interval '1 hour') as p95_latency_ms;