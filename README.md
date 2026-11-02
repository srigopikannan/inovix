# ROADGUARD AI
> **"Turning Accident Data into Safer Roads."**
> Hackathon Problem Statement: **NT15 – Road Accident Black Spot Identification System**

---

## 1. Executive Summary

**ROADGUARD AI** is an enterprise-grade Road Safety Intelligence, Accident Black Spot Identification, and Infrastructure Asset Management platform built for transportation authorities, highway directorates, and municipal engineering departments.

Rather than a static conceptual prototype or generic dashboard, ROADGUARD AI integrates real geospatial information systems (GIS), an active OpenCV computer vision inference pipeline for defect detection, calibrated dimensional metrology, MoRTH / IRC:SP:88-2019 black spot clustering, and the flagship **ROADGUARD VISION** interactive before-and-after road reconstruction simulator.

---

## 2. Platform Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               ROADGUARD AI CLIENT (React)              │
                    │   Vite + TypeScript + Tailwind CSS + Leaflet GIS       │
                    └──────────────────────────┬─────────────────────────────┘
                                               │ HTTP / REST / JSON
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │              FASTAPI REST BACKEND (Python)             │
                    │   Pydantic v2 + SQLAlchemy ORM + CORS + Static CDN     │
                    └───────┬──────────────────┬─────────────────────┬───────┘
                            │                  │                     │
                            ▼                  ▼                     ▼
┌─────────────────────────────────┐  ┌───────────────────┐  ┌───────────────────────┐
│     OPENCV COMPUTER VISION      │  │  MoRTH / IRC SI   │  │   ROADGUARD VISION    │
│  - Bilateral Pavement Filter    │  │  BLACK SPOT ENGINE│  │ RECONSTRUCTION ENGINE │
│  - Adaptive Threshold Depress   │  │  - 500m Clusters  │  │  - Asphalt Micro-coat │
│  - Canny Edge Morphology        │  │  - SI = 5F+3S+1M  │  │  - Polymer Mastic     │
│  - Specular Waterlogging Mask   │  │  - Causal Audit   │  │  - IRC-35 Lane Lines  │
│  - Metric Calibration Engine    │  │  - Remedial Plans │  │  - Statutory Label    │
└─────────────────────────────────┘  └───────────────────┘  └───────────────────────┘
                            │                  │                     │
                            └──────────────────┼─────────────────────┘
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │             ENTERPRISE SPATIAL REPOSITORY              │
                    │   Roads • 100m Segments • Accidents • Repairs • Audits │
                    └────────────────────────────────────────────────────────┘
```

---

## 3. Key Capabilities & Engineering Modules

### 1. Command Center
Executive-level road safety cockpit displaying 8 core operational KPIs:
- Monitored Corridors (e.g. NH-44 Cyber City - Expressway Corridor, 10.0 km)
- Kilometres Inspected & Segments Mapped (180 segments)
- Multi-Year Empirical Accident Baseline
- Verified MoRTH Black Spots
- High-Risk Road Segments
- Detected Infrastructure Defects
- Schedule of Rates (SOR) Pending Maintenance Orders
- Average Pavement Health Score

### 2. Accident Intelligence (Problem NT15)
- Full FIR case file recording (Date, Severity, Vehicle Count, Casualties, Road Deficiencies, Weather, Lighting).
- Implementation of the transparent **Ministry of Road Transport & Highways (MoRTH) & Indian Road Congress (IRC:SP:88-2019)** Severity Index formula:
  $$\text{SI} = (5 \times \text{Fatal}) + (3 \times \text{Severe Injury}) + (1 \times \text{Minor Injury})$$
- 500-meter cluster radius window. Every hazard zone contains an audited causal explanation and tailored engineering countermeasures.

### 3. GIS Explorer
- Interactive WGS-84 GIS interface using Leaflet and dark enterprise CartoDB tiles.
- Vector polylines of road networks colored by health rating (Green >90, Lime 75-89, Amber 55-74, Red <40).
- 500m dashed hazard buffers around verified black spot clusters.
- Segment click inspector displaying chainage, IRI roughness, lighting, and drainage.

### 4. Road Scanner (Signature 10-Kilometre Route Inspection)
- 10-kilometre corridor discretized into **100 consecutive 100-metre segments** (Ch 0+000 to Ch 10+000).
- Segment matrix showing inspection status, health ratings, active defects, and photographic evidence traces.

### 5. AI Defect Detection
- Real OpenCV computer vision inference pipeline:
  - Bilateral noise filtering to preserve asphalt grain edges.
  - Adaptive thresholding for shadow voids and dark depressions (potholes).
  - Canny edge and contour elongation analysis for fatigue and longitudinal alligator cracking.
  - HSV specular reflectance thresholding for surface ponding and waterlogging.
  - Generates technical annotations with bounding boxes, confidence percentages, and pixel footprints.

### 6. Defect Measurement Engine
- Metrological rigor: ordinary 2D photographs do not reveal true depth or metric volume without calibration targets.
- Accurately reports raw pixel dimensions ($L_{\text{px}}, W_{\text{px}}, A_{\text{px}}$).
- Supports optical target calibration (e.g., standard 25mm coin marker, surveyor 100mm tape, or custom optical GSD factor).
- Clear statutory notice distinguishing uncalibrated estimations from verified photogrammetric measurements.

### 7. Road Health Analytics
- Segment-level condition scoring:
  $$\text{RHI} = 100 - \sum \text{Defect Deductions} - \sum \text{Infrastructure Deficiencies}$$
- Deductions: Critical defect (-18 pts), High severity (-10 pts), Poor drainage (-12 pts), Unlit lighting (-8 pts), Roughness penalty.
- Cross-corridor comparative health index.

### 8. Hybrid Accident Risk Analysis
- Distinguishes empirical accident black spots (retrospective) from predictive structural risk zones (prospective).
- Evaluates streetlight asset inventory and night-time photometric safety compliance.

### 9. Repair Planner & Cost Estimator
- Maintenance task dispatching with Schedule of Rates (SOR) itemization.
- Material (45-60%), labor (25-40%), and machinery (15-20%) allocation breakdown.
- 5% civil contingency and 3% quality control audit margins.

### 10. ROADGUARD VISION (Flagship Before/After Reconstruction Simulator)
- 10-step interactive engineering workflow.
- Synthesizes polymer mastic patching, Stone Matrix Asphalt (SMA) micro-surfacing, and IRC-35 thermoplastic retroreflective lane markings.
- Interactive split-screen slider: drag to reveal proposed reconstructed roadway side by side with original damage.
- Strictly watermarks all synthesized outputs with the mandatory statutory disclaimer:
  > **"AI-GENERATED PROPOSED RECONSTRUCTION – NOT AN ACTUAL COMPLETED ROAD."**

### 11. Enterprise Reports Engine
- Formal PDF audit documents generated via ReportLab with executive metrics, tabular defect rosters, and statutory disclaimers.
- Raw CSV export for state transportation database imports.

---

## 4. Setup & Execution Instructions

### Prerequisites
- Python 3.11+
- Node.js v20+ / npm v10+

### Backend Execution
```bash
# Navigate to workspace root
cd c:\Users\user\Documents\inovix

# Install Python backend dependencies (if not already installed)
python -m pip install fastapi uvicorn sqlalchemy pydantic opencv-python pillow reportlab httpx pytest

# Launch FastAPI backend on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
*API Documentation is interactively available at: `http://127.0.0.1:8000/docs`*

### Frontend Execution
```bash
# In a separate terminal, navigate to the frontend directory
cd c:\Users\user\Documents\inovix\frontend

# Launch Vite development server
node ./node_modules/vite/bin/vite.js --port 5173 --host 127.0.0.1
```
*Access the Web Application in your browser at: `http://127.0.0.1:5173/`*

### Running Automated Test Suite
```bash
python -m pytest backend/tests/test_api.py -v
```

---

## 5. Security & Engineering Standards Compliance
- **MoRTH / IRC:SP:88-2019**: Manual on Road Safety Audit for Black Spot Treatment.
- **IRC:35-2015**: Code of Practice for Road Markings.
- **IRC:66-1976**: Recommended Practice for Sight Distance on Rural Highways.
- **ISO/IEC 17025 Metrology Guidance**: Disclaimers and optical target calibrations on monocular camera measurements.
- **Statutory Watermark Standard**: Mandatory reconstruction disclaimer on all synthesized road visualisations.
