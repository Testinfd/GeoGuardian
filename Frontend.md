**Primary Objective:** Build a slick, intuitive, and map-centric interface that allows users to define areas, task the monitoring engine, and review visual alerts.

**Core Tech Stack:**

- **Framework:** Next.js 14 (App Router) + TypeScript
    
- **State Management:** Zustand (simple and powerful)
    
- **Styling:** Tailwind CSS
    
- **Map:** react-leaflet with react-leaflet-draw for AOI selection.
    
- **Authentication:** NextAuth.js with the Google Provider.
    
- **Data Fetching:** axios or react-query.
    

**The User Flow (Component by Component):**

1. **The Login Screen (/login):**
    
    - **Component:** LoginButton.
        
    - **Functionality:** A single, prominent button: "Sign in with Google." Uses NextAuth.js to handle the entire OAuth flow. After login, redirects to the main dashboard.
        
2. **The Main Dashboard (/):**
    
    - **Layout:** A two-panel layout. A large map panel on the left (80% width) and a smaller control/alert panel on the right (20% width).
        
    - **Component 1: MapManager:**
        
        - Renders a Leaflet map.
            
        - Includes the react-leaflet-draw toolbar, allowing users to draw polygons.
            
        - When a user completes a polygon, a modal pops up asking for a name for the new AOI.
            
        - On submit, it makes a POST request to /api/v1/aoi with the name and GeoJSON.
            
    - **Component 2: AOIList (in the right panel):**
        
        - Fetches and displays a list of the user's currently monitored AOIs.
            
        - Each item shows the AOI name and a status icon (e.g., "Monitoring," "Alert Found").
            
        - Clicking an AOI zooms the map to that location and opens the Alert Viewer.
            
    - **Component 3: AlertViewer (replaces AOIList when an AOI is selected):**
        
        - Fetches data from /api/v1/aoi/{aoi_id}/alerts.
            
        - Displays the latest alert GIF prominently.
            
        - Shows the anomaly type and confidence score.
            
        - Includes the "Agree" and "Dismiss" buttons, which fire POST requests to the verification endpoint.
            

**The "Contract" - Mock API Data:**

Use this data to build the entire UI before the backend is live.

codeJavaScript

```
// Mock data for a single alert
const mockAlert = {
  alert_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  gif_url: "https://i.imgur.com/example.gif", // Use a real GIF for testing
  anomaly_type: "Potential Algal Bloom",
  confidence: 0.88,
  timestamp: "2025-09-07T10:00:00Z",
  verifications: {
    agrees: 1,
    dismisses: 0
  }
};
```