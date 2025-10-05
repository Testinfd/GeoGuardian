# Historical Data Range Feature - Added ✅

## Problem Solved

You asked: **"Can't we get some historical data from Sentinel and analyse that?"**

**Answer: YES!** The system already supported this on the backend, but the frontend didn't expose the controls. Now it does!

## What Was Added

### ✨ **Date Range Selector in Analysis Form**

Users can now choose how far back to search for Sentinel-2 satellite imagery:

- **7 Days** - Very Recent (good for real-time monitoring)
- **30 Days** - Recent (Default, balanced)
- **60 Days** - Extended (better coverage)
- **90 Days** - Historical (maximum coverage)

### Where to Find It

**Location**: `/analysis/new` (New Analysis page)

When creating a new analysis, you'll now see a "Historical Data Range" section **before** selecting the analysis type.

## How It Works

### Backend Flow:
```python
# 1. User selects date range (e.g., 60 days)
date_range_days = 60

# 2. Backend searches backward from today
end_date = datetime.now()
start_date = end_date - timedelta(days=date_range_days)

# 3. Sentinel Hub API searches for images in that period
images = search_sentinel_images(
    geojson=aoi_geometry,
    time_range=(start_date, end_date),
    cloud_coverage < 30%
)

# 4. Returns all suitable images found
# Need minimum 2 images for change detection
```

### Why This Solves "Insufficient Data":

**Before**:
- System defaulted to 30 days
- If only 1 image available in last 30 days → "insufficient data" error
- No way for users to extend the search period

**After**:
- Users can select 60 or 90 days
- More time period = more chances to find 2+ cloud-free images
- Especially helpful in cloudy regions or areas with less frequent coverage

## UI Screenshot Concept

```
┌─────────────────────────────────────────────────┐
│ Historical Data Range                            │
├─────────────────────────────────────────────────┤
│ 🕐 How far back to search for satellite imagery?│
│                                                   │
│ Longer date ranges increase chances of finding   │
│ sufficient data. Sentinel-2 revisits every 2-5   │
│ days.                                            │
│                                                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ 7 Days  │ │30 Days ✓│ │ 60 Days │ │ 90 Days ││
│ │Very     │ │Recent   │ │Extended │ │Historic ││
│ │Recent   │ │Default  │ │         │ │         ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│                                                   │
│ ⚠️ Tip: If you get "insufficient data" errors,  │
│    try increasing the date range to 60-90 days.  │
└─────────────────────────────────────────────────┘
```

## Code Changes

### File: `frontend/src/components/analysis/AnalysisSelector.tsx`

#### 1. Added State Variable:
```typescript
const [dateRangeDays, setDateRangeDays] = useState<number>(30)
```

#### 2. Pass to Backend:
```typescript
await startAnalysis({
  aoi_id: aoi.id,
  analysis_type: selectedType,
  geojson: aoi.geojson,
  date_range_days: dateRangeDays, // ← NEW!
  include_spectral_analysis: true,
  include_visualizations: true,
})
```

#### 3. Added UI Section:
- Date range selector with 4 preset options
- Visual buttons with selection state
- Helpful description and tips
- Warning about insufficient data

## Benefits

### 1. **Solves Insufficient Data Errors**
- Longer date ranges = more images to choose from
- Critical for cloudy regions or sparse coverage areas

### 2. **User Control**
- Users decide between recent vs. historical data
- Can experiment with different ranges

### 3. **Better Success Rate**
- 60-90 day ranges have much higher success rates
- Especially important for first-time users

### 4. **Educational**
- Teaches users about Sentinel-2 revisit frequency
- Explains trade-offs between recency and availability

## Usage Examples

### Example 1: Recent Monitoring (7-30 Days)
**Use Case**: Tracking rapid changes like construction or disaster response

**Settings**:
- Date Range: 7-30 days
- Analysis Type: Urban Development or Change Detection

**Expected Result**: 
- Most recent imagery
- Best for detecting very recent changes
- May fail in cloudy areas

### Example 2: Reliable Analysis (60 Days)
**Use Case**: General environmental monitoring with good coverage

**Settings**:
- Date Range: 60 days (Recommended for most users)
- Analysis Type: Comprehensive or Vegetation

**Expected Result**:
- Good balance of recency and availability
- Higher success rate
- Still relevant for change detection

### Example 3: Maximum Coverage (90 Days)
**Use Case**: First analysis of new AOI, or historically cloudy areas

**Settings**:
- Date Range: 90 days
- Analysis Type: Any

**Expected Result**:
- Maximum chance of finding sufficient data
- May show older changes
- Best for proving the system works

## Handling Different Scenarios

### Scenario 1: Clear Weather Area
- **Problem**: Recent satellite pass had clear skies
- **Solution**: Use 7-30 day range for most recent data
- **Result**: Fast processing, recent results

### Scenario 2: Cloudy Tropical Region
- **Problem**: Frequent cloud cover blocks imagery
- **Solution**: Use 60-90 day range to find cloud-free passes
- **Result**: Higher success rate, slightly older comparison

### Scenario 3: First Time User
- **Problem**: Unsure if their AOI has coverage
- **Solution**: Start with 60 days (safe default)
- **Result**: Good balance, educational

### Scenario 4: Ocean/Water Areas
- **Problem**: Even with 90 days, may lack data
- **Solution**: Date range helps, but location matters more
- **Result**: May still need different AOI location

## Technical Details

### Backend Parameters:
```python
class ComprehensiveAnalysisRequest(BaseModel):
    aoi_id: str
    geojson: Dict[str, Any]
    analysis_type: str = "comprehensive"
    date_range_days: int = Field(30, description="Number of days back to search")
    max_cloud_coverage: float = Field(0.3, description="Max cloud coverage")
    include_spectral_analysis: bool = True
    include_visualizations: bool = True
```

### Frontend Types:
```typescript
export type AnalysisRequest = {
  aoi_id: string
  geojson?: GeoJSONPolygon
  analysis_type: AnalysisType
  date_range_days?: number  // ← Already existed!
  max_cloud_coverage?: number
  include_spectral_analysis?: boolean
  include_visualizations?: boolean
}
```

**Note**: The type already existed! We just needed to wire up the UI.

## Testing

### Test Case 1: Default Behavior
1. Go to `/analysis/new`
2. Select an AOI
3. Default should be **30 Days** (selected)
4. Start analysis
5. Verify backend receives `date_range_days: 30`

### Test Case 2: Change Date Range
1. Go to `/analysis/new`
2. Select **60 Days** option
3. Button should highlight blue
4. Start analysis  
5. Verify backend receives `date_range_days: 60`

### Test Case 3: Insufficient Data → Extend Range
1. Start analysis with 7 days
2. Get "insufficient data" error
3. Retry with 90 days
4. Should have higher chance of success

### Test Case 4: Multiple Retries
1. Can change date range between analyses
2. Each analysis should use its selected range
3. Results should reflect different time periods

## User Guidance

### When to Use Each Range:

| Date Range | Best For | Success Rate | Data Recency |
|-----------|----------|--------------|--------------|
| 7 Days | Emergency monitoring, rapid response | Low ⚠️ | Highest ✅ |
| 30 Days | Standard monitoring, balanced | Medium ✓ | High ✅ |
| 60 Days | Reliable analysis, cloudy areas | High ✅ | Good ✓ |
| 90 Days | Maximum coverage, new AOIs | Highest ✅ | Lower ⚠️ |

### Recommendation Algorithm:
```
IF first_time_user OR cloudy_region OR tropical_area:
    RECOMMEND: 60-90 days
ELIF real_time_monitoring OR clear_weather_area:
    RECOMMEND: 7-30 days
ELSE:
    DEFAULT: 30 days (balanced)
```

## Known Limitations

### 1. Not a Silver Bullet
- Date range helps availability, but can't create data that doesn't exist
- Ocean areas, polar regions, or sensor gaps will still have issues

### 2. Trade-off: Recency vs. Availability
- Longer range = older comparison baseline
- May show changes from weeks/months ago, not just recent

### 3. Processing Time
- Longer ranges don't significantly increase processing time
- Still need to find best 2 images from available set

### 4. Cloud Coverage Still Matters
- Even 90 days won't help if all images are cloudy
- System filters for max_cloud_coverage < 30%

## Future Enhancements

### Possible Additions:
1. **Smart Recommendations**
   - Analyze AOI location and suggest optimal date range
   - Check historical cloud coverage statistics

2. **Preview Data Availability**
   - Show how many images found for each date range option
   - Display before running full analysis

3. **Custom Date Range**
   - Allow users to enter specific dates
   - Useful for studying specific events

4. **Seasonal Awareness**
   - Suggest avoiding rainy seasons in tropical areas
   - Recommend dry season for better coverage

5. **Multi-Temporal Analysis**
   - Use all images in date range, not just 2
   - Show progression over time

## Summary

✅ **What Changed**:
- Added date range selector UI to analysis form
- Now passes `date_range_days` to backend API
- Defaults to 30 days, options for 7/60/90 days

✅ **Problem Solved**:
- Users can now access historical Sentinel-2 data
- Reduces "insufficient data" errors significantly
- Provides control over recency vs. availability trade-off

✅ **User Impact**:
- More successful analyses
- Better understanding of satellite data constraints
- Flexibility to optimize for their use case

✅ **Technical Impact**:
- No backend changes needed (already supported)
- Clean UI integration
- Type-safe implementation

---

**Status**: ✅ **Feature Complete**
**Testing**: ⏳ **Ready for user testing**
**Documentation**: ✅ **Complete**
**Breaking Changes**: ❌ **None** (backward compatible)

