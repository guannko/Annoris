-- extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- events (сырьё)
CREATE TABLE IF NOT EXISTS brain_events (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  source        TEXT NOT NULL,             -- chat|pulse|webhook|system
  bucket        TEXT NOT NULL,             -- left|right|eyes|ears
  ts            TIMESTAMPTZ NOT NULL DEFAULT now(),
  text          TEXT NOT NULL,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb
) PARTITION BY RANGE (ts);

-- суточные партиции (создаём процедуру + cron)
CREATE OR REPLACE FUNCTION make_daily_partition(day DATE)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  p_name TEXT := format('brain_events_%s', to_char(day,'YYYYMMDD'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_name) THEN
    EXECUTE format($f$
      CREATE TABLE %I PARTITION OF brain_events
      FOR VALUES FROM (%L) TO (%L);
    $f$, p_name, day::timestamptz, (day + 1)::timestamptz);
  END IF;
END$$;

SELECT make_daily_partition(current_date);
SELECT make_daily_partition(current_date + 1);

-- индексы
CREATE INDEX IF NOT EXISTS idx_brain_events_ts ON brain_events USING brin (ts);
CREATE INDEX IF NOT EXISTS idx_brain_events_trgm ON brain_events USING gin (text gin_trgm_ops);

-- embeddings
CREATE TABLE IF NOT EXISTS brain_embeddings (
  event_id   BIGINT PRIMARY KEY REFERENCES brain_events(id) ON DELETE CASCADE,
  model      TEXT NOT NULL,
  vec        VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brain_embeddings_vec ON brain_embeddings USING ivfflat (vec) WITH (lists=100);
CREATE INDEX IF NOT EXISTS idx_brain_embeddings_model ON brain_embeddings (model);

-- материализованный индекс (brain index)
CREATE TABLE IF NOT EXISTS brain_index (
  id         BIGSERIAL PRIMARY KEY,
  path       TEXT NOT NULL,
  title      TEXT NOT NULL,
  sha        TEXT NOT NULL,
  tags       TEXT[] NOT NULL DEFAULT '{}',
  summary    TEXT NOT NULL,
  vec        VECTOR(1536),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_brain_index_sha ON brain_index(sha);
CREATE INDEX IF NOT EXISTS idx_brain_index_vec ON brain_index USING ivfflat (vec) WITH (lists=100);
CREATE INDEX IF NOT EXISTS idx_brain_index_tags ON brain_index USING gin (tags);

-- метрики (минутная агрегация)
CREATE TABLE IF NOT EXISTS brain_metrics_1m (
  minute_ts   TIMESTAMPTZ PRIMARY KEY,
  req_count   INT NOT NULL,
  p50_ms      INT NOT NULL,
  p95_ms      INT NOT NULL,
  hit_rate    NUMERIC(5,2) NOT NULL,
  errors      INT NOT NULL
);