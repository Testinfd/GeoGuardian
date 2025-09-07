**Primary Objective:** Build a robust API that can accept a user-defined area, orchestrate a satellite image analysis task, and deliver a visual alert.

**Core Tech Stack:**

- **Framework:** Python 3.10, FastAPI
    
- **Database:** Neon.tech (PostgreSQL) with SQLModel for ORM.
    
- **Task Queue:** FastAPI BackgroundTasks for the MVP.
    
- **Image Libs:** sentinelhub-py, numpy, opencv-python, imageio (for GIF creation).
    
- **Alerting:** sendgrid
    

**Database Schema (SQLModel):**

codePython

```
# In app/models/models.py
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(sa_column=Column("email", String, unique=True))
    # ... other OAuth fields

class AOI(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    owner_email: str
    geojson: Dict = Field(sa_column=Column(JSONB))
    # ... other fields

class Alert(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    aoi_id: UUID = Field(foreign_key="aoi.id")
    gif_url: str
    anomaly_type: str
    confidence: float
    # ... other fields
```

**API Contract (Version 1):**

This is the promise you make to the frontend.

|   |   |   |   |   |
|---|---|---|---|---|
|Method|Endpoint|Auth Required|Body|Success Response (201/200)|
|POST|/api/v1/aoi|Yes (JWT)|{ "name": "Brahmani River Watch", "geojson": {...} }|{"aoi_id": "uuid-123", "status": "Analysis Queued"}|
|GET|/api/v1/aoi/{aoi_id}/alerts|Yes (JWT)|(None)|[{"alert_id": "uuid-456", "gif_url": "...", ...}]|
|POST|/api/v1/alerts/{alert_id}/verify|Yes (JWT)|{ "vote": "agree" }|{"status": "Verification Recorded"}|

**Core Logic Flow (The analyze_aoi Background Task):**

1. **Receive aoi_id**.
    
2. **Fetch AOI data** from the database.
    
3. **Construct Sentinel Hub Request:**
    
    - Use the AOI's geojson to define the bbox.
        
    - Query for two time ranges: T-1 (last 24h to 10 days ago) and T-2 (11 days ago to 20 days ago). Request True-Color (RGB) and NDVI bands. Filter for < 20% cloud cover.
        
4. **Download Images:** Get the before and after image arrays from Sentinel Hub.
    
5. **Run NumPy Analysis:** Calculate the pixel-wise difference in the NDVI band: delta = ndvi_after - ndvi_before.
    
6. **Find Anomalies:** Identify clusters of pixels where delta exceeds a certain threshold (e.g., > 0.2 for potential blooms, < -0.15 for potential construction/deforestation).
    
7. **Create the GIF:** Use imageio to create a 3-frame GIF: the "before" RGB image, the "after" RGB image, and the "after" image with anomalies highlighted in a red overlay.
    
8. **Store the GIF:** Upload the GIF to a public storage (Supabase Storage is free and easy).
    
9. **Save the Alert:** Create a new Alert record in the database with the GIF URL and analysis results.
    
10. **Send the Email:** Use SendGrid to send a formatted email to the user with the GIF and a link back to the dashboard.
    

---