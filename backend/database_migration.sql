-- Database Migration Script for GeoGuardian
-- This script updates the database schema to match the enhanced backend models
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enhanced_alerts table for detailed analysis results
CREATE TABLE IF NOT EXISTS enhanced_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aoi_id UUID NOT NULL REFERENCES aois(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) DEFAULT 'comprehensive',
    status VARCHAR(20) DEFAULT 'pending',
    priority_level VARCHAR(20) DEFAULT 'info',
    overall_confidence FLOAT DEFAULT 0.0,
    detections JSONB DEFAULT '[]',
    algorithms_used JSONB DEFAULT '[]',
    spectral_indices JSONB DEFAULT '{}',
    satellite_metadata JSONB DEFAULT '{}',
    processing_metadata JSONB DEFAULT '{}',
    processing_time_seconds FLOAT DEFAULT 0.0,
    data_quality_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update alerts table to support enhanced analysis data
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS overall_confidence FLOAT DEFAULT 0.0;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'info';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(50) DEFAULT 'basic';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS algorithms_used JSONB DEFAULT '[]';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS detections JSONB DEFAULT '[]';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS spectral_indices JSONB DEFAULT '{}';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS satellite_metadata JSONB DEFAULT '{}';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS processing_time_seconds FLOAT DEFAULT 0.0;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS data_quality_score FLOAT DEFAULT 0.0;

-- Update aois table to support enhanced data
ALTER TABLE aois ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE aois ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE aois ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE aois ADD COLUMN IF NOT EXISTS analysis_count INTEGER DEFAULT 0;
ALTER TABLE aois ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE aois ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE aois ADD COLUMN IF NOT EXISTS last_analysis TIMESTAMP WITH TIME ZONE;
ALTER TABLE aois ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE aois ADD COLUMN IF NOT EXISTS area_km2 FLOAT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_overall_confidence ON alerts(overall_confidence);
CREATE INDEX IF NOT EXISTS idx_alerts_priority_level ON alerts(priority_level);
CREATE INDEX IF NOT EXISTS idx_alerts_analysis_type ON alerts(analysis_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_aoi_id ON alerts(aoi_id);
CREATE INDEX IF NOT EXISTS idx_aois_status ON aois(status);
CREATE INDEX IF NOT EXISTS idx_aois_last_analysis ON aois(last_analysis);
CREATE INDEX IF NOT EXISTS idx_aois_user_id ON aois(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_alerts_aoi_id ON enhanced_alerts(aoi_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_alerts_overall_confidence ON enhanced_alerts(overall_confidence);
CREATE INDEX IF NOT EXISTS idx_enhanced_alerts_created_at ON enhanced_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_alert_id ON votes(alert_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Update RLS policies for better access control

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own aois" ON aois;
DROP POLICY IF EXISTS "Users can create aois" ON aois;
DROP POLICY IF EXISTS "Users can update own aois" ON aois;
DROP POLICY IF EXISTS "Users can delete own aois" ON aois;
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can create alerts" ON alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON alerts;

-- Create new RLS policies with better access control
CREATE POLICY "Users can view own aois" ON aois
    FOR SELECT USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Users can create aois" ON aois
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Users can update own aois" ON aois
    FOR UPDATE USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Users can delete own aois" ON aois
    FOR DELETE USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Users can view own alerts" ON alerts
    FOR SELECT USING (
        aoi_id IN (
            SELECT id FROM aois WHERE user_id::text = auth.uid()::text OR user_id IS NULL
        )
    );

CREATE POLICY "Users can create alerts" ON alerts
    FOR INSERT WITH CHECK (
        aoi_id IN (
            SELECT id FROM aois WHERE user_id::text = auth.uid()::text OR user_id IS NULL
        )
    );

CREATE POLICY "Users can update own alerts" ON alerts
    FOR UPDATE USING (
        aoi_id IN (
            SELECT id FROM aois WHERE user_id::text = auth.uid()::text OR user_id IS NULL
        )
    );

-- Enhanced alerts policies
CREATE POLICY "Users can view own enhanced alerts" ON enhanced_alerts
    FOR SELECT USING (
        aoi_id IN (
            SELECT id FROM aois WHERE user_id::text = auth.uid()::text OR user_id IS NULL
        )
    );

CREATE POLICY "Users can create enhanced alerts" ON enhanced_alerts
    FOR INSERT WITH CHECK (
        aoi_id IN (
            SELECT id FROM aois WHERE user_id::text = auth.uid()::text OR user_id IS NULL
        )
    );

-- Enable RLS on enhanced_alerts table
ALTER TABLE enhanced_alerts ENABLE ROW LEVEL SECURITY;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for enhanced_alerts
CREATE TRIGGER update_enhanced_alerts_updated_at
    BEFORE UPDATE ON enhanced_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for aois
CREATE TRIGGER update_aois_updated_at
    BEFORE UPDATE ON aois
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for combined alert data
CREATE OR REPLACE VIEW alert_summary AS
SELECT
    a.id,
    a.aoi_id,
    a.type,
    a.confidence,
    a.overall_confidence,
    a.priority_level,
    a.analysis_type,
    a.algorithms_used,
    a.detections,
    a.spectral_indices,
    a.processing_time_seconds,
    a.data_quality_score,
    a.created_at,
    o.name as aoi_name,
    o.user_id
FROM alerts a
LEFT JOIN aois o ON a.aoi_id = o.id
ORDER BY a.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON alert_summary TO authenticated;
GRANT SELECT ON alert_summary TO anon;
