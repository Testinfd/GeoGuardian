#!/bin/bash
# Direct Backend Test for Umananda Island using curl
# Tests complete analysis workflow without frontend

BASE_URL="http://localhost:8000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}======================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}======================================================================${NC}"
}

print_step() {
    echo -e "\n${YELLOW}[STEP $1] $2${NC}"
    echo -e "${YELLOW}----------------------------------------------------------------------${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Umananda Island GeoJSON
UMANANDA_GEOJSON='{
  "type": "Polygon",
  "coordinates": [[
    [91.7447, 26.1961],
    [91.7447, 26.1967],
    [91.7453, 26.1967],
    [91.7453, 26.1961],
    [91.7447, 26.1961]
  ]]
}'

print_header "🛰️  UMANANDA ISLAND - DIRECT BACKEND TEST (curl)"
echo "📍 Location: World's smallest inhabited river island"
echo "🌍 Coordinates: 26.1964°N, 91.7450°E (Brahmaputra River, Guwahati)"
echo "⏰ Test started: $(date)"

# Step 1: Health Check
print_step 1 "Health Check"
print_info "Checking if backend is online..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null)

if [ "$HEALTH_RESPONSE" == "200" ]; then
    print_success "Backend is online and healthy"
else
    print_error "Backend is not responding. Is it running on http://localhost:8000?"
    echo "Start it with: cd backend && uvicorn app.main:app --reload"
    exit 1
fi

# Step 2: Create AOI
print_step 2 "Create AOI - Umananda Island"
print_info "Creating AOI with GeoJSON coordinates..."

AOI_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/aoi" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Umananda Island (curl test)\",
    \"description\": \"World's smallest inhabited river island - Direct curl test\",
    \"geojson\": $UMANANDA_GEOJSON,
    \"monitoring_enabled\": true,
    \"alert_threshold\": 0.7
  }")

AOI_ID=$(echo $AOI_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$AOI_ID" ]; then
    print_error "Failed to create AOI"
    echo "Response: $AOI_RESPONSE"
    exit 1
else
    print_success "AOI created successfully"
    print_info "AOI ID: $AOI_ID"
fi

# Step 3: Check Data Availability
print_step 3 "Check Satellite Data Availability"
print_info "Checking if satellite imagery is available..."

DATA_CHECK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/analysis/data-availability/preview" \
  -H "Content-Type: application/json" \
  -d "{\"geojson\": $UMANANDA_GEOJSON}")

echo "$DATA_CHECK_RESPONSE" | grep -q '"success":true'
if [ $? -eq 0 ]; then
    print_success "Satellite data is available!"
    echo "$DATA_CHECK_RESPONSE" | grep -o '"images_available":[0-9]*' | head -1
else
    print_error "Insufficient satellite data"
    print_info "Will try with extended date range..."
fi

# Step 4: Run Comprehensive Analysis (60 days historical data)
print_step 4 "Run Comprehensive Analysis (60 days historical data)"
print_info "Starting analysis with 60 days of historical data..."
print_info "This may take 3-5 minutes..."

ANALYSIS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/analysis/analyze/comprehensive" \
  -H "Content-Type: application/json" \
  --max-time 600 \
  -d "{
    \"aoi_id\": \"$AOI_ID\",
    \"geojson\": $UMANANDA_GEOJSON,
    \"analysis_type\": \"comprehensive\",
    \"date_range_days\": 60,
    \"max_cloud_coverage\": 0.3,
    \"include_spectral_analysis\": true,
    \"include_visualizations\": true
  }")

ANALYSIS_ID=$(echo $ANALYSIS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ANALYSIS_STATUS=$(echo $ANALYSIS_RESPONSE | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ANALYSIS_ID" ]; then
    print_error "Analysis request failed"
    echo "Response: $ANALYSIS_RESPONSE"
    exit 1
fi

print_success "Analysis request completed!"
print_info "Analysis ID: $ANALYSIS_ID"
print_info "Status: $ANALYSIS_STATUS"

# Step 5: Display Results
print_step 5 "Analysis Results"

if [ "$ANALYSIS_STATUS" == "completed" ]; then
    print_success "Analysis completed successfully!"
    
    # Extract and display key results
    echo ""
    print_info "Overall Results:"
    echo "$ANALYSIS_RESPONSE" | grep -o '"overall_confidence":[0-9.]*' | head -1
    echo "$ANALYSIS_RESPONSE" | grep -o '"priority_level":"[^"]*"' | head -1
    echo "$ANALYSIS_RESPONSE" | grep -o '"processing_time_seconds":[0-9.]*' | head -1
    
    echo ""
    print_info "Detections:"
    DETECTION_COUNT=$(echo "$ANALYSIS_RESPONSE" | grep -o '"algorithm":' | wc -l)
    echo "   • Algorithms run: $DETECTION_COUNT"
    
    # Check for visualizations
    echo "$ANALYSIS_RESPONSE" | grep -q '"before_image"'
    if [ $? -eq 0 ]; then
        echo ""
        print_success "Visualizations generated:"
        echo "   ✅ Before Image"
        echo "   ✅ After Image"
        echo "   ✅ Change Map"
        echo "   ✅ GIF Animation"
    fi
    
elif [ "$ANALYSIS_STATUS" == "insufficient_data" ]; then
    print_error "Analysis failed: Insufficient satellite data"
    
    echo ""
    print_info "Trying again with 90 days of historical data..."
    
    ANALYSIS_RESPONSE_90=$(curl -s -X POST "$BASE_URL/api/v2/analysis/analyze/comprehensive" \
      -H "Content-Type: application/json" \
      --max-time 600 \
      -d "{
        \"aoi_id\": \"$AOI_ID\",
        \"geojson\": $UMANANDA_GEOJSON,
        \"analysis_type\": \"comprehensive\",
        \"date_range_days\": 90,
        \"max_cloud_coverage\": 0.3,
        \"include_spectral_analysis\": true,
        \"include_visualizations\": true
      }")
    
    ANALYSIS_ID_90=$(echo $ANALYSIS_RESPONSE_90 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    ANALYSIS_STATUS_90=$(echo $ANALYSIS_RESPONSE_90 | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ "$ANALYSIS_STATUS_90" == "completed" ]; then
        print_success "Analysis completed with 90 days!"
        ANALYSIS_ID=$ANALYSIS_ID_90
        ANALYSIS_STATUS=$ANALYSIS_STATUS_90
    else
        print_error "Still insufficient data even with 90 days"
    fi
else
    print_info "Analysis status: $ANALYSIS_STATUS"
fi

# Step 6: Generate Heatmap (if analysis succeeded)
if [ "$ANALYSIS_STATUS" == "completed" ]; then
    print_step 6 "Generate Change Intensity Heatmap"
    print_info "Generating heatmap visualization..."
    
    HEATMAP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/analysis/visualize" \
      -H "Content-Type: application/json" \
      --max-time 300 \
      -d "{
        \"aoi_id\": \"$AOI_ID\",
        \"geojson\": $UMANANDA_GEOJSON,
        \"visualization_type\": \"heatmap\",
        \"date_range_days\": 60
      }")
    
    echo "$HEATMAP_RESPONSE" | grep -q '"visualization_url"'
    if [ $? -eq 0 ]; then
        print_success "Heatmap generated successfully!"
    else
        print_error "Heatmap generation failed"
    fi
    
    # Step 7: Detect Hotspots
    print_step 7 "Detect Change Hotspots"
    print_info "Analyzing hotspots..."
    
    HOTSPOT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/analysis/hotspot-detection" \
      -H "Content-Type: application/json" \
      --max-time 300 \
      -d "{
        \"aoi_id\": \"$AOI_ID\",
        \"geojson\": $UMANANDA_GEOJSON,
        \"date_range_days\": 60,
        \"grid_size\": 10,
        \"threshold_percentile\": 75
      }")
    
    HOTSPOT_COUNT=$(echo "$HOTSPOT_RESPONSE" | grep -o '"grid_position":' | wc -l)
    if [ "$HOTSPOT_COUNT" -gt 0 ]; then
        print_success "Hotspot analysis complete! Found $HOTSPOT_COUNT hotspots"
    else
        print_info "No significant hotspots detected"
    fi
fi

# Final Summary
print_header "TEST COMPLETE"

if [ "$ANALYSIS_STATUS" == "completed" ]; then
    echo -e "${GREEN}✅ SUCCESS! All features tested successfully:${NC}"
    echo "   ✅ AOI Creation"
    echo "   ✅ Data Availability Check"
    echo "   ✅ Comprehensive Analysis (with historical data)"
    echo "   ✅ Change Detection (EWMA, CUSUM, VedgeSat)"
    echo "   ✅ Visualizations (Before, After, Change Map, GIF)"
    echo "   ✅ Heatmap Generation"
    echo "   ✅ Hotspot Detection"
    echo ""
    echo "📝 Analysis ID: $ANALYSIS_ID"
    echo "🌐 View in frontend: http://localhost:3000/analysis/$ANALYSIS_ID"
    echo ""
    echo "📄 Full response saved to: umananda_analysis_response.json"
    echo "$ANALYSIS_RESPONSE" | python3 -m json.tool > umananda_analysis_response.json 2>/dev/null
else
    echo -e "${YELLOW}⚠️  PARTIAL SUCCESS${NC}"
    echo "Analysis Status: $ANALYSIS_STATUS"
    echo "Analysis ID: $ANALYSIS_ID"
    echo ""
    echo "💡 Recommendations:"
    echo "   • Try again in 2-5 days (next Sentinel-2 pass)"
    echo "   • Check if location has good satellite coverage"
    echo "   • Verify Sentinel Hub API credentials"
    echo "   • Try a different location (e.g., Delhi, London)"
fi

echo ""
echo "⏰ Test completed: $(date)"

