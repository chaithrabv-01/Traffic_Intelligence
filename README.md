# AI-Powered Urban Traffic Intelligence & Predictive Road Safety Platform

An engineering platform integrating Deep Learning, Computer Vision, Spatial GIS Intelligence, Time-Series Forecasting, and Generative AI for urban traffic monitoring and road safety management.

---

## 1. System Implementation Status

| Capability / Module | Status | Implementation Details |
|---|---|---|
| **FastAPI Unified Backend** | **Fully Functional** | Shared SQLite/PostgreSQL backend for Police and Citizen portals |
| **Video Frame Extraction & OCR** | **Fully Functional** | OpenCV sharpness-selected timestamps + EasyOCR + OSM Nominatim |
| **Visual Geolocation Retrieval** | **Fully Functional** | Multi-city spatial index (`index.npz`), candidate ranking & validation metrics |
| **Metric Learning Geolocation Fine-Tuning** | **Fully Functional** | Triplet margin contrastive learning (`ml/geo/fine_tune_geo.py`), checkpoint `geo_projector.pt` |
| **YOLO + ByteTrack Tracking** | **Fully Functional** | CPU-compatible vehicle detection, unique ID tracking, counting, trajectories |
| **Trajectory Overlay Canvas** | **Fully Functional** | Interactive SVG perspective overlay with color-coded road users & trails in React |
| **Video Comparison Engine** | **Fully Functional** | Side-by-side comparative analytics page (`/police/compare`) with delta statistics |
| **LSTM & XGBoost Collision Risk** | **Fully Functional** | Deep Learning LSTM sequence model + XGBoost classifier trained on causal past windows |
| **Historical Accident Hotspots** | **Fully Functional** | DBSCAN spatial clustering on historical accident records (`accidents.csv`) |
| **PostGIS / GeoPandas Road Segment Risk** | **Fully Functional** | Mapped corridor risk ratings with Shapely spatial proximity (`/api/road-segments`) |
| **Traffic Congestion Forecasting** | **Fully Functional** | Chronological regression (XGBoost, Random Forest, ARIMA baseline) + forecast page |
| **Central Event & Notification Engine** | **Fully Functional** | Verification-aware routing + FCM push notification service (`notifications.py`) |
| **Generative AI Assistant** | **Fully Functional** | Tool-calling assistant (Anthropic Claude + deterministic offline tool dispatcher fallback) |
| **Interactive Leaflet GIS Map** | **Fully Functional** | Corridors (color-coded), accident hotspots, verified events, cameras, citizen reports |
| **Citizen & Police Portals** | **Fully Functional** | Complete responsive React 18 + Tailwind UI built and validated with Vite |

---

## 2. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │    React 18 + Vite Portals (Single UI)  │
                      │  - Traffic Police Portal (Command View) │
                      │  - Citizen Portal (Public Safety View)  │
                      └──────────────────┬─────────────────────┘
                                         │ REST API / WebSocket
                      ┌──────────────────▼─────────────────────┐
                      │        FastAPI Unified Backend         │
                      └──────┬───────────┬─────────────┬───────┘
                             │           │             │
        ┌────────────────────┴──┐        │      ┌──────┴────────────────────┐
        │   Video Intelligence  │        │      │ GIS & Predictive Safety   │
        ├───────────────────────┤        │      ├───────────────────────────┤
        │ 1. Frame Extraction   │        │      │ 1. DBSCAN Hotspot Cluster │
        │ 2. OCR Text Geocoding │        │      │ 2. Road Segment Risk      │
        │ 3. Multi-City Index   │        │      │ 3. XGBoost & ARIMA Volume │
        │ 4. YOLOv8 + ByteTrack │        │      │ 4. Causal LSTM Collision  │
        │ 5. Trajectory Overlay │        │      │ 5. Central Event Engine   │
        └───────────────────────┘        │      └───────────────────────────┘
                                         ▼
                     ┌───────────────────────────────────────┐
                     │   Generative AI Assistant (Claude)    │
                     │  - Strict Backend Tool/Function Calls │
                     │  - Zero Hallucination Guarantee       │
                     │  - Deterministic Offline Fallback     │
                     └───────────────────────────────────────┘
```

---

## 3. Directory Structure

```
traffic-platform/
├── backend/
│   ├── app/
│   │   ├── config.py             # Paths, weights, API keys, thresholds
│   │   ├── db.py                 # SQLAlchemy DB engine & sessions
│   │   ├── models.py             # Video, Event, Incident, Camera models
│   │   ├── main.py               # REST API endpoints & route handlers
│   │   └── services/
│   │       ├── analytics.py      # Tracking summarizer & density level
│   │       ├── assistant.py      # Generative AI tool-calling dispatcher
│   │       ├── detection.py      # YOLO + ByteTrack video processing
│   │       ├── events.py         # Central event engine & routing
│   │       ├── forecast.py       # XGBoost / Random Forest / ARIMA training
│   │       ├── frames.py         # OpenCV frame extraction & filtering
│   │       ├── geoloc.py         # Visual geolocation similarity matching
│   │       ├── notifications.py  # In-app alerts & FCM push notifications
│   │       ├── ocr.py            # EasyOCR signboard reader & geocoder
│   │       ├── report.py         # ReportLab PDF generator
│   │       ├── risk.py           # Short-term collision & DBSCAN hotspots
│   │       └── road_risk.py      # PostGIS/Shapely corridor risk queries
│   ├── data/
│   │   ├── accidents/            # Real/sample historical accident CSVs
│   │   ├── traffic_counts/       # Chronological traffic count CSVs
│   │   ├── road_segments/        # Bengaluru corridors GeoJSON
│   │   ├── geo_reference/        # Multi-city labelled landmark images
│   │   ├── metrics/              # Genuine model evaluation outputs (JSON)
│   │   ├── uploads/              # Uploaded test videos
│   │   └── frames/               # Extracted video frames
│   ├── .env                      # API keys & environment settings
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Traffic Police overview command center
│   │   │   ├── VideoIntel.jsx       # Video intelligence & trajectory overlay
│   │   │   ├── VideoComparison.jsx  # Side-by-side video analytics
│   │   │   ├── MapPage.jsx          # Leaflet GIS traffic & risk map
│   │   │   ├── Forecast.jsx         # Time-series volume forecasting
│   │   │   ├── Events.jsx           # Incident verification management
│   │   │   ├── CameraRegistry.jsx   # CCTV camera registry
│   │   │   ├── Notifications.jsx    # Alert feed & FCM Web Push setup
│   │   │   ├── Metrics.jsx          # Genuine model performance dashboard
│   │   │   ├── Assistant.jsx        # Conversational GenAI assistant
│   │   │   └── Report.jsx           # Citizen issue reporting
│   │   ├── api.js                   # Axios/Fetch API client
│   │   ├── App.jsx                  # Main application & routing layout
│   │   └── main.jsx                 # React root entry
│   └── package.json                 # Frontend dependencies
└── ml/
    ├── geo/
    │   ├── labels.csv               # Multi-city labelled reference metadata
    │   ├── build_index.py           # Index builder & validation benchmark
    │   ├── fine_tune_geo.py         # Metric contrastive learning (Triplet Loss)
    │   ├── index.npz                # Built normalized visual index
    │   ├── index.json               # Reference metadata
    │   └── metrics.json             # Validation top-1 city & distance metrics
    └── risk/
        ├── train_risk.py            # LSTM sequence model & XGBoost trainer
        ├── lstm_risk.pt             # Trained PyTorch Deep Learning weights
        └── xgboost_risk.joblib      # Trained XGBoost model artifact
```

---

## 4. Key Engineering Guarantees

1. **Location-Independent Processing**: If visual geolocation cannot find a match above the similarity threshold (`SIM_MIN = 0.45`), the location is honestly marked as `unknown`. Video vehicle detection, tracking, traffic density, and collision risk analysis **always run** without failure.
2. **Human Confirmation Before GIS Mapping**: Predicted location candidates are presented as visual evidence with OCR matches and similarity scores. Coordinates are stored in the database **only after human confirmation**. No false GIS markers are generated.
3. **Causality in Collision Prediction**: At timestamp $t$, only trajectory observations with $t_{obs} \le t$ are used. Future frames are never leaked to predict past risk.
4. **Distinction Between Risk and Accidents**: The system explicitly labels video safety events as "Predicted Collision Risk", never claiming an unverified video detection is a confirmed accident.
5. **No Data Leakage**: Reference geolocation indexes, accident records, and traffic count time series use strict time-ordered and location-isolated splits. Test videos are never added to training data.

---

## 5. Execution Guide (Step-by-Step)

### Prerequisites
- Python 3.10+ (Tested on Python 3.13 on Windows CPU)
- Node.js 18+ and npm

---

### Step 1: Start Backend Server

Open PowerShell or Command Prompt:

```powershell
cd c:\Users\chait\OneDrive\Desktop\traffic-platform\backend

# Install python dependencies (if not already installed)
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`  
Swagger API Documentation: `http://localhost:8000/docs`

---

### Step 2: Start Frontend Application

Open a second terminal:

```powershell
cd c:\Users\chait\OneDrive\Desktop\traffic-platform\frontend

# Start Vite development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

### Step 3: Run Model Training & Evaluation (Already Pre-Trained & Ready)

If you ever wish to re-train the models on new data:

1. **Traffic Volume & Congestion Forecaster**:
   ```powershell
   # Via API or in browser:
   curl -X POST http://localhost:8000/api/forecast/train
   ```
2. **Deep Learning Collision Risk Models (LSTM + XGBoost)**:
   ```powershell
   python ml\risk\train_risk.py
   ```
3. **Visual Geolocation Metric Fine-Tuning**:
   ```powershell
   python ml\geo\fine_tune_geo.py
   ```
4. **Build Geolocation Multi-City Index**:
   ```powershell
   python ml\geo\build_index.py --labels ml\geo\labels.csv --root backend\data\geo_reference
   ```

---

### Step 4: Testing the Workflow

1. Navigate to `http://localhost:5173` in your browser.
2. Click **Video Intelligence** in the left sidebar.
3. Upload any test traffic video (e.g. MP4/AVI) and click **Upload & Analyse**.
4. Observe the progress:
   - OpenCV frame extraction and sharpness selection
   - OCR signboard text recognition
   - Geolocation candidate ranking (with Bengaluru and multi-city candidates)
   - YOLO detection + ByteTrack tracking with unique IDs
   - Interactive **Vehicle Trajectory Overlay**
   - Predicted causal risk timeline (TTC, closing velocity, severity)
5. Confirm or reject the predicted location.
6. Open **Video Comparison** to view two videos side-by-side.
7. Open **GIS Command Map** to see color-coded road risk corridors, accident clusters, and camera locations.
8. Ask the **AI Assistant** questions such as:
   - *"How many vehicles were detected in video 1?"*
   - *"Identify the location of video 1"*
   - *"Show accident hotspots in Bengaluru"*
