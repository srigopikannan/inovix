from fastapi import APIRouter
from typing import Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    confidence_threshold: float = 0.45
    cluster_radius_meters: float = 500.0
    sor_contingency_pct: float = 5.0

CURRENT_SETTINGS = {
    "confidence_threshold": 0.45,
    "cluster_radius_meters": 500.0,
    "morth_fatal_weight": 5.0,
    "morth_severe_weight": 3.0,
    "morth_minor_weight": 1.0,
    "sor_contingency_pct": 5.0,
    "quality_audit_pct": 3.0,
    "camera_mount_height_m": 1.8,
    "camera_fov_degrees": 60.0
}

@router.get("")
def get_settings():
    return {
        "settings": CURRENT_SETTINGS
    }

@router.post("")
def update_settings(payload: SettingsUpdate):
    CURRENT_SETTINGS["confidence_threshold"] = payload.confidence_threshold
    CURRENT_SETTINGS["cluster_radius_meters"] = payload.cluster_radius_meters
    CURRENT_SETTINGS["sor_contingency_pct"] = payload.sor_contingency_pct
    return {"message": "Settings updated", "current_settings": CURRENT_SETTINGS}
