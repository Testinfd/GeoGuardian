# Advanced Features Testing Guide

## Quick Start

This guide helps you test the newly implemented advanced features.

---

## Prerequisites

1. **Install Additional Dependencies**:
```bash
cd backend
pip install scipy>=1.9.0 matplotlib>=3.5.0 Pillow>=9.0.0
```

2. **Ensure Sentinel Hub Credentials Are Set**:
```bash
# In backend/.env
SENTINELHUB_CLIENT_ID=333999f3-3d9a-46b2-b530-d39776969ef3
SENTINELHUB_CLIENT_SECRET=<your_secret>
```

3. **Start Backend Server**:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Test 1: Temporal Analysis

### Purpose
Analyze trends in NDVI over time to detect vegetation loss acceleration.

### Test Data Required
- At least 3 historical spectral index records in `spectral_history` table
- Recommended: 12+ records for seasonal pattern detection

### API Request
```bash
curl -X POST "http://localhost:8000/api/v2/analysis/temporal-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi_id": "<your_aoi_id>",
    "index_name": "ndvi",
    "lookback_days": 365,
    "critical_threshold": 0.2
  }'
```

### Expected Response
```json
{
  "aoi_id": "...",
  "index_name": "ndvi",
  "periods_analyzed": 12,
  "trend": {
    "direction": "decreasing",
    "slope": -0.0023,
    "r_squared": 0.78,
    "p_value": 0.002,
    "confidence": 0.76
  },
  "velocity": {
    "average_velocity": -0.0021,
    "current_velocity": -0.0041,
    "acceleration": -0.0020,
    "is_accelerating": true,
    "days_to_critical": 146,
    "severity": "moderate_degradation"
  },
  "anomalies": [...],
  "seasonal_pattern": {
    "seasonal": false,
    "confidence": 0.3,
    "period_days": null,
    "amplitude": 0.15
  },
  "next_period_forecast": 0.42,
  "interpretation": "A strong decreasing trend is detected (R²=0.780). Change is happening rapidly (moderate degradation). The rate of change is accelerating, requiring immediate attention.",
  "visualization_url": "data:image/png;base64,..."
}
```

### What to Check
- ✅ Trend direction matches your expectations
- ✅ Velocity shows rate of change
- ✅ Acceleration detected if change is speeding up
- ✅ Days to critical calculated if threshold provided
- ✅ Visualization URL is a valid base64 image
- ✅ Interpretation is human-readable

---

## Test 2: Hotspot Analysis

### Purpose
Identify spatial concentrations of change within an AOI.

### API Request
```bash
curl -X POST "http://localhost:8000/api/v2/analysis/hotspot-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi_id": "<your_aoi_id>",
    "geojson": {
      "type": "Polygon",
      "coordinates": [[[91.7, 26.15], [91.8, 26.15], [91.8, 26.25], [91.7, 26.25], [91.7, 26.15]]]
    },
    "date_range_days": 30,
    "grid_size": 10,
    "threshold_percentile": 75
  }'
```

### Expected Response
```json
{
  "aoi_id": "...",
  "total_hotspots": 8,
  "hotspots": [
    {
      "grid_position": {"row": 2, "col": 3},
      "intensity": 0.456,
      "max_intensity": 0.789,
      "pixels_affected": 1256,
      "severity": "high"
    },
    ...
  ],
  "distribution": "clustered",
  "largest_hotspot": {
    "grid_position": {"row": 5, "col": 7},
    "intensity": 0.789,
    "max_intensity": 0.921,
    "pixels_affected": 2341,
    "severity": "critical"
  },
  "coverage_percent": 8.0,
  "visualization_url": "data:image/png;base64,..."
}
```

### What to Check
- ✅ Hotspots are detected
- ✅ Distribution is classified (isolated, clustered, scattered, dispersed)
- ✅ Severity levels are assigned (low, moderate, high, critical)
- ✅ Visualization shows hotspots overlaid on satellite imagery
- ✅ Coverage percentage is reasonable

---

## Test 3: Alert Prioritization

### Purpose
Automatically prioritize existing alerts by importance and urgency.

### API Request
```bash
curl -X POST "http://localhost:8000/api/v2/analysis/alerts/prioritize" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 20,
    "min_priority_score": 40
  }'
```

### Expected Response
```json
{
  "total_alerts": 20,
  "prioritized_alerts": [
    {
      "alert_id": "...",
      "aoi_id": "...",
      "priority_score": 87.5,
      "priority_level": "critical",
      "urgency_level": "immediate",
      "factors": {
        "magnitude": 28.5,
        "confidence": 22.0,
        "importance": 20.0,
        "velocity": 12.0,
        "novelty": 5.0
      },
      "recommended_action": "IMMEDIATE ACTION REQUIRED: Deploy field team for verification and intervention within 24 hours."
    },
    ...
  ]
}
```

### What to Check
- ✅ Alerts are sorted by priority (highest first)
- ✅ Priority scores range from 0-100
- ✅ Priority levels: critical (80+), high (60+), medium (40+), low (<40)
- ✅ Urgency levels: immediate, urgent, moderate, routine
- ✅ Factor breakdown shows contribution of each factor
- ✅ Recommended actions are actionable and clear

---

## Test 4: Visualization Generation

### Purpose
Generate advanced visualizations for change detection.

### Test 4a: Heat Map

```bash
curl -X POST "http://localhost:8000/api/v2/analysis/visualize" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi_id": "<your_aoi_id>",
    "geojson": {
      "type": "Polygon",
      "coordinates": [[[91.7, 26.15], [91.8, 26.15], [91.8, 26.25], [91.7, 26.25], [91.7, 26.15]]]
    },
    "visualization_type": "heatmap",
    "date_range_days": 30
  }'
```

### Test 4b: Comparison View

```bash
curl -X POST "http://localhost:8000/api/v2/analysis/visualize" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi_id": "<your_aoi_id>",
    "geojson": {...},
    "visualization_type": "comparison",
    "date_range_days": 60
  }'
```

### Test 4c: Multi-Index Heat Map

```bash
curl -X POST "http://localhost:8000/api/v2/analysis/visualize" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi_id": "<your_aoi_id>",
    "geojson": {...},
    "visualization_type": "multi_index",
    "date_range_days": 30,
    "indices": ["ndvi", "ndwi", "ndbi", "evi"]
  }'
```

### Expected Response
```json
{
  "aoi_id": "...",
  "visualization_type": "heatmap",
  "visualization_url": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "metadata": {
    "type": "heatmap"
  }
}
```

### What to Check
- ✅ Visualization URL is valid base64 PNG
- ✅ Image can be displayed in browser (paste into HTML `<img>` tag)
- ✅ Colors indicate change intensity correctly
- ✅ Colorbar is present and labeled
- ✅ Title and labels are clear

---

## Common Issues & Solutions

### Issue 1: "Insufficient historical data"

**Problem**: Temporal analysis requires at least 3 historical records.

**Solution**:
1. Run analyses multiple times over several days to build up historical data
2. Or use a test AOI that already has historical data
3. Check: `SELECT * FROM spectral_history WHERE aoi_id = '<your_aoi_id>'`

---

### Issue 2: "Could not retrieve sufficient satellite imagery"

**Problem**: Sentinel Hub couldn't find cloud-free imagery in the specified date range.

**Solutions**:
1. Increase `date_range_days` (try 60 or 90)
2. Increase `max_cloud_coverage` in FetchConfig (try 0.5 for 50%)
3. Check if AOI is in a frequently cloudy region
4. Try a different time of year

---

### Issue 3: Visualization returns error image

**Problem**: Visualization generation failed.

**Solutions**:
1. Check logs for specific error message
2. Verify matplotlib and Pillow are installed
3. Check image data is valid numpy array
4. Try with smaller AOI (reduce computational load)

---

### Issue 4: Alert prioritization returns empty list

**Problem**: No alerts match the criteria.

**Solutions**:
1. Remove `min_priority_score` filter
2. Increase `limit`
3. Check if there are any alerts in database: `SELECT COUNT(*) FROM alerts`
4. Create test alerts first

---

## Integration Testing

### Test Complete Workflow

1. **Create AOI** → 2. **Run Analysis** → 3. **Wait for Historical Data** → 4. **Run Temporal Analysis** → 5. **Prioritize Alerts** → 6. **Generate Visualizations**

```bash
# 1. Create AOI (via frontend or API)

# 2. Run initial analysis
curl -X POST "http://localhost:8000/api/v2/analysis/analyze/comprehensive" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi_id": "<new_aoi_id>",
    "geojson": {...},
    "analysis_type": "comprehensive"
  }'

# 3. Wait 1-2 weeks for multiple analyses to build historical data

# 4. Run temporal analysis
curl -X POST "http://localhost:8000/api/v2/analysis/temporal-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi_id": "<new_aoi_id>",
    "index_name": "ndvi",
    "lookback_days": 30
  }'

# 5. Prioritize resulting alerts
curl -X POST "http://localhost:8000/api/v2/analysis/alerts/prioritize" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'

# 6. Generate visualization
curl -X POST "http://localhost:8000/api/v2/analysis/visualize" \
  -H "Content-Type: application/json" \
  -d '{
    "aoi_id": "<new_aoi_id>",
    "geojson": {...},
    "visualization_type": "heatmap"
  }'
```

---

## Performance Benchmarks

### Expected Response Times

| Endpoint | Typical Time | Max Time | Notes |
|----------|-------------|----------|-------|
| `/temporal-analysis` | 0.5-2s | 5s | Depends on # of records |
| `/hotspot-analysis` | 10-30s | 60s | Includes satellite data fetch |
| `/alerts/prioritize` | 0.2-1s | 3s | Depends on # of alerts |
| `/visualize` | 10-30s | 60s | Includes satellite data fetch |

### Sentinel Hub API Usage

| Endpoint | PU per Request | Free Tier Budget |
|----------|---------------|------------------|
| `/temporal-analysis` | 0 | ∞ (database only) |
| `/hotspot-analysis` | 50-100 | ~300-600 requests/month |
| `/alerts/prioritize` | 0 | ∞ (database only) |
| `/visualize` | 50-100 | ~300-600 requests/month |

---

## Debugging Tips

### Enable Debug Logging

```python
# In app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Historical Data

```sql
-- Check if historical data exists
SELECT aoi_id, COUNT(*) as record_count, 
       MIN(capture_date) as earliest, 
       MAX(capture_date) as latest
FROM spectral_history
GROUP BY aoi_id
ORDER BY record_count DESC;

-- View sample records
SELECT * FROM spectral_history 
WHERE aoi_id = '<your_aoi_id>' 
ORDER BY capture_date DESC 
LIMIT 10;
```

### Visualize Base64 Images

```html
<!-- Paste into HTML file and open in browser -->
<!DOCTYPE html>
<html>
<body>
  <img src="<paste_base64_here>" alt="Visualization"/>
</body>
</html>
```

Or use online tool: https://base64.guru/converter/decode/image

---

## Next Steps

After testing these features:

1. ✅ Verify all endpoints work with your data
2. ✅ Test edge cases (no data, cloud coverage, etc.)
3. ✅ Integrate with frontend (create UI components)
4. ✅ Set up monitoring and alerting
5. ✅ Document API for users
6. ✅ Consider implementing remaining features (PDF reports, public portal)

---

*Last Updated: October 4, 2025*  
*Status: Ready for Testing*
