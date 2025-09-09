from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GeoGuardian"
    
    # Supabase
    SUPABASE_URL: str = "https://exhuqtrrklcichdteauv.supabase.co"
    SUPABASE_ANON_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aHVxdHJya2xjaWNoZHRlYXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODEyNzYsImV4cCI6MjA3Mjc1NzI3Nn0.g9KP70igo6rM2gTUhNyhY9Fg6bgKNdb8EeyG2p9devw"
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aHVxdHJya2xjaWNoZHRlYXV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE4MTI3NiwiZXhwIjoyMDcyNzU3Mjc2fQ.OmON0b7_VL50VvuiB7q9wrvXuGJGYRYD1Yd0Gsdwbac"
    
    # Database (PostgreSQL connection for direct operations - optional)
    DATABASE_URL: Optional[str] = None
    SUPABASE_DB_PASSWORD: Optional[str] = None
    
    # Sentinel Hub
    SENTINELHUB_CLIENT_ID: str
    SENTINELHUB_CLIENT_SECRET: str
    
    # SendGrid
    SENDGRID_API_KEY: str
    FROM_EMAIL: str = "alerts@geoguardian.app"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    
    # JWT (for additional custom auth if needed)
    JWT_SECRET: str = "your-jwt-secret-here"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # NextAuth Secret for frontend integration
    NEXTAUTH_SECRET: Optional[str] = None

    # Google OAuth (for frontend integration)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Environment
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
