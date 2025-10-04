# Feature Documentation: Multi-Sensor Fusion & Composite Risk Scoring

This document provides a detailed guide for implementing the Multi-Sensor Fusion and Composite Risk Scoring engine in the GeoGuardian platform.

---

### 1. Overview

**Goal:** To increase alert accuracy and reduce false positives by analyzing data from multiple satellite bands. Instead of relying solely on NDVI, this system will calculate a composite risk score based on changes in several spectral indices, applying contextual rules to classify the type of environmental change.

**Core Technology:** A rules engine that processes normalized changes in key spectral indices (NDVI, NDBI, NDWI) to produce a weighted, context-aware risk score.

---

### 2. Backend Implementation Guide

The backend will be enhanced to calculate additional spectral indices and apply the risk-scoring logic.

#### **Step 2.1: Enhance the Spectral Analyzer**

Modify `backend/app/core/spectral_analyzer.py` to calculate new indices. Sentinel-2 bands are required for these calculations (e.g., NIR, SWIR, Red).

```python
# backend/app/core/spectral_analyzer.py

# Assuming you have a function to get the required bands (e.g., get_sentinel_bands)

def calculate_ndvi(nir_band, red_band):
    # Existing NDVI calculation
    return (nir_band - red_band) / (nir_band + red_band)

def calculate_ndbi(swir_band, nir_band):
    """Calculates Normalized Difference Built-Up Index."""
    # Used to identify urban/built-up areas
    return (swir_band - nir_band) / (swir_band + nir_band)

def calculate_ndwi(green_band, nir_band):
    """Calculates Normalized Difference Water Index."""
    # Used to identify water bodies
    return (green_band - nir_band) / (green_band + nir_band)

# You will need to adapt your data fetching logic in `sentinel.py` or `satellite_data.py`
# to retrieve the specific bands needed: Red, Green, NIR, and SWIR.

```

#### **Step 2.2: Create the Risk Scoring Module**

Create a new file: `backend/app/core/risk_scorer.py`. This module will house the rules engine.

```python
# backend/app/core/risk_scorer.py

def calculate_composite_risk(delta_ndvi, delta_ndbi, delta_ndwi):
    """
    Calculates a composite risk score and classifies the change.
    
    Args:
        delta_ndvi (float): Change in NDVI (new - old).
        delta_ndbi (float): Change in NDBI.
        delta_ndwi (float): Change in NDWI.

    Returns:
        dict: A dictionary containing the risk score and classification.
    """
    base_risk_score = 0
    classification = "Unclassified Change"

    # Rule 1: Potential Illegal Construction
    # Significant drop in vegetation, significant rise in built-up index
    if delta_ndvi < -0.2 and delta_ndbi > 0.15:
        base_risk_score = 75
        classification = "Probable Unauthorized Construction"
        # Weight the score higher for this rule
        final_score = base_risk_score * 1.5 

    # Rule 2: Potential Illegal Mining / Water Body Alteration
    # Significant drop in vegetation, significant change in water index
    elif delta_ndvi < -0.3 and abs(delta_ndwi) > 0.2:
        base_risk_score = 85
        classification = "Probable Illegal Mining/Quarrying"
        final_score = base_risk_score * 1.8

    # Rule 3: Deforestation
    # General significant drop in vegetation without other strong signals
    elif delta_ndvi < -0.25:
        base_risk_score = 60
        classification = "Probable Deforestation"
        final_score = base_risk_score * 1.2
        
    # Rule 4: Seasonal Agriculture (Low Priority)
    # Moderate, cyclical changes might be filtered upstream, but as a fallback:
    elif abs(delta_ndvi) < 0.15 and abs(delta_ndbi) < 0.1:
        base_risk_score = 10
        classification = "Likely Seasonal Fluctuation"
        final_score = base_risk_score * 0.5

    else:
        # Default score for minor changes
        final_score = (abs(delta_ndvi) + abs(delta_ndbi)) * 100

    return {
        "risk_score": min(int(final_score), 100), # Cap score at 100
        "classification": classification
    }

```

#### **Step 2.3: Integrate into the Analysis Engine**

Modify `backend/app/core/analysis_engine.py` to use the new indices and the risk scorer.

```python
# In backend/app/core/analysis_engine.py

# ... other imports
from app.core import spectral_analyzer
from app.core import risk_scorer

# ...

class AnalysisEngine:
    def run_change_detection(self, aoi, start_date, end_date):
        # ... (logic to get satellite data for two dates)
        
        # Assume you get two sets of bands: before_bands, after_bands
        
        # Calculate indices for both dates
        ndvi_before = spectral_analyzer.calculate_ndvi(before_bands['nir'], before_bands['red'])
        ndbi_before = spectral_analyzer.calculate_ndbi(before_bands['swir'], before_bands['nir'])
        ndwi_before = spectral_analyzer.calculate_ndwi(before_bands['green'], before_bands['nir'])

        ndvi_after = spectral_analyzer.calculate_ndvi(after_bands['nir'], after_bands['red'])
        ndbi_after = spectral_analyzer.calculate_ndbi(after_bands['swir'], after_bands['nir'])
        ndwi_after = spectral_analyzer.calculate_ndwi(after_bands['green'], after_bands['nir'])

        # Calculate the change (delta)
        delta_ndvi = np.mean(ndvi_after) - np.mean(ndvi_before)
        delta_ndbi = np.mean(ndbi_after) - np.mean(ndbi_before)
        delta_ndwi = np.mean(ndwi_after) - np.mean(ndwi_before)

        # Get composite risk score
        risk_analysis = risk_scorer.calculate_composite_risk(delta_ndvi, delta_ndbi, delta_ndwi)

        # ... (logic to save analysis results)
        
        # Add the new risk score and classification to the results
        analysis_result = {
            # ... other data
            "risk_score": risk_analysis["risk_score"],
            "classification": risk_analysis["classification"],
            "delta_ndvi": delta_ndvi
        }

        # Trigger alert based on the new risk score
        if analysis_result["risk_score"] > 50: # Threshold for creating an alert
            self.create_alert_from_analysis(aoi, analysis_result)
            
        return analysis_result
```

#### **Step 2.4: Update Database Models**

In your database models (e.g., `backend/app/models/alerts.py` or equivalent), add fields to store the new information:

- `risk_score: int`
- `classification: str`

Remember to create and apply a database migration.

---

### 3. Frontend Implementation Guide

The frontend needs to display the risk score and classification.

#### **Step 3.1: Update Alert Components**

In `frontend/src/components/alerts/AlertVerification.tsx` and `frontend/src/app/alerts/[id]/page.tsx`:

- **Display Risk Score:** Show the `risk_score` prominently, perhaps with a progress bar or a colored badge (e.g., green for low, yellow for medium, red for high).
- **Display Classification:** Display the `classification` string (e.g., "Probable Unauthorized Construction") as the primary title or subtitle of the alert.

Example in a React component:

```jsx
// In an alert component

const getRiskColor = (score) => {
  if (score > 75) return 'bg-red-500';
  if (score > 50) return 'bg-yellow-500';
  return 'bg-green-500';
};

// ... inside the component render
<div>
  <h3 className="font-bold">{alert.classification}</h3>
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div 
      className={`h-2.5 rounded-full ${getRiskColor(alert.risk_score)}`}
      style={{ width: `${alert.risk_score}%` }}
    ></div>
  </div>
  <p>Risk Score: {alert.risk_score}</p>
</div>
```

---

### 4. Summary

This multi-sensor fusion approach elevates the intelligence of the platform significantly. It moves beyond simple change detection to provide actionable, classified insights. The key implementation steps are fetching the necessary satellite bands, calculating multiple indices, and applying the contextual rules in the `risk_scorer` module.
