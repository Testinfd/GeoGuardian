from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GeoGuardian"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None  # Disabled for security - RLS should be used
    
    # Database (PostgreSQL connection for direct operations - optional)
    DATABASE_URL: Optional[str] = None
    SUPABASE_DB_PASSWORD: Optional[str] = None
    
    # Sentinel Hub (optional for development)
    SENTINELHUB_CLIENT_ID: Optional[str] = None
    SENTINELHUB_CLIENT_SECRET: Optional[str] = None
    
    # SendGrid (optional for development)
    SENDGRID_API_KEY: Optional[str] = None
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
