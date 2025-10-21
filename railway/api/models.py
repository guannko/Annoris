"""Pydantic models for API"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class SessionBase(BaseModel):
    project_id: Optional[UUID] = None
    priority: str = "MEDIUM"
    status: str = "ACTIVE"
    session_type: Optional[str] = None
    content: str
    tags: Optional[List[str]] = None

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    priority: Optional[str] = None
    status: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class SessionResponse(SessionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    content_preview: Optional[str] = None
    github_path: Optional[str] = None
    github_synced_at: Optional[datetime] = None
    checksum: str
    
    class Config:
        from_attributes = True

class SessionWithSource(SessionResponse):
    """Response with routing information"""
    source: str  # "redis", "railway", or "github"
    latency: str  # e.g. "<10ms", "<50ms", "~500ms"

class ProjectBase(BaseModel):
    name: str
    status: str = "ACTIVE"
    priority: int = 5
    target_revenue: Optional[float] = None
    current_revenue: float = 0
    description: Optional[str] = None
    repository_url: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[int] = None
    target_revenue: Optional[float] = None
    current_revenue: Optional[float] = None
    description: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    session_count: int
    last_session_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SyncLogResponse(BaseModel):
    id: UUID
    synced_at: datetime
    source: str
    direction: str
    files_synced: int
    files_skipped: int
    errors: int
    status: str
    duration_ms: Optional[int] = None
    
    class Config:
        from_attributes = True

class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    github: str
    timestamp: datetime
