**Version:** 2.0 (MVP Sprint Edition)  
**Project:** GeoGuardian (formerly Project Chilika-Svasthya)

**1. Vision:**  
To democratize planetary defense by empowering any local community with the tools of an intelligence agency—satellite imaging, AI change detection, and instant alerts—to protect their own environment, for free.

**2. Problem Statement:**

- Environmental anomalies like illegal dumping or algal blooms are often detected weeks too late.
    
- Valuable satellite data exists but is inaccessible to the non-experts who need it most (local NGOs, community groups).
    

**3. Target Personas:**

- **Hackathon Judge:** Needs to see a live, end-to-end demo: a user draws an area, and a GIF alert is generated and sent within 90 seconds.
    
- **Local NGO Lead:** Needs a tangible, shareable piece of evidence (the GIF) to support reports and action.
    
- **Eco-Club Student:** Wants to feel empowered by contributing to a real-world monitoring system through crowd-verification.
    

**4. Feature Priorities (MoSCoW Method):**

|   |   |   |   |
|---|---|---|---|
|ID|Feature|Priority|Acceptance Criteria|
|**F1**|**User Authentication (Google OAuth)**|**Must-Have (P0)**|User can log in via a single click using their Google account.|
|**F2**|**Map-Based AOI Selection**|**Must-Have (P0)**|User can draw up to 5 polygonal Areas of Interest (AOIs) on a Leaflet map.|
|**F3**|**Server-Side Analysis Engine**|**Must-Have (P0)**|Backend receives an AOI, fetches two Sentinel-2 images (recent vs. ~10 days prior), calculates NDVI difference using NumPy, and saves a before/after GIF. This is our **guaranteed MVP**.|
|**F4**|**Email Alert System**|**Must-Have (P0)**|Upon successful analysis, the backend sends a formatted HTML email via SendGrid containing the GIF to the logged-in user.|
|**F5**|**Alert Dashboard & Verification**|**Must-Have (P0)**|A simple dashboard lists generated alerts. Users can vote "Agree" or "Dismiss" on an alert.|
|**F6**|**Client-Side WebGL Renderer**|**Should-Have (P1)**|As a performance enhancement, the frontend attempts to perform the NDVI diff on the GPU. If this fails or is too slow, we rely 100% on the server-side engine (F3).|
|**F7**|**Deployment**|**Must-Have (P0)**|Backend is containerized and running on Akash. Frontend is live on Vercel.|
|**F8**|**Telegram Bot Alerts**|**Could-Have (P2)**|If time permits, add an option to link a Telegram account and receive alerts.|
|**F9**|**User Accounts & Profiles**|**Won't-Have**|Out of scope for the hackathon.|
|**F10**|**On-Chain Storage**|**Won't-Have**|Out of scope for the hackathon.|

**5. Success Metrics:**

- **End-to-End Demo Time:** < 90 seconds from drawing an AOI to receiving the email alert.
    
- **Technical Stack:** Demonstrates proficiency in a full-stack application (Python, Next.js), DevOps (Docker, Akash), and a clever algorithmic approach (client-side offload).