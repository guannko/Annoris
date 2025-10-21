"""Configuration with Redis support (ready but optional)"""
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Annoris API"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database (Railway PostgreSQL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:pass@localhost:5432/annoris"
    )
    
    # Redis (READY but not activated)
    REDIS_ENABLED: bool = os.getenv("REDIS_ENABLED", "false").lower() == "true"
    REDIS_URL: str = os.getenv(
        "REDIS_URL",
        "redis://localhost:6379"
    )
    REDIS_TTL: int = int(os.getenv("REDIS_TTL", "3600"))  # 1 hour
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", "10"))
    
    # GitHub
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_REPO: str = os.getenv("GITHUB_REPO", "guannko/Annoris")
    
    # Security
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")  # AES-256 key
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://annoris.app",
    ]
    
    # Sync
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "")
    CRON_SYNC_ENABLED: bool = os.getenv("CRON_SYNC_ENABLED", "true").lower() == "true"
    CRON_SYNC_INTERVAL: int = int(os.getenv("CRON_SYNC_INTERVAL", "300"))  # 5 min
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
