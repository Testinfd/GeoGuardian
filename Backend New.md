### **The Technical Guide: Evolving the Backend**

Let's go through the necessary code changes.

#### **Step 1: Refactor and Enhance Your Project Structure**

Our logic is getting more complex, so our code needs to be better organized.

**New backend/app/ structure:**

codeCode

````
/app
|-- /api              # All API routes will live here
|   |-- __init__.py
|   |-- endpoints.py
|-- /core             # Core logic and engines
|   |-- __init__.py
|   |-- analysis_engine.py  # NEW: All our smart logic goes here
|   |-- sentinel.py         # NEW: Code for fetching data from Sentinel Hub
|-- /models           # Database models (no change)
|-- /tasks            # Background tasks
|   |-- __init__.py
|   |-- analysis_tasks.py # Our main background task logic
|-- __init__.py
|-- main.py           # The main FastAPI app, now much cleaner```

#### **Step 2: Build the `sentinel.py` Data Fetcher**

This module's only job is to get satellite data.

```python
# In: app/core/sentinel.py
from sentinelhub import BBox, CRS, DataCollection, SentinelHubRequest, MimeType, SHConfig
import numpy as np

# ... (Configure SHConfig with your credentials from .env) ...

def fetch_bands_for_aoi(geojson: dict, time_interval: tuple) -> np.ndarray:
    """
    Fetches the required Sentinel-2 bands (B2, B3, B4, B8, B11) for a given AOI.
    Returns a NumPy array of shape (height, width, 5).
    """
    # Create a BBox from the GeoJSON for the request
    aoi_bbox = BBox.from_geojson(geojson, crs=CRS.WGS84)

    # Evalscript to request the 5 bands we need for our indices
    evalscript_bands = """
        //VERSION=3
        function setup() {
            return {
                input: ["B02", "B03", "B04", "B08", "B11"], // Blue, Green, Red, NIR, SWIR
                output: { bands: 5, sampleType: "FLOAT32" }
            };
        }
        function evaluatePixel(sample) {
            return [sample.B02, sample.B03, sample.B04, sample.B08, sample.B11];
        }
    """
    request = SentinelHubRequest(
        evalscript=evalscript_bands,
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=DataCollection.SENTINEL2_L2A, # L2A is analysis-ready
                time_interval=time_interval,
                other_args={"maxcc": 0.2} # Max 20% cloud cover
            )
        ],
        responses=[SentinelHubRequest.output_response('default', MimeType.TIFF)],
        bbox=aoi_bbox,
        size=[512, 512], # Standardized size
        config=SHConfig()
    )
    # The result is a list with one item, the numpy array
    image_data = request.get_data()[0]
    return image_data```

#### **Step 3: Build the New `analysis_engine.py` (The Upgraded Brain)**

This is the heart of the evolution.

```python
# In: app/core/analysis_engine.py
import numpy as np
import cv2

class AnalysisEngine:
    def __init__(self, before_bands: np.ndarray, after_bands: np.ndarray):
        self.before_bands = self._bands_to_dict(before_bands)
        self.after_bands = self._bands_to_dict(after_bands)
        self.epsilon = 1e-8

    def _bands_to_dict(self, bands_array):
        return {
            'B02': bands_array[:, :, 0], 'B03': bands_array[:, :, 1],
            'B04': bands_array[:, :, 2], 'B08': bands_array[:, :, 3],
            'B11': bands_array[:, :, 4]
        }

    def calculate_indices(self, bands_dict):
        # ... (The exact same calculate_indices function from our previous discussion) ...
        # It should return a dictionary: {'ndvi': ..., 'ndwi': ..., 'mndwi': ..., 'bsi': ...}
        indices = {}
        # NDVI
        indices['ndvi'] = (bands_dict['B08'] - bands_dict['B04']) / (bands_dict['B08'] + bands_dict['B04'] + self.epsilon)
        # NDWI
        indices['ndwi'] = (bands_dict['B03'] - bands_dict['B08']) / (bands_dict['B03'] + bands_dict['B08'] + self.epsilon)
        # MNDWI
        indices['mndwi'] = (bands_dict['B03'] - bands_dict['B11']) / (bands_dict['B03'] + bands_dict['B11'] + self.epsilon)
        # BSI
        indices['bsi'] = ((bands_dict['B11'] + bands_dict['B04']) - (bands_dict['B08'] + bands_dict['B02'])) / \
                         ((bands_dict['B11'] + bands_dict['B04']) + (bands_dict['B08'] + bands_dict['B02']) + self.epsilon)
        return indices


    def run_ewma_change_detection(self, before_index, after_index, lambda_param=0.3):
        """Inspired by nrt: detects significant change using EWMA."""
        baseline_mean = np.mean(before_index)
        baseline_std = np.std(before_index)
        
        # Calculate EWMA on the "after" image pixels
        ewma_after = baseline_mean * (1 - lambda_param) + after_index * lambda_param
        
        # Find pixels where the deviation is significant (e.g., > 3 standard deviations)
        deviation = np.abs(ewma_after - baseline_mean)
        change_mask = (deviation > (3 * baseline_std)).astype(np.uint8)
        return change_mask

    def analyze_shape_complexity(self, change_mask):
        """Inspired by VedgeSat: simple shape analysis to hint at construction."""
        contours, _ = cv2.findContours(change_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return 0.0

        # Calculate the ratio of the contour area to the area of its bounding box.
        # Geometric shapes (squares, rectangles) will have a ratio close to 1.0.
        # Organic shapes (blobs) will have a lower ratio.
        total_solidity = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area == 0: continue
            _, _, w, h = cv2.boundingRect(cnt)
            rect_area = w * h
            total_solidity += area / rect_area
        
        return total_solidity / len(contours) if contours else 0.0

    def run_full_analysis(self):
        """The main analysis pipeline."""
        indices_before = self.calculate_indices(self.before_bands)
        indices_after = self.calculate_indices(self.after_bands)

        # 1. Detect change for each key index using EWMA
        ndvi_change_mask = self.run_ewma_change_detection(indices_before['ndvi'], indices_after['ndvi'])
        bsi_change_mask = self.run_ewma_change_detection(indices_before['bsi'], indices_after['bsi'])

        # 2. Analyze the shape of the detected changes
        bsi_shape_complexity = self.analyze_shape_complexity(bsi_change_mask)

        # 3. Classify the anomaly based on the results
        anomaly_type = "Unclassified Anomaly"
        confidence = 0.5
        
        # More sophisticated rule-based classification
        if np.sum(bsi_change_mask) > 100 and bsi_shape_complexity > 0.75:
             anomaly_type = "High-Confidence: Potential Construction"
             confidence = 0.9
        elif np.sum(ndvi_change_mask) > 100:
             anomaly_type = "Potential Vegetation/Algal Change"
             confidence = 0.8
        
        # Combine masks to create a final visual highlight mask
        final_change_mask = cv2.bitwise_or(ndvi_change_mask, bsi_change_mask)
        
        return {
            "anomaly_type": anomaly_type,
            "confidence": confidence,
            "change_mask": final_change_mask # This mask will be used to create the GIF overlay
        }
````

#### **Step 4: Update the Background Task**

Your analysis_tasks.py now orchestrates this new, more powerful engine.

codePython

```
# In: app/tasks/analysis_tasks.py
from app.core.sentinel import fetch_bands_for_aoi
from app.core.analysis_engine import AnalysisEngine
# ... other imports for saving to DB, creating GIFs, sending emails ...

def run_analysis_for_aoi(aoi_id: UUID):
    # 1. Fetch AOI details (geojson) from the database
    aoi = get_aoi_from_db(aoi_id)

    # 2. Define time ranges
    time_before = ('2024-09-01', '2024-09-10') # Example
    time_after = ('2025-08-20', '2025-09-05') # Example

    # 3. Fetch band data from Sentinel Hub
    before_bands = fetch_bands_for_aoi(aoi.geojson, time_before)
    after_bands = fetch_bands_for_aoi(aoi.geojson, time_after)

    # 4. Instantiate and run the new analysis engine
    engine = AnalysisEngine(before_bands, after_bands)
    result = engine.run_full_analysis()

    # 5. Create the GIF
    # You'll need a function that takes the raw "after" image and the `change_mask`
    # to create a red overlay highlighting the changes.
    gif_url = create_highlight_gif(after_bands, result['change_mask'])

    # 6. Save the alert to the database
    save_alert_to_db(aoi_id, gif_url, result['anomaly_type'], result['confidence'])

    # 7. Send the email alert
    send_email_alert(...)

    return {"status": "complete", "result": result}
```

This detailed plan provides a clear, technical path to evolve your MVP. It intelligently incorporates proven methods from professional open-source projects, significantly boosting your project's credibility and technical depth, all without requiring you to train a single ML model. This is the smart way to build a winning hackathon project.