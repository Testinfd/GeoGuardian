from supabase import create_client, Client
from .config import settings

# Create Supabase client (with anon key)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Create admin client (bypasses RLS) - only if service key is available
supabase_admin: Client = None
if settings.SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    print("✅ Supabase admin client initialized (RLS bypassed)")
else:
    print("⚠️  Supabase service role key not configured - RLS may cause issues")


def get_supabase() -> Client:
    """Get Supabase client"""
    return supabase


def get_supabase_admin() -> Client:
    """Get Supabase admin client (bypasses RLS)"""
    if not supabase_admin:
        raise Exception("Service role key not configured")
    return supabase_admin


def create_db_and_tables():
    """Database tables are managed by Supabase migrations"""
    pass
