-- 🗄️ ANNORIS API DATABASE SCHEMA
-- Version: 1.0
-- Date: 2025-10-20
-- Purpose: Hybrid storage system (GitHub master + Railway cache)

-- ====================================
-- TABLE: sessions
-- Purpose: Store AI sessions (last 30 days hot cache)
-- ====================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    project_id UUID,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(100) NOT NULL DEFAULT 'ACTIVE',
    content TEXT NOT NULL, -- Encrypted with AES-256
    github_path VARCHAR(500) NOT NULL,
    github_sha VARCHAR(40) NOT NULL,
    checksum VARCHAR(32) NOT NULL, -- MD5 hash for validation
    last_synced TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_github_path ON sessions(github_path);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- ====================================
-- TABLE: projects
-- Purpose: Project metadata and revenue tracking
-- ====================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(100) NOT NULL DEFAULT 'ACTIVE',
    priority INT NOT NULL DEFAULT 3,
    target_revenue DECIMAL(10,2),
    current_revenue DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ====================================
-- TABLE: sync_log
-- Purpose: Track GitHub ↔ Railway synchronization
-- ====================================
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY,
    synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
    source VARCHAR(50) NOT NULL, -- 'github' or 'railway'
    files_synced INT NOT NULL DEFAULT 0,
    errors INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- 'success', 'partial', 'failed'
    details JSONB -- Detailed error information
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);

-- ====================================
-- INITIAL DATA: Projects
-- ====================================
INSERT INTO projects (id, name, status, priority, target_revenue, current_revenue) VALUES
    ('123e4567-e89b-12d3-a456-426614174001', 'OffersPSP', 'PRODUCTION', 1, 10000.00, 0),
    ('123e4567-e89b-12d3-a456-426614174002', 'Brain Index GEO', 'NEAR_PRODUCTION', 2, 250000.00, 0),
    ('123e4567-e89b-12d3-a456-426614174003', 'Make.com Products', 'ACTIVE', 3, 0, 0),
    ('123e4567-e89b-12d3-a456-426614174004', 'Annoris', 'DEVELOPMENT', 4, 200000.00, 0)
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- CLEANUP: Auto-delete old sessions (30+ days)
-- ====================================
-- This will be handled by a cron job in the FastAPI service
-- DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '30 days';

-- ====================================
-- VIEWS: Useful queries
-- ====================================

-- Recent sessions view
CREATE OR REPLACE VIEW recent_sessions AS
SELECT 
    s.id,
    s.created_at,
    p.name as project_name,
    s.priority,
    s.status,
    s.github_path,
    s.last_synced
FROM sessions s
LEFT JOIN projects p ON s.project_id = p.id
WHERE s.created_at > NOW() - INTERVAL '7 days'
ORDER BY s.created_at DESC;

-- Sync health view
CREATE OR REPLACE VIEW sync_health AS
SELECT 
    DATE(synced_at) as sync_date,
    COUNT(*) as total_syncs,
    SUM(files_synced) as total_files,
    SUM(errors) as total_errors,
    ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM sync_log
WHERE synced_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(synced_at)
ORDER BY sync_date DESC;

-- Project stats view
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.target_revenue,
    p.current_revenue,
    ROUND(100.0 * p.current_revenue / NULLIF(p.target_revenue, 0), 2) as progress_pct,
    COUNT(s.id) as session_count,
    MAX(s.created_at) as last_session
FROM projects p
LEFT JOIN sessions s ON p.id = s.project_id
GROUP BY p.id, p.name, p.status, p.target_revenue, p.current_revenue
ORDER BY p.priority;

-- ====================================
-- GRANTS: Permissions (if needed)
-- ====================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ====================================
-- SCHEMA COMPLETE!
-- ====================================
-- Next steps:
-- 1. Apply this schema to Railway PostgreSQL
-- 2. Create FastAPI service with endpoints
-- 3. Implement sync workers (GitHub Webhooks + cron)
-- 4. Setup monitoring and alerts
