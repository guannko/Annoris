"""Smart routing layer with triple fallback
Redis (if enabled) → Railway → GitHub
"""
import logging
import hashlib
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

from config import settings

logger = logging.getLogger(__name__)

class SmartRouter:
    """Triple fallback routing with Redis support"""
    
    def __init__(self):
        self.redis_client = None
        
        # Initialize Redis if enabled
        if settings.REDIS_ENABLED:
            try:
                import redis.asyncio as redis
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    max_connections=settings.REDIS_MAX_CONNECTIONS,
                    decode_responses=True
                )
                logger.info("✅ Redis client initialized")
            except Exception as e:
                logger.warning(f"⚠️  Redis initialization failed: {e}")
                self.redis_client = None
    
    async def get_session(self, session_id: str, db_session, github_client) -> Dict[str, Any]:
        """
        Triple fallback session retrieval:
        1. Redis (if enabled) - <10ms
        2. Railway PostgreSQL - <50ms
        3. GitHub API - ~500ms
        """
        
        # LAYER 1: Redis (if available)
        if self.redis_client:
            try:
                start = datetime.now()
                data = await self.redis_client.get(f"session:{session_id}")
                
                if data:
                    latency = (datetime.now() - start).total_seconds() * 1000
                    logger.info(f"✅ Redis hit: {session_id} ({latency:.1f}ms)")
                    
                    return {
                        "data": data,
                        "source": "redis",
                        "latency": f"{latency:.0f}ms"
                    }
            except Exception as e:
                logger.warning(f"⚠️  Redis failed: {e}, trying Railway")
        
        # LAYER 2: Railway PostgreSQL (default)
        try:
            start = datetime.now()
            # Query database here
            # data = await db_session.query(...)
            
            latency = (datetime.now() - start).total_seconds() * 1000
            logger.info(f"✅ Railway hit: {session_id} ({latency:.1f}ms)")
            
            # Cache to Redis if available (async, don't wait)
            if self.redis_client:
                asyncio.create_task(
                    self._cache_to_redis(session_id, "data_placeholder")
                )
            
            return {
                "data": "data_placeholder",
                "source": "railway",
                "latency": f"{latency:.0f}ms"
            }
        except Exception as e:
            logger.warning(f"⚠️  Railway failed: {e}, falling back to GitHub")
        
        # LAYER 3: GitHub API (fallback)
        try:
            start = datetime.now()
            # data = await github_client.get_session(session_id)
            
            latency = (datetime.now() - start).total_seconds() * 1000
            logger.info(f"✅ GitHub fallback: {session_id} ({latency:.1f}ms)")
            
            # Cache to both if available (async)
            if self.redis_client:
                asyncio.create_task(
                    self._cache_to_redis(session_id, "github_data")
                )
            
            # Save to Railway (async)
            # asyncio.create_task(db_session.save(...))
            
            return {
                "data": "github_data",
                "source": "github",
                "latency": f"{latency:.0f}ms"
            }
        except Exception as e:
            logger.error(f"❌ All layers failed: {e}")
            raise
    
    async def _cache_to_redis(self, session_id: str, data: str):
        """Cache data to Redis (async, fire and forget)"""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.set(
                f"session:{session_id}",
                data,
                ex=settings.REDIS_TTL
            )
            logger.debug(f"✅ Cached to Redis: {session_id}")
        except Exception as e:
            logger.warning(f"⚠️  Redis cache failed: {e}")
    
    async def invalidate_cache(self, session_id: str):
        """Invalidate Redis cache for a session"""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.delete(f"session:{session_id}")
            logger.debug(f"✅ Invalidated cache: {session_id}")
        except Exception as e:
            logger.warning(f"⚠️  Cache invalidation failed: {e}")
    
    async def health_check(self) -> Dict[str, str]:
        """Check routing layer health"""
        result = {
            "redis": "disabled",
            "railway": "unknown",
            "github": "unknown"
        }
        
        # Redis
        if self.redis_client:
            try:
                await self.redis_client.ping()
                result["redis"] = "connected"
            except:
                result["redis"] = "error"
        
        return result

# Global router instance
router = SmartRouter()
