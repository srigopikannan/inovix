from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ..database import get_db
from ..models import Accident, BlackSpot, Road, RoadSegment
from ..services.blackspot_engine import BlackSpotEngine

router = APIRouter(prefix="/api/accidents", tags=["Accidents & Black Spots"])

class AccidentCreate(BaseModel):
    case_number: str
    road_id: int
    severity: str # Fatal, Severe Injury, Minor Injury, Property Damage
    accident_type: str
    latitude: float
    longitude: float
    weather: str = "Clear"
    surface_condition: str = "Dry"
    lighting_condition: str = "Daylight"
    vehicles_involved: int = 2
    casualties_fatal: int = 0
    casualties_severe: int = 0
    casualties_minor: int = 0
    primary_factor: str = "Pavement Failure / Loss of Control"
    description: Optional[str] = None

@router.get("")
def list_accidents(
    road_id: Optional[int] = None,
    severity: Optional[str] = None,
    weather: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(Accident)
    if road_id:
        query = query.filter(Accident.road_id == road_id)
    if severity:
        query = query.filter(Accident.severity == severity)
    if weather:
        query = query.filter(Accident.weather == weather)

    accidents = query.order_by(Accident.accident_date.desc()).limit(limit).all()
    results = []
    for a in accidents:
        results.append({
            "id": a.id,
            "case_number": a.case_number,
            "road_id": a.road_id,
            "segment_id": a.segment_id,
            "accident_date": a.accident_date.isoformat(),
            "severity": a.severity,
            "accident_type": a.accident_type,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "weather": a.weather,
            "surface_condition": a.surface_condition,
            "lighting_condition": a.lighting_condition,
            "vehicles_involved": a.vehicles_involved,
            "casualties_fatal": a.casualties_fatal,
            "casualties_severe": a.casualties_severe,
            "casualties_minor": a.casualties_minor,
            "primary_factor": a.primary_factor,
            "description": a.description
        })
    return results

@router.post("")
def create_accident(payload: AccidentCreate, db: Session = Depends(get_db)):
    # Find nearest road segment
    segments = db.query(RoadSegment).filter(RoadSegment.road_id == payload.road_id).all()
    nearest_seg_id = None
    min_dist = float("inf")
    for s in segments:
        dist = ((s.start_lat - payload.latitude)**2 + (s.start_lng - payload.longitude)**2)**0.5
        if dist < min_dist:
            min_dist = dist
            nearest_seg_id = s.id

    acc = Accident(
        case_number=payload.case_number,
        road_id=payload.road_id,
        segment_id=nearest_seg_id,
        severity=payload.severity,
        accident_type=payload.accident_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        weather=payload.weather,
        surface_condition=payload.surface_condition,
        lighting_condition=payload.lighting_condition,
        vehicles_involved=payload.vehicles_involved,
        casualties_fatal=payload.casualties_fatal,
        casualties_severe=payload.casualties_severe,
        casualties_minor=payload.casualties_minor,
        primary_factor=payload.primary_factor,
        description=payload.description
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)

    # Recalculate black spots automatically
    recalculate_blackspots(db)

    return {"message": "Accident registered and black spots updated", "id": acc.id}

@router.get("/blackspots")
def list_black_spots(road_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(BlackSpot)
    if road_id:
        query = query.filter(BlackSpot.road_id == road_id)
    spots = query.order_by(BlackSpot.severity_index.desc()).all()
    results = []
    for b in spots:
        results.append({
            "id": b.id,
            "code": b.code,
            "name": b.name,
            "road_id": b.road_id,
            "segment_id": b.segment_id,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "radius_meters": b.radius_meters,
            "total_accidents": b.total_accidents,
            "fatal_count": b.fatal_count,
            "severe_count": b.severe_count,
            "minor_count": b.minor_count,
            "severity_index": b.severity_index,
            "risk_tier": b.risk_tier,
            "classification_reason": b.classification_reason,
            "methodology_note": b.methodology_note,
            "recommended_countermeasure": b.recommended_countermeasure,
            "status": b.status
        })
    return results

@router.post("/blackspots/recalculate")
def recalculate_blackspots_endpoint(db: Session = Depends(get_db)):
    count = recalculate_blackspots(db)
    return {"message": "Black spots recalculation completed", "black_spots_identified": count}

def recalculate_blackspots(db: Session) -> int:
    accidents = db.query(Accident).all()
    raw = [{
        "id": a.id,
        "road_id": a.road_id,
        "segment_id": a.segment_id,
        "latitude": a.latitude,
        "longitude": a.longitude,
        "casualties_fatal": a.casualties_fatal,
        "casualties_severe": a.casualties_severe,
        "casualties_minor": a.casualties_minor,
        "primary_factor": a.primary_factor
    } for a in accidents]

    fresh_spots = BlackSpotEngine.identify_black_spots(raw)
    db.query(BlackSpot).delete()
    for s in fresh_spots:
        db.add(BlackSpot(**s))
    db.commit()
    return len(fresh_spots)
