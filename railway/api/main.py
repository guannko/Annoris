"""Annoris API - Phase 1
FastAPI service with triple fallback routing:
- Redis (if enabled) <10ms
- Railway PostgreSQL <50ms  
- GitHub API ~500ms
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from config import settings
from database import init_db, close_db
from routers import sessions, projects, sync, health

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("🚀 Starting Annoris API...")
    
    # Initialize database
    await init_db()
    logger.info("✅ Database connected")
    
    # Redis status
    if settings.REDIS_ENABLED:
        logger.info(f"✅ Redis enabled at {settings.REDIS_URL}")
    else:
        logger.info("ℹ️  Redis disabled (code ready, activate when needed)")
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down Annoris API...")
    await close_db()

# FastAPI app
app = FastAPI(
    title="Annoris API",
    description="AI Memory System with Smart Triple Fallback Routing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, tags=["Health"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(sync.router, prefix="/sync", tags=["Sync"])

@app.get("/")
async def root():
    return {
        "service": "Annoris API",
        "version": "1.0.0",
        "status": "operational",
        "redis_enabled": settings.REDIS_ENABLED,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
