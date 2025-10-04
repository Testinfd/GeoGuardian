-- Database Migration: Historical Spectral Data Storage
-- Purpose: Store historical spectral indices for improved seasonal detection
-- Date: 2025-10-04

-- Create table for historical spectral indices
CREATE TABLE IF NOT EXISTS spectral_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aoi_id UUID NOT NULL REFERENCES aois(id) ON DELETE CASCADE,
    capture_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Core vegetation indices
    ndvi_mean FLOAT,
    ndvi_std FLOAT,
    ndvi_min FLOAT,
    ndvi_max FLOAT,
    
    evi_mean FLOAT,
    evi_std FLOAT,
    
    savi_mean FLOAT,
    savi_std FLOAT,
    
    -- Water indices
    ndwi_mean FLOAT,
    ndwi_std FLOAT,
    
    mndwi_mean FLOAT,
    mndwi_std FLOAT,
    
    turbidity_index_mean FLOAT,
    turbidity_index_std FLOAT,
    
    algae_index_mean FLOAT,
    algae_index_std FLOAT,
    
    -- Construction/Urban indices
    ndbi_mean FLOAT,
    ndbi_std FLOAT,
    
    bsi_mean FLOAT,
    bsi_std FLOAT,
    
    bai_mean FLOAT,
    bai_std FLOAT,
    
    -- Fire/Burn indices
    nbri_mean FLOAT,
    nbri_std FLOAT,
    
    -- Thermal/Heat
    thermal_proxy_mean FLOAT,
    thermal_proxy_std FLOAT,
    
    -- Metadata
    cloud_coverage FLOAT,
    data_quality_score FLOAT,
    satellite_source VARCHAR(50),  -- 'Sentinel-2', 'Landsat-8', etc.
    processing_metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_aoi_date UNIQUE (aoi_id, capture_date),
    CONSTRAINT valid_cloud_coverage CHECK (cloud_coverage >= 0 AND cloud_coverage <= 100),
    CONSTRAINT valid_quality_score CHECK (data_quality_score >= 0 AND data_quality_score <= 1)
);

-- Create indices for efficient queries
CREATE INDEX IF NOT EXISTS idx_spectral_history_aoi ON spectral_history(aoi_id);
CREATE INDEX IF NOT EXISTS idx_spectral_history_date ON spectral_history(capture_date DESC);
CREATE INDEX IF NOT EXISTS idx_spectral_history_aoi_date ON spectral_history(aoi_id, capture_date DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spectral_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_spectral_history_timestamp_trigger ON spectral_history;
CREATE TRIGGER update_spectral_history_timestamp_trigger
    BEFORE UPDATE ON spectral_history
    FOR EACH ROW
    EXECUTE FUNCTION update_spectral_history_timestamp();

-- Add column to alerts table to reference historical data used
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS historical_data_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS historical_samples_count INTEGER DEFAULT 0;

-- Create view for easy historical data retrieval
CREATE OR REPLACE VIEW spectral_history_summary AS
SELECT 
    sh.aoi_id,
    a.name as aoi_name,
    COUNT(*) as total_samples,
    MIN(sh.capture_date) as earliest_sample,
    MAX(sh.capture_date) as latest_sample,
    AVG(sh.ndvi_mean) as avg_ndvi,
    STDDEV(sh.ndvi_mean) as stddev_ndvi,
    AVG(sh.ndwi_mean) as avg_ndwi,
    STDDEV(sh.ndwi_mean) as stddev_ndwi,
    AVG(sh.cloud_coverage) as avg_cloud_coverage,
    AVG(sh.data_quality_score) as avg_quality_score
FROM spectral_history sh
JOIN aois a ON sh.aoi_id = a.id
GROUP BY sh.aoi_id, a.name;

-- Create function to get seasonal baseline for an AOI
CREATE OR REPLACE FUNCTION get_seasonal_baseline(
    p_aoi_id UUID,
    p_target_month INTEGER,
    p_years_back INTEGER DEFAULT 3
)
RETURNS TABLE (
    index_name VARCHAR,
    baseline_mean FLOAT,
    baseline_std FLOAT,
    sample_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH seasonal_data AS (
        SELECT 
            ndvi_mean, evi_mean, savi_mean,
            ndwi_mean, mndwi_mean,
            ndbi_mean, bsi_mean, bai_mean,
            nbri_mean, thermal_proxy_mean,
            turbidity_index_mean, algae_index_mean
        FROM spectral_history
        WHERE aoi_id = p_aoi_id
        AND EXTRACT(MONTH FROM capture_date) = p_target_month
        AND capture_date >= NOW() - INTERVAL '1 year' * p_years_back
        AND data_quality_score >= 0.6
    )
    SELECT 'ndvi'::VARCHAR, AVG(ndvi_mean)::FLOAT, STDDEV(ndvi_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE ndvi_mean IS NOT NULL
    UNION ALL
    SELECT 'evi'::VARCHAR, AVG(evi_mean)::FLOAT, STDDEV(evi_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE evi_mean IS NOT NULL
    UNION ALL
    SELECT 'savi'::VARCHAR, AVG(savi_mean)::FLOAT, STDDEV(savi_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE savi_mean IS NOT NULL
    UNION ALL
    SELECT 'ndwi'::VARCHAR, AVG(ndwi_mean)::FLOAT, STDDEV(ndwi_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE ndwi_mean IS NOT NULL
    UNION ALL
    SELECT 'mndwi'::VARCHAR, AVG(mndwi_mean)::FLOAT, STDDEV(mndwi_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE mndwi_mean IS NOT NULL
    UNION ALL
    SELECT 'ndbi'::VARCHAR, AVG(ndbi_mean)::FLOAT, STDDEV(ndbi_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE ndbi_mean IS NOT NULL
    UNION ALL
    SELECT 'bsi'::VARCHAR, AVG(bsi_mean)::FLOAT, STDDEV(bsi_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE bsi_mean IS NOT NULL
    UNION ALL
    SELECT 'bai'::VARCHAR, AVG(bai_mean)::FLOAT, STDDEV(bai_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE bai_mean IS NOT NULL
    UNION ALL
    SELECT 'nbri'::VARCHAR, AVG(nbri_mean)::FLOAT, STDDEV(nbri_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE nbri_mean IS NOT NULL
    UNION ALL
    SELECT 'thermal_proxy'::VARCHAR, AVG(thermal_proxy_mean)::FLOAT, STDDEV(thermal_proxy_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE thermal_proxy_mean IS NOT NULL
    UNION ALL
    SELECT 'turbidity_index'::VARCHAR, AVG(turbidity_index_mean)::FLOAT, STDDEV(turbidity_index_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE turbidity_index_mean IS NOT NULL
    UNION ALL
    SELECT 'algae_index'::VARCHAR, AVG(algae_index_mean)::FLOAT, STDDEV(algae_index_mean)::FLOAT, COUNT(*)::INTEGER FROM seasonal_data WHERE algae_index_mean IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old historical data (keep last 5 years)
CREATE OR REPLACE FUNCTION cleanup_old_spectral_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM spectral_history
    WHERE capture_date < NOW() - INTERVAL '5 years'
    AND data_quality_score < 0.7;  -- Only delete low quality old data
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust role as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON spectral_history TO authenticated;
GRANT SELECT ON spectral_history_summary TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE spectral_history IS 'Historical spectral indices for seasonal pattern detection and baseline comparison';
COMMENT ON COLUMN spectral_history.aoi_id IS 'Reference to the Area of Interest';
COMMENT ON COLUMN spectral_history.capture_date IS 'Date when satellite image was captured';
COMMENT ON COLUMN spectral_history.data_quality_score IS 'Overall quality score (0-1) based on cloud coverage, processing success, etc.';
COMMENT ON FUNCTION get_seasonal_baseline IS 'Get baseline spectral values for a specific month based on historical data';
COMMENT ON FUNCTION cleanup_old_spectral_history IS 'Remove low-quality historical data older than 5 years to save storage';

-- Create sample data insertion policy (RLS)
ALTER TABLE spectral_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view spectral history for their AOIs or public AOIs
CREATE POLICY select_spectral_history ON spectral_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM aois
            WHERE aois.id = spectral_history.aoi_id
            AND (aois.user_id = auth.uid() OR aois.is_public = true)
        )
    );

-- Policy: Only system can insert spectral history (via service role)
CREATE POLICY insert_spectral_history ON spectral_history
    FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

COMMENT ON POLICY select_spectral_history ON spectral_history IS 'Users can view spectral history for their own or public AOIs';
COMMENT ON POLICY insert_spectral_history ON spectral_history IS 'Only backend service can insert spectral history data';
