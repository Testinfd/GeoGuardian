🧭 NEW PROJECT BRIEF (kept short)

Name (working): Project Chilika-Svasthya → REBRAND to “GeoGuardian” (location-agnostic)

Core loop (36 h MVP):

OAuth-login → drop 5 pins (AOI) → auto-fetch last 2 cloud-free Sentinel-2 tiles → client-side pixel delta → flag anomaly → email GIF-alert → crowd “agree / dismiss” → dashboard updates.

---

✅ 4-DOC BLUEPRINT – DYNAMIC MONITORING EDITION  
(Each doc is stand-alone markdown; copy-paste ready)

---

Document 1 – PRD (Product Requirements)

Vision
Turn any lake, river or coastal stretch into a 10-m resolution early-warning system for trash, algal bloom & illegal construction—no hardware, no code, 3-minute set-up.

Problem
- Environmental agencies learn about dumping weeks later (manual patrols, WhatsApp complaints).  
- Satellite data exists but needs GIS experts; small NGOs can’t use it.

Target Personas
1. Hackathon Judge – wants live demo (drop pin → 60 s → GIF alert).  
2. Local NGO Lead – needs email proof to file FIR / grant report.  
3. Eco-Club Student – wants crowd-verified contribution (karma points).

Must-Have Features (P0)

ID	Feature	Metric	
F1	OAuth (Google)	≤ 15 s login	
F2	Map picker (≤ 5 AOIs)	≤ 3 clicks per AOI	
F3	Sentinel-2 fetch (T-1 vs T-11 days)	success ≥ 80 % calls	
F4	Client-side change raster (NDVI / NDWI / SI)	< 5 s on laptop	
F5	Auto-label (trash / bloom / construction)	accuracy ≥ 70 % (demo)	
F6	Generate before/after GIF (600 px)	file ≤ 1 MB	
F7	Email alert (SendGrid free)	delivered < 1 min	
F8	Crowd verify (agree / dismiss)	≥ 2 confirmations → “confirmed”	

P1 (if time left)
- Telegram bot toggle  
- CSV export for grant applications  
- Dark-mode UI

Out-of-Scope
- Mobile app (PWA enough)  
- Multi-language (English only)  
- On-chain storage (email + Postgres sufficient for MVP)

Success Criteria (Judge-facing)
- Demo creates new AOI and receives GIF alert in < 90 s  
- ≥ 70 % of seeded anomalies detected (we will plant 3 fake dumps)  
- Lighthouse ≥ 90 performance on 4G

---

Document 2 – Backend README

Purpose
Orchestrate satellite imagery download, run lightweight change detection, send alerts, collect crowd feedback.

Tech Stack
- Python 3.10, FastAPI, PostgreSQL ( Neon.tech free tier ), SQLModel, Sentinel-Hub PY, SendGrid, Docker → Akash
- All long tasks backgrounded with Celery + Redis (Akash side-car container)

Directory

```
backend/
├── app/
│   ├── api/          # routes
│   ├── core/         # settings, sentinel client
│   ├── models/       # SQLModel
│   ├── workers/      # Celery tasks
│   └── utils/        # gif maker, email
├── Dockerfile
├── requirements.txt
└── .env.example
```

Local Setup (≤ 10 min)

```bash
git clone ...
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add SH_CLIENT_ID & SH_CLIENT_SECRET
docker run -d -p 6379:6379 redis:7-alpine
uvicorn app.main:app --reload
celery -A app.workers.tasks worker --loglevel=info
```

Key Environment Vars

```
SENTINELHUB_CLIENT_ID=****
SENTINELHUB_CLIENT_SECRET=****
DATABASE_URL=postgresql+asyncpg://user:pass@neonhost/db
SENDGRID_API_KEY=****
FRONTEND_URL=http://localhost:3000
```

API Contract (v1)

Method	Endpoint	Body	Response	
POST	/aoi	{“name”:”Trash point”,“geojson”:Polygon}	{“aoi_id”:uuid}	
GET	/aoi/{aoi_id}/alert	—	200 {gif_url, anomaly_type, confidence}	
POST	/verify	{“alert_id”:uuid, “vote”:”agree”	”dismiss”}	

Change-Detection Logic (client off-load)
1. Fetch T1 & T2 (10 m, L2A, < 30 % cloud)  
2. Return 256×256 PNG tiles (JPEG2000 → 8-bit)  
3. Browser runs NDVI diff in WebGL shader:

   `delta = (B8_T2 − B8_T1) / (B8_T2 + B8_T1 + ε)`  
4. Thresholds (tuneable sliders):  
   - Trash / construction: ΔNDVI < -0.15  
   - Algal bloom: ΔNDVI > +0.20  
5. Canvas → GIF (gif.js) → POST back to `/alert` (base64)

Background Task (fallback)
If user opts server-side (slow network):

Celery task → `numpy` raster → same thresholds → store GIF in `/static` → email.

Deploy to Akash

```
docker build -t geoguardian-backend .
# update deploy.yml image uri
akash tx deployment create deploy.yml --from mykey -y
```

---

Document 3 – Frontend README

Vision
One map, five pins, one minute to visual proof of environmental crime.

Stack
- Next.js 14 (App Router) + TypeScript  
- Tailwind CSS + HeadlessUI  
- React-Leaflet (map)  
- HTML5 Canvas + WebGL (delta renderer)  
- Axios, React-Hook-Form, Zustand (store)

Quick Start

```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install react-leaflet leaflet axios zustand
npm run dev
```

Core Components
1. MapPicker – draw polygon, enforce ≤ 100 km², max 5 layers.  
2. LayerPanel – name, colour, delete, “Analyse” button.  
3. DeltaRenderer – receives two PNG tiles → WebGL shader → canvas → GIF (gif.js).  
4. AlertCard – GIF, type icon, confidence bar, “Agree / Dismiss” buttons.  
5. OAuthButton – NextAuth.js with GoogleProvider.

Env File

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=***
NEXT_PUBLIC_API_URL=https://<akash-backend>
```

GIF Generation Snippet (Canvas)

```typescript
const canvas = document.createElement('canvas');
canvas.width = 512; canvas.height = 512;
const gl = canvas.getContext('webgl');
// compile shader, attach textures T1 & T2, run delta frag shader
const gif = new GIF({ workers: 2, quality: 10 });
gif.addFrame(canvas, { delay: 500 });
gif.on('finished', (blob) => {
  const file = new File([blob], 'alert.gif', { type: 'image/gif' });
  uploadGif(file);  // POST /aoi/{id}/gif
});
gif.render();
```

Build & Deploy

```bash
npm run build
# drag /out to Vercel → live in 30 s
```

---

Document 4 – Formal API Spec

Base URL  
`https://geoguardian.akash.host/api/v1`

Schemas

```typescript
AOI{ id, name, geojson, created_at }
Alert{ id, aoi_id, gif_url, type, confidence, confirmed, created_at }
Vote{ alert_id, vote: "agree"|"dismiss" }
```

Endpoints

1. Create AOI

```
POST /aoi
Auth: Bearer <google-jwt>
Body:
{
  "name": "Brahmani sand mine",
  "geojson": { "type":"Polygon", "coordinates":[[[...]]] }
}
→ 201
{ "aoi_id": "uuid", "status": "queued" }
```

2. Poll Alert (long-poll or redirect)

```
GET /aoi/{aoi_id}/alert
→ 200
{
  "alert_id": "uuid",
  "gif_url": "https://.../alert.gif",
  "type": "construction",
  "confidence": 0.82,
  "confirmed": false
}
```

(returns 202 while processing)

3. Submit Verification

```
POST /verify
Auth: Bearer
Body:
{ "alert_id": "uuid", "vote": "agree" }
→ 200
{ "status": "confirmed", "confirmations": 2 }
```

4. Health

```
GET /health
→ { "status": "ok" }
```

Error Format

```json
{ "error": "bad_request", "message": "GeoJSON area exceeds 100 km²." }
```

---