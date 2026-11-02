from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import shutil
from pathlib import Path

from ..database import get_db
from ..config import UPLOADS_DIR
from ..models import InspectionSession, Road, RoadSegment, DefectDetection
from ..services.cv_engine import RoadCVEngine
from ..services.measurement_engine import MeasurementEngine

router = APIRouter(prefix="/api/inspections", tags=["Road Scanner & Inspections"])

@router.get("")
def list_inspections(road_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(InspectionSession)
    if road_id:
        query = query.filter(InspectionSession.road_id == road_id)
    sessions = query.order_by(InspectionSession.inspection_date.desc()).all()
    results = []
    for s in sessions:
        results.append({
            "id": s.id,
            "session_code": s.session_code,
            "road_id": s.road_id,
            "road_name": s.road.name if s.road else "Corridor",
            "inspector_name": s.inspector_name,
            "inspection_date": s.inspection_date.strftime("%Y-%m-%d"),
            "direction": s.direction,
            "route_length_km": s.route_length_km,
            "total_segments": s.total_segments,
            "total_defects": s.total_defects,
            "status": s.status,
            "notes": s.notes
        })
    return results

@router.get("/{session_id}")
def get_inspection_details(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InspectionSession).filter(InspectionSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Inspection session not found")

    road = session.road
    segments = db.query(RoadSegment).filter(RoadSegment.road_id == road.id).order_by(RoadSegment.segment_index).all()
    defects = db.query(DefectDetection).filter(DefectDetection.inspection_id == session.id).all()

    # Segment defects map
    seg_defect_map = {}
    for d in defects:
        if d.segment_id not in seg_defect_map:
            seg_defect_map[d.segment_id] = []
        seg_defect_map[d.segment_id].append({
            "id": d.id,
            "defect_type": d.defect_type,
            "severity": d.severity,
            "confidence": d.confidence,
            "image_url": d.image_url,
            "estimated_length_mm": d.estimated_length_mm,
            "estimated_width_mm": d.estimated_width_mm,
            "estimated_area_cm2": d.estimated_area_cm2
        })

    seg_list = []
    for s in segments:
        seg_list.append({
            "id": s.id,
            "segment_index": s.segment_index,
            "chainage": f"Ch {s.chainage_start_m}m - {s.chainage_end_m}m",
            "start_lat": s.start_lat,
            "start_lng": s.start_lng,
            "health_score": s.health_score,
            "risk_level": s.risk_level,
            "defects": seg_defect_map.get(s.id, [])
        })

    return {
        "id": session.id,
        "session_code": session.session_code,
        "road_name": road.name,
        "road_code": road.code,
        "route_length_km": session.route_length_km,
        "total_segments": session.total_segments,
        "total_defects": len(defects),
        "status": session.status,
        "inspector_name": session.inspector_name,
        "segments": seg_list
    }
