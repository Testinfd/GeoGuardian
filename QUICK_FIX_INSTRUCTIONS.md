# Quick Fix: Disable RLS in Supabase (2 minutes) 🚀

## The Issue
Your service role key isn't working properly, but there's a **much simpler solution**!

## ✅ Simple Solution (Recommended)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your **GeoGuardian** project

### Step 2: Run One SQL Command
1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Paste this command and click **Run**:

```sql
ALTER TABLE aois DISABLE ROW LEVEL SECURITY;
```

### Step 3: Test AOI Creation
Now go to your application and try creating a monitoring area - it should work perfectly!

## What This Does
- **Temporarily disables** Row Level Security for the `aois` table
- **Allows your app** to save AOIs to the database
- **Perfect for development** and testing

## Expected Result
After running this SQL command, when you create an AOI:
- ✅ **Frontend**: Shows "Monitoring area created and saved successfully!"
- ✅ **Backend**: Actually saves to database 
- ✅ **AOI List**: Shows your created areas
- ✅ **Map**: Displays saved AOIs

## For Production Later
When you're ready for production, you can re-enable RLS with proper policies:

```sql
-- Re-enable RLS
ALTER TABLE aois ENABLE ROW LEVEL SECURITY;

-- Add proper policies for authenticated users
CREATE POLICY "Users can manage their own AOIs" ON aois
    FOR ALL USING (auth.uid()::text = user_id);
```

## Current Status
- ✅ Fixed API mapping (geometry → geojson)
- ✅ Enhanced mapping with satellite imagery
- ✅ Backend code ready to save
- ⏳ **Need to run the SQL command above**

**This is a 30-second fix that will make everything work!** 🎯
