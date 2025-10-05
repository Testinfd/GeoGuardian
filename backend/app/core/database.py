from supabase import create_client, Client
from .config import settings
from typing import Optional

# Create Supabase client (with anon key for public operations)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Service role client for authenticated backend operations (bypasses RLS)
# The backend has already verified the user's identity, so it acts as a trusted intermediary
supabase_service: Client = None
if settings.SUPABASE_SERVICE_ROLE_KEY:
    supabase_service = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    print("✅ Service role client initialized - Backend operations will bypass RLS")
else:
    print("⚠️  Service role key not configured - Using anon key (RLS will apply)")


def get_supabase() -> Client:
    """
    Get Supabase client for backend database operations
    
    Uses service role key if available (bypasses RLS), otherwise uses anon key.
    Backend operations use service role because the user's identity has already 
    been verified via JWT token verification.
    """
    return supabase_service if supabase_service else supabase


def get_supabase_auth() -> Client:
    """
    Get Supabase client for authentication operations (token verification)
    
    Always uses anon key client for verifying user JWT tokens.
    This is the correct client to use for auth.get_user() calls.
    """
    return supabase


def get_supabase_admin() -> Client:
    """DEPRECATED: Admin client disabled for security. Use get_supabase() with proper RLS policies."""
    raise Exception("Admin client disabled for security. All operations must respect Row Level Security policies.")


def create_db_and_tables():
    """Database tables are managed by Supabase migrations"""
    pass
