# GeoGuardian: An Open-Source Environmental Monitoring Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status: MVP](https://img.shields.io/badge/status-MVP-green.svg)](https://github.com/your-org/geoguardian)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-teal.svg)](https://fastapi.tiangolo.com/)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js-black.svg)](https://nextjs.org/)
[![Deployment: Akash](https://img.shields.io/badge/Deployment-Akash-red.svg)](https://akash.network/)

GeoGuardian is a scalable, open-source platform that democratizes access to satellite-based environmental monitoring. It empowers local communities, NGOs, and researchers to autonomously monitor any Area of Interest (AOI) on Earth for significant ecological changes using Sentinel-2 satellite imagery and a lightweight AI detection engine.

**Our Vision:** To provide a planetary-scale, user-driven, early-warning system that turns satellite data into actionable environmental intelligence, for free.

 
*(Note: Replace with a real GIF of your final product)*

---

## 🚀 The Problem: Data Inaccessibility

Critical environmental events—such as illegal deforestation, unauthorized construction, agricultural expansion, and harmful algal blooms—are often detected weeks or months after they occur. While satellite data to detect these changes exists, it has historically been locked behind a wall of complexity, requiring expensive software and specialized GIS expertise. This leaves local stakeholders, who are most affected by these changes, powerless to act in a timely manner.

GeoGuardian was built to solve this. We provide a "3-minute-to-insight" platform that allows any user, regardless of technical skill, to task a satellite monitoring system and receive visual proof of environmental change.

## ✨ Core Features (MVP)

*   **User-Defined Monitoring:** Authenticated users can define up to five custom Areas of Interest (AOIs) anywhere on the globe using an intuitive map interface.
*   **Automated Satellite Tasking:** For each AOI, GeoGuardian's backend automatically queries the Sentinel Hub API for the latest cloud-free Sentinel-2 satellite imagery.
*   **AI-Powered Change Detection:** A lightweight, client-side rendering engine (with a robust server-side fallback) performs a pixel-level analysis of temporal changes in key spectral indices like NDVI. This allows for the rapid detection of anomalies.
*   **Visual Alert Generation:** When a significant change is detected, the system automatically generates a shareable before-and-after GIF, providing clear, visual evidence of the anomaly.
*   **Instant Email Notifications:** Users are immediately notified via email (powered by SendGrid) with the alert GIF and a link back to the platform.
*   **Community-Powered Verification:** A simple crowd-sourcing mechanism allows the community to validate or dismiss flagged alerts, improving the reliability of the data over time.

## 🏗️ System Architecture

GeoGuardian is built on a modern, decoupled, and scalable architecture designed for performance and reliability.

| Component | Description |
| :--- | :--- |
| **Frontend** | A responsive web application built with **Next.js** and **TypeScript**. It features an interactive map from **React-Leaflet** and integrates directly with **Supabase** for real-time data and authentication. Deployed on **Vercel**. |
| **Backend API** | A high-performance API built with **Python** and **FastAPI**. It manages satellite data processing and interfaces with the **Supabase** backend for data operations. |
| **Database** | A **Supabase PostgreSQL** database providing a robust, serverless data store with built-in Row Level Security (RLS), real-time subscriptions, and automatic API generation. |
| **Authentication** | **Supabase Auth** handles user authentication with Google OAuth, session management, and secure access control across the application. |
| **Background Worker** | A server-side processing engine (using FastAPI `BackgroundTasks` for the MVP) that interfaces directly with the **Sentinel Hub API** to fetch satellite data and perform analysis. |

```mermaid
graph TD
    A[User's Browser - Next.js] -->|1. Google OAuth| B(Supabase Auth)
    B -->|2. User Session| A
    A -->|3. Define AOI| C(Supabase Database)
    A -->|4. Trigger Analysis| D(Backend API - FastAPI)
    D -->|5. Fetch Imagery| E(Sentinel Hub API)
    D -->|6. Analyze & Create GIF| D
    D -->|7. Save Alert & GIF URL| C
    D -->|8. Send Alert| F(SendGrid API)
    F -->|9. Email Notification| G[User's Inbox]
    A -->|10. Real-time Updates| C
    C -->|11. Live Data| A
```

## 🛠️ Getting Started

### Prerequisites
*   Git, Python 3.10+, Node.js 18+
*   Accounts with: Google (for OAuth), Supabase, Sentinel Hub, and SendGrid.

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/geoguardian.git
   cd geoguardian
   ```

2. **Start development servers**:
   ```bash
   # On Windows
   start-dev.bat
   
   # On Unix/Linux/macOS
   ./start-dev.sh
   
   # Or using npm
   npm install
   npm run setup
   npm run dev
   ```

3. **Configure environment variables**:
   - Update `backend/.env` with your API keys
   - Update `frontend/.env.local` with Supabase credentials

### Detailed Setup Instructions
For complete setup instructions including Supabase configuration:
*   **[Supabase Setup Guide](./SUPABASE_SETUP.md)**

## 🧪 Project Status & Roadmap

This project was initially developed as a proof-of-concept for the **HackOdisha 5.0** hackathon. The current version is a fully functional MVP that successfully demonstrates the core user loop.

### Future Roadmap
Our vision for GeoGuardian extends far beyond the MVP. Key areas for future development include:

| Area | Planned Enhancements |
| :--- | :--- |
| **AI/ML Engine** | Transition from heuristic-based change detection to a sophisticated, server-side Machine Learning model (e.g., YOLOv8 on custom-trained data) for object-specific classification (e.g., "vehicle," "building," "barge"). |
| **Data & Scalability** | Integrate a time-series database to enable historical trend analysis and predictive insights. Scale the background processing with a distributed Celery/Redis architecture. |
| **Alerting & Integrations** | Add multi-channel alerting (SMS, Telegram, Slack) and provide a public API for integration with other environmental platforms and government agencies. |
| **Web3 & Trust** | Implement an on-chain ledger (e.g., on Polygon) to immutably store the hashes of alert GIFs, creating a permanent, tamper-proof archive of environmental evidence. |

## 🤝 Contributing

We believe in the power of open-source to solve the world's most pressing problems. We welcome contributions from the community. Please see our `CONTRIBUTING.md` file for guidelines on how to get involved.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.