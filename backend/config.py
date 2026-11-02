import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"
REPORTS_DIR = BASE_DIR / "reports"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'roadguard.db'}")

# Calibration default standards (pixels to mm ratio when reference coin/scale card present)
DEFAULT_PIXEL_SCALE = 0.5  # mm per pixel fallback
DEFAULT_CONFIDENCE_THRESHOLD = 0.45
