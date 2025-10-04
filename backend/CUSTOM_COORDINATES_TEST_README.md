# Manual AOI Backend Test

This document describes how to use the `test_manual_aoi.py` script to test the GeoGuardian backend with your own custom coordinates. This script allows for direct backend validation without needing a frontend.

## Quick Start

1.  **Ensure the backend is running:**
    ```bash
    # From the 'backend' directory
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```

2.  **Edit the test script:**
    Open the `test_manual_aoi.py` file in a text editor.

3.  **Update Coordinates:**
    Modify the `aoi_name` and `geojson_coordinates` variables at the top of the file with your own data.

    ```python
    # --- EDIT THIS SECTION ---
    # Put your AOI name and GeoJSON coordinates here.
    aoi_name = "My Custom Test Area"
    geojson_coordinates = {
        "type": "Polygon",
        "coordinates": [[
            [lon1, lat1],
            [lon2, lat2],
            [lon3, lat3],
            [lon4, lat4],
            [lon1, lat1]
        ]]
    }
    # --- END OF EDIT SECTION ---
    ```

4.  **Run the test:**
    In a new terminal, execute the script:
    ```bash
    python test_manual_aoi.py
    ```

## What It Does

The script automatically runs a series of tests against the backend using the coordinates you provided:

-   ✅ **Health Check** - Verifies the backend is online.
-   ✅ **AOI Creation** - Creates an Area of Interest with your coordinates.
-   ✅ **Satellite Preview** - Checks for satellite imagery availability.
-   ✅ **Comprehensive Analysis** - Runs the full environmental change detection pipeline.
-   ✅ **System Status** - Checks overall backend health and capabilities.

## GeoJSON Format

The `geojson_coordinates` variable must be a valid GeoJSON `Polygon`. The coordinates should form a closed loop, where the first and last points are the same.

### Example:
```json
{
  "type": "Polygon",
  "coordinates": [[
    [91.7447, 26.1961],
    [91.7447, 26.1967],
    [91.7453, 26.1967],
    [91.7453, 26.1961],
    [91.7447, 26.1961]
  ]]
}
```

## Output

The script provides a detailed summary of the test results directly in your terminal, indicating whether each step passed or failed. This is ideal for quick validation and debugging of the backend processing logic.

### Sample Output:
```
============================================================
      MANUAL GEOJSON COORDINATES BACKEND TESTER
============================================================
TARGET AOI: Umananda Island (Manual Test)
COORDINATES: {"type": "Polygon", "coordinates": [[[91.7447, 26.1961], [91.7447, 26.1967], [91.7453, 26.1967], [91.7453, 26.1961], [91.7447, 26.1961]]]}
------------------------------------------------------------

[HEALTH] Testing backend health...
[OK] Backend is running and healthy

[BUILD] Testing AOI creation: Umananda Island (Manual Test)
[OK] AOI created successfully. ID: ...

[SATELLITE] Testing satellite imagery preview...
[OK] Satellite preview successful.
   - Timestamp: ...
   - Cloud Cover: ...
   - Quality: ...

[ANALYSIS] Testing comprehensive analysis: Umananda Island (Manual Test)
[OK] Analysis completed.
   - Success: True
   - Status: completed
   - Detections: 0

[STATUS] Testing system status...
[OK] System status retrieved.
   - System Online: True
   - DB Status: online
   - Satellite Status: operational

============================================================
                    TEST SUMMARY
============================================================
[PASS]   - AOI Creation
[PASS]   - Satellite Preview
[PASS]   - Comprehensive Analysis
[PASS]   - System Status

OVERALL: 4/4 tests passed.

[SUCCESS] All tests passed! The backend is working correctly.
```

## Known Issues and Troubleshooting

### Issue: "No recent satellite imagery available" / "insufficient_data"

**Symptoms:**
- Satellite preview fails with: "No recent satellite imagery available for this area"
- Analysis completes with Status: `insufficient_data`
- Success: `False`, Detections: `0`, Algorithms Used: `[]`
- Data Quality Score: `0.000`

**Root Causes:**
1. **Cloud Cover**: Area covered by clouds blocking satellite view
2. **API Limitations**: Sentinel Hub quota exceeded or rate limiting
3. **Geographic Coverage**: Area not recently imaged by Sentinel-2 satellites
4. **API Credentials**: Missing or invalid Sentinel Hub authentication
5. **Data Availability**: No clear satellite imagery in the requested time range

**Evidence from San Francisco Test:**
```
[SATELLITE] Testing satellite imagery preview...
[WARN] Preview failed or data not available: No recent satellite imagery available for this area

[ANALYSIS] Testing comprehensive analysis: San Francisco Urban Area (Manual Test)
[OK] Analysis completed.
   - Success: False
   - Status: insufficient_data
   - Overall Confidence: 0.000
   - Priority Level: info
   - Detections Found: 0
   - Algorithms Used: []  ← EMPTY - algorithms never ran!
   - Processing Time: 1.7s
   - Data Quality Score: 0.000
   - No environmental changes detected
```

**System Behavior:**
- ✅ **Backend Works Correctly**: API endpoints respond, error handling works
- ✅ **Graceful Degradation**: Returns structured error responses instead of crashes
- ❌ **No Analysis Possible**: Without satellite data, change detection cannot run
- ❌ **Empty Results**: Algorithms don't execute, returning zero detections

**Solutions:**
1. **Try Different Coordinates**: Areas with recent clear satellite imagery
2. **Check Sentinel Hub Setup**: Ensure API credentials are configured
3. **Wait for Better Conditions**: Satellite imagery availability improves over time
4. **Use Coastal Areas**: Often have less cloud cover and more environmental activity

**Verification Commands:**
```bash
# Check if backend can access satellite data
curl -X POST "http://localhost:8000/api/v2/analysis/data-availability/preview" \
  -H "Content-Type: application/json" \
  -d '{"geojson": {"type": "Polygon", "coordinates": [[[COORDINATES]]]}}'
```

---

**Just share coordinates and run - no frontend required! 🚀**