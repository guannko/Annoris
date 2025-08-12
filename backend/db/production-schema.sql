-- Brain System Production Schema with Optimizations
-- Metrics, Pulse Logs, Version Management, Performance Indexes

-- Metrics table for performance tracking
CREATE TABLE IF NOT EXISTS brain_metrics(
  ts timestamptz DEFAULT now(),
  metric text NOT NULL,
  value double precision NOT NULL,
  tags jsonb DEFAULT '{}'::jsonb
);

-- OPTIMIZED INDEXES for metrics
CREATE INDEX IF NOT EXISTS idx_metrics_metric_ts ON brain_metrics(metric, ts);
CREATE INDEX IF NOT EXISTS idx_metrics_tags_route ON brain_metrics((tags->>'route')) WHERE tags->>'route' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_tags_status ON brain_metrics((tags->>'status')) WHERE tags->>'status' IS NOT NULL;

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

-- OPTIMIZED INDEXES for pulse logs
CREATE INDEX IF NOT EXISTS idx_pulse_logs_pulse ON pulse_logs(pulse, started_at);
CREATE INDEX IF NOT EXISTS idx_pulse_logs_started_at ON pulse_logs(started_at DESC);

-- Version management with atomic switching
CREATE TABLE IF NOT EXISTS brain_index(
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  embedding_model text DEFAULT 'simple-hash',
  files_hash text,
  files_count int,
  active boolean DEFAULT false,
  keep boolean DEFAULT false, -- For retention policy
  metadata jsonb DEFAULT '{}'::jsonb
);

-- OPTIMIZED INDEXES for versions
CREATE INDEX IF NOT EXISTS idx_brain_index_active ON brain_index(active, created_at);
CREATE INDEX IF NOT EXISTS idx_brain_index_keep ON brain_index(keep, created_at);

-- Atomic version switch function with locking
CREATE OR REPLACE FUNCTION switch_brain_version(new_version_id uuid)
RETURNS void AS $$
BEGIN
  -- Lock the table to prevent race conditions
  LOCK TABLE brain_index IN EXCLUSIVE MODE;
  
  -- Single transaction for atomic switch
  UPDATE brain_index SET active = false WHERE active = true;
  UPDATE brain_index SET active = true WHERE id = new_version_id;
  
  -- Log the switch
  INSERT INTO brain_metrics (metric, value, tags)
  VALUES ('version_switch', 1, jsonb_build_object('version_id', new_version_id));
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

-- OPTIMIZED INDEXES for RAG hits
CREATE INDEX IF NOT EXISTS idx_rag_hits_created_hit ON rag_hits(created_at DESC, hit);
CREATE INDEX IF NOT EXISTS idx_rag_hits_relevance ON rag_hits(relevance DESC) WHERE relevance IS NOT NULL;

-- Aggregated metrics table (for performance)
CREATE TABLE IF NOT EXISTS brain_metrics_1m(
  window_start timestamptz NOT NULL,
  metric text NOT NULL,
  p50 double precision,
  p95 double precision,
  p99 double precision,
  count bigint,
  PRIMARY KEY (window_start, metric)
);

CREATE INDEX IF NOT EXISTS idx_metrics_1m_window ON brain_metrics_1m(window_start DESC);

-- Helper view for metrics (optimized)
CREATE OR REPLACE VIEW brain_health AS
SELECT 
  (SELECT version FROM brain_index WHERE active = true LIMIT 1) as active_version,
  (SELECT created_at FROM brain_index WHERE active = true LIMIT 1) as version_created,
  EXTRACT(EPOCH FROM (now() - (SELECT created_at FROM brain_index WHERE active = true LIMIT 1)))/60 as freshness_minutes,
  (SELECT COUNT(*) FROM brain_index WHERE keep = true OR created_at > now() - interval '7 days') as total_versions,
  (SELECT AVG(CASE WHEN hit THEN 1 ELSE 0 END)::numeric(3,2) 
   FROM rag_hits 
   WHERE created_at > now() - interval '24 hours') as hit_rate_24h,
  (SELECT p95 FROM brain_metrics_1m 
   WHERE metric = 'search_latency_ms' 
   AND window_start > now() - interval '1 hour'
   ORDER BY window_start DESC 
   LIMIT 1) as p95_latency_ms;

-- Retention policy function
CREATE OR REPLACE FUNCTION cleanup_old_versions(keep_last int DEFAULT 10)
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  WITH versions_to_delete AS (
    SELECT id FROM brain_index
    WHERE keep = false 
    AND active = false
    AND created_at < now() - interval '7 days'
    ORDER BY created_at DESC
    OFFSET keep_last
  )
  DELETE FROM brain_index 
  WHERE id IN (SELECT id FROM versions_to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Aggregate metrics function (run every minute)
CREATE OR REPLACE FUNCTION aggregate_metrics_1m()
RETURNS void AS $$
BEGIN
  INSERT INTO brain_metrics_1m (window_start, metric, p50, p95, p99, count)
  SELECT 
    date_trunc('minute', ts) as window_start,
    metric,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY value) as p50,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY value) as p95,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY value) as p99,
    COUNT(*) as count
  FROM brain_metrics
  WHERE ts >= date_trunc('minute', now() - interval '1 minute')
    AND ts < date_trunc('minute', now())
  GROUP BY date_trunc('minute', ts), metric
  ON CONFLICT (window_start, metric) DO UPDATE
  SET p50 = EXCLUDED.p50,
      p95 = EXCLUDED.p95,
      p99 = EXCLUDED.p99,
      count = EXCLUDED.count;
  
  -- Clean up old raw metrics (keep 24 hours)
  DELETE FROM brain_metrics WHERE ts < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;