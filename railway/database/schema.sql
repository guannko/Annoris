-- Annoris API Database Schema
-- Phase 1: Core tables for session management
-- Target: Railway PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table: Core session data
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Project relationship
    project_id UUID,
    
    -- Session metadata
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(100) DEFAULT 'ACTIVE',
    session_type VARCHAR(100),
    
    -- Content (encrypted AES-256)
    content TEXT NOT NULL,
    content_preview TEXT, -- First 200 chars for search
    
    -- GitHub sync
    github_path VARCHAR(500),
    github_sha VARCHAR(40),
    github_synced_at TIMESTAMP,
    
    -- Data integrity
    checksum VARCHAR(32) NOT NULL, -- MD5 of content
    file_size_bytes INT,
    
    -- Search optimization
    tags TEXT[], -- Array of tags
    search_vector tsvector,
    
    -- Indexes
    CONSTRAINT chk_priority CHECK (priority IN ('EMERGENCY', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'ARCHIVE'))
);

-- Projects table: Project tracking
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Project info
    name VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(100) DEFAULT 'ACTIVE',
    priority INT DEFAULT 5,
    
    -- Revenue tracking
    target_revenue DECIMAL(10,2),
    current_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    description TEXT,
    repository_url VARCHAR(500),
    
    -- Stats
    session_count INT DEFAULT 0,
    last_session_at TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'))
);

-- Sync log: Track GitHub sync operations
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Sync details
    source VARCHAR(50) NOT NULL, -- 'webhook', 'cron', 'manual'
    direction VARCHAR(50) NOT NULL, -- 'github_to_railway', 'railway_to_github'
    
    -- Results
    files_synced INT DEFAULT 0,
    files_skipped INT DEFAULT 0,
    errors INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'SUCCESS',
    
    -- Details
    details JSONB,
    error_messages TEXT[],
    
    -- Performance
    duration_ms INT,
    
    CONSTRAINT chk_source CHECK (source IN ('webhook', 'cron', 'manual', 'api')),
    CONSTRAINT chk_direction CHECK (direction IN ('github_to_railway', 'railway_to_github', 'bidirectional')),
    CONSTRAINT chk_status CHECK (status IN ('SUCCESS', 'PARTIAL', 'FAILED'))
);

-- Performance indexes
CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_priority ON sessions(priority);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_github_path ON sessions(github_path);
CREATE INDEX idx_sessions_tags ON sessions USING GIN(tags);
CREATE INDEX idx_sessions_search ON sessions USING GIN(search_vector);

CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);

CREATE INDEX idx_sync_log_synced_at ON sync_log(synced_at DESC);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_source ON sync_log(source);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.content_preview, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_search_update
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Initial data: Insert key projects
INSERT INTO projects (name, status, priority, target_revenue, description) VALUES
    ('OffersPSP', 'ACTIVE', 1, 10000.00, 'Payment Service Provider - €10K/month target'),
    ('Brain Index GEO', 'ACTIVE', 2, 250000.00, 'AI visibility platform - €250K/year potential'),
    ('Make.com Products', 'ACTIVE', 3, 1600.00, 'Automation factory - $1.6K MRR'),
    ('Annoris', 'ACTIVE', 4, 200000.00, 'AI memory system - $200K/month potential')
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE sessions IS 'Core session storage with encryption and full-text search';
COMMENT ON TABLE projects IS 'Project tracking with revenue metrics';
COMMENT ON TABLE sync_log IS 'GitHub sync operation history';
COMMENT ON COLUMN sessions.content IS 'AES-256 encrypted session data';
COMMENT ON COLUMN sessions.search_vector IS 'Full-text search vector (auto-updated)';
COMMENT ON COLUMN sessions.tags IS 'Array of tags for filtering';
