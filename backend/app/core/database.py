from supabase import create_client, Client
from .config import settings

# Create Supabase client (with anon key)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Admin client disabled for security - all operations must respect RLS
supabase_admin: Client = None
print("Admin client disabled - All operations respect Row Level Security")


def get_supabase() -> Client:
    """Get Supabase client"""
    return supabase


def get_supabase_admin() -> Client:
    """DEPRECATED: Admin client disabled for security. Use get_supabase() with proper RLS policies."""
    raise Exception("Admin client disabled for security. All operations must respect Row Level Security policies.")


def create_db_and_tables():
    """Database tables are managed by Supabase migrations"""
    pass
