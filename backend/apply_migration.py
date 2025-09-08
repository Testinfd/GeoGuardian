#!/usr/bin/env python3
"""
Database Migration Script for GeoGuardian
Applies the database schema updates to match the enhanced backend models
"""

import os
import sys
from pathlib import Path

# Add the current directory to the path
sys.path.append(str(Path(__file__).parent))

try:
    from app.core.database import get_supabase_admin, get_supabase
    from supabase import Client
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the backend directory")
    sys.exit(1)


def apply_migration():
    """Apply database migration"""

    print("🚀 Starting GeoGuardian Database Migration")
    print("=" * 50)

    try:
        # Try to get admin client for migration
        try:
            supabase = get_supabase_admin()
            print("✅ Connected with admin privileges")
        except Exception as e:
            print(f"⚠️  Admin connection failed: {e}")
            print("Attempting with regular client...")
            from core.database import get_supabase
            supabase = get_supabase()
            print("✅ Connected with regular client")

        # Read migration file
        migration_file = Path(__file__).parent / "database_migration.sql"
        if not migration_file.exists():
            print(f"❌ Migration file not found: {migration_file}")
            return False

        with open(migration_file, 'r') as f:
            migration_sql = f.read()

        print("📄 Migration SQL loaded successfully")

        # For Supabase, we can't directly execute raw SQL
        # Instead, we'll use the REST API to apply changes
        print("⚠️  Note: For Supabase, you'll need to apply this migration manually")
        print("   through the Supabase Dashboard SQL Editor")
        print("\n📋 Migration SQL Preview:")
        print("=" * 30)
        print(migration_sql[:500] + "..." if len(migration_sql) > 500 else migration_sql)
        print("=" * 30)

        # Try to test the connection by fetching current schema
        print("\n🔍 Testing database connection...")

        # Test aois table
        try:
            response = supabase.table("aois").select("*").limit(1).execute()
            print("✅ AOIs table accessible")
        except Exception as e:
            print(f"⚠️  AOIs table issue: {e}")

        # Test alerts table
        try:
            response = supabase.table("alerts").select("*").limit(1).execute()
            print("✅ Alerts table accessible")
        except Exception as e:
            print(f"⚠️  Alerts table issue: {e}")

        # Test enhanced_alerts table
        try:
            response = supabase.table("enhanced_alerts").select("*").limit(1).execute()
            print("✅ Enhanced alerts table exists")
        except Exception as e:
            print(f"⚠️  Enhanced alerts table issue: {e}")

        print("\n📝 Next Steps:")
        print("1. Copy the migration SQL above")
        print("2. Go to your Supabase Dashboard")
        print("3. Navigate to SQL Editor")
        print("4. Paste and execute the migration")
        print("5. Verify the schema changes")

        return True

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_migration_status():
    """Check if migration has been applied"""

    print("\n🔍 Checking migration status...")

    try:
        from app.core.database import get_supabase
        supabase = get_supabase()

        # Check if enhanced columns exist in alerts table
        test_columns = [
            'overall_confidence',
            'priority_level',
            'analysis_type',
            'algorithms_used',
            'detections'
        ]

        print("Checking alerts table columns...")
        for column in test_columns:
            try:
                # Try to select the column to see if it exists
                response = supabase.table("alerts").select(column).limit(1).execute()
                print(f"✅ Column '{column}' exists")
            except Exception as e:
                print(f"❌ Column '{column}' missing or error: {e}")

        # Check if enhanced_alerts table exists
        try:
            response = supabase.table("enhanced_alerts").select("*").limit(1).execute()
            print("✅ Enhanced alerts table exists")
        except Exception as e:
            print(f"❌ Enhanced alerts table issue: {e}")

    except Exception as e:
        print(f"❌ Status check failed: {e}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--status":
        check_migration_status()
    else:
        success = apply_migration()
        if success:
            print("\n✅ Migration preparation completed successfully!")
            print("Please apply the SQL manually in Supabase Dashboard")
        else:
            print("\n❌ Migration preparation failed!")
            sys.exit(1)
