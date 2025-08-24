-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add vector column to brain_events
ALTER TABLE brain_events 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector search
CREATE INDEX IF NOT EXISTS brain_events_embedding_idx 
ON brain_events USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create TRGM index for fuzzy search
CREATE INDEX IF NOT EXISTS brain_events_text_trgm_idx 
ON brain_events USING gin (text gin_trgm_ops);

-- Partition brain_events by day
ALTER TABLE brain_events 
SET (autovacuum_vacuum_scale_factor = 0.01);

-- Create partitions for next 30 days
DO $$
DECLARE
  i INTEGER;
  partition_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..30 LOOP
    partition_date := CURRENT_DATE + i;
    partition_name := 'brain_events_' || to_char(partition_date, 'YYYYMMDD');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF brain_events
      FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + 1
    );
  END LOOP;
END $$;

-- Create BRIN index for time-series queries
CREATE INDEX IF NOT EXISTS brain_events_created_at_brin 
ON brain_events USING brin (created_at);
