# Supabase RLS Fix for AOI Creation

## Problem Identified ✅
The AOI creation is failing due to **Row Level Security (RLS) policies** in Supabase. The error message is:
```
new row violates row-level security policy for table "aois"
```

## Quick Fix (Recommended for Development)

### Step 1: Access Your Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your GeoGuardian project
3. Navigate to **SQL Editor**

### Step 2: Temporarily Disable RLS for Development
Run this SQL command in the SQL Editor:

```sql
-- Temporarily disable RLS for the aois table (DEVELOPMENT ONLY)
ALTER TABLE aois DISABLE ROW LEVEL SECURITY;
```

### Step 3: Test AOI Creation
After running this command, try creating an AOI in your application. It should now work and save to the database.

## Proper Production Solution (After Development)

For production, you'll want to create proper RLS policies instead of disabling RLS:

```sql
-- Re-enable RLS
ALTER TABLE aois ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to insert their own AOIs
CREATE POLICY "Users can insert their own AOIs" ON aois
    FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

-- Create policy for authenticated users to read their own AOIs
CREATE POLICY "Users can read their own AOIs" ON aois
    FOR SELECT 
    USING (auth.uid()::text = user_id);

-- Create policy for authenticated users to update their own AOIs
CREATE POLICY "Users can update their own AOIs" ON aois
    FOR UPDATE 
    USING (auth.uid()::text = user_id);

-- Create policy for authenticated users to delete their own AOIs
CREATE POLICY "Users can delete their own AOIs" ON aois
    FOR DELETE 
    USING (auth.uid()::text = user_id);
```

## Current Status
- ✅ API call fixed (geometry → geojson mapping)
- ✅ Enhanced mapping with satellite imagery
- ✅ Backend code updated to save to database
- ❌ **RLS blocking database saves** ← Need to fix this

## Next Steps
1. **Disable RLS temporarily** using the SQL command above
2. **Test AOI creation** - should now work completely
3. **Implement proper RLS policies** for production security

After disabling RLS, your AOI creation should work perfectly and save to the database!
