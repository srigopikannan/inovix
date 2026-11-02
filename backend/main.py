from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .config import UPLOADS_DIR, REPORTS_DIR
from .database import engine, Base
from .services.seed_data import seed_database, seed_tamil_nadu_corridor

# Routers
from .routers import (
    roads,
    accidents,
    defects,
    analytics,
    reconstruction,
    reports,
    inspections,
    admin,
    settings,
    routing
)

app = FastAPI(
    title="ROADGUARD AI – Road Safety & Infrastructure Intelligence Platform",
    description="Enterprise API for Black Spot Identification, Computer Vision Defect Detection, Metrology, and Reconstruction Simulation.",
    version="2.4.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for inspection uploads and generated PDF/CSV reports
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")

# Include Routers
app.include_router(roads.router)
app.include_router(accidents.router)
app.include_router(defects.router)
app.include_router(analytics.router)
app.include_router(reconstruction.router)
app.include_router(reports.router)
app.include_router(inspections.router)
app.include_router(admin.router)
app.include_router(settings.router)
app.include_router(routing.router)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_database()
    seed_tamil_nadu_corridor()

@app.get("/")
def root():
    return {
        "product": "ROADGUARD AI",
        "tagline": "Turning Accident Data into Safer Roads.",
        "version": "2.4.0",
        "status": "OPERATIONAL",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
