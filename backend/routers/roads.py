from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ..database import get_db
from ..models import Road, RoadSegment, DefectDetection, Accident, BlackSpot

router = APIRouter(prefix="/api/roads", tags=["Roads"])

class RoadCreate(BaseModel):
    code: str
    name: str
    highway_class: str = "National Highway"
    length_km: float = 10.0
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    surface_type: str = "Asphalt / Dense Bituminous Macadam"
    lane_count: int = 4
    speed_limit_kph: int = 80

@router.get("")
def list_roads(db: Session = Depends(get_db)):
    roads = db.query(Road).all()
    results = []
    for r in roads:
        seg_count = len(r.segments)
        avg_health = sum(s.health_score for s in r.segments) / seg_count if seg_count > 0 else 100.0
        defect_count = db.query(DefectDetection).filter(DefectDetection.road_id == r.id).count()
        accident_count = db.query(Accident).filter(Accident.road_id == r.id).count()
        blackspot_count = db.query(BlackSpot).filter(BlackSpot.road_id == r.id).count()

        results.append({
            "id": r.id,
            "code": r.code,
            "name": r.name,
            "highway_class": r.highway_class,
            "length_km": r.length_km,
            "start_lat": r.start_lat,
            "start_lng": r.start_lng,
            "end_lat": r.end_lat,
            "end_lng": r.end_lng,
            "surface_type": r.surface_type,
            "lane_count": r.lane_count,
            "speed_limit_kph": r.speed_limit_kph,
            "segment_count": seg_count,
            "average_health_score": round(avg_health, 1),
            "defect_count": defect_count,
            "accident_count": accident_count,
            "blackspot_count": blackspot_count
        })
    return results

@router.post("")
def create_road(payload: RoadCreate, db: Session = Depends(get_db)):
    existing = db.query(Road).filter(Road.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Road code already registered")

    road = Road(
        code=payload.code,
        name=payload.name,
        highway_class=payload.highway_class,
        length_km=payload.length_km,
        start_lat=payload.start_lat,
        start_lng=payload.start_lng,
        end_lat=payload.end_lat,
        end_lng=payload.end_lng,
        surface_type=payload.surface_type,
        lane_count=payload.lane_count,
        speed_limit_kph=payload.speed_limit_kph
    )
    db.add(road)
    db.commit()
    db.refresh(road)

    # Automatically generate 100-meter segments up to road length
    total_segments = int(payload.length_km * 10)  # 10 segments per km = 100m each
    segments = []
    for idx in range(total_segments):
        t1 = idx / float(total_segments)
        t2 = (idx + 1) / float(total_segments)
        s_lat = road.start_lat + (road.end_lat - road.start_lat) * t1
        s_lng = road.start_lng + (road.end_lng - road.start_lng) * t1
        e_lat = road.start_lat + (road.end_lat - road.start_lat) * t2
        e_lng = road.start_lng + (road.end_lng - road.start_lng) * t2

        seg = RoadSegment(
            road_id=road.id,
            segment_index=idx,
            chainage_start_m=idx * 100,
            chainage_end_m=(idx + 1) * 100,
            start_lat=round(s_lat, 6),
            start_lng=round(s_lng, 6),
            end_lat=round(e_lat, 6),
            end_lng=round(e_lng, 6),
            health_score=100.0,
            risk_level="LOW",
            defect_count=0,
            surface_roughness_iri=2.1,
            streetlight_present=True,
            drainage_condition="Adequate"
        )
        segments.append(seg)
    db.add_all(segments)
    db.commit()

    return {"message": "Road created with 100m segments", "road_id": road.id, "segments_created": total_segments}

@router.get("/{road_id}")
def get_road_details(road_id: int, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")

    segments = []
    for s in road.segments:
        segments.append({
            "id": s.id,
            "segment_index": s.segment_index,
            "chainage_start_m": s.chainage_start_m,
            "chainage_end_m": s.chainage_end_m,
            "start_lat": s.start_lat,
            "start_lng": s.start_lng,
            "end_lat": s.end_lat,
            "end_lng": s.end_lng,
            "health_score": s.health_score,
            "risk_level": s.risk_level,
            "defect_count": s.defect_count,
            "surface_roughness_iri": s.surface_roughness_iri,
            "streetlight_present": s.streetlight_present,
            "drainage_condition": s.drainage_condition
        })

    return {
        "id": road.id,
        "code": road.code,
        "name": road.name,
        "highway_class": road.highway_class,
        "length_km": road.length_km,
        "start_lat": road.start_lat,
        "start_lng": road.start_lng,
        "end_lat": road.end_lat,
        "end_lng": road.end_lng,
        "surface_type": road.surface_type,
        "lane_count": road.lane_count,
        "speed_limit_kph": road.speed_limit_kph,
        "segments": segments
    }
