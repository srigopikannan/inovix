from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from collections import defaultdict
from ..database import get_db
from ..models import Road, RoadSegment, Accident, BlackSpot, DefectDetection, InspectionSession

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Intelligence"])

@router.get("/command-center")
def get_command_center_metrics(db: Session = Depends(get_db)):
    roads = db.query(Road).all()
    total_roads = len(roads)
    total_km = sum(r.length_km for r in roads)

    total_accidents = db.query(Accident).count()
    black_spots_count = db.query(BlackSpot).count()
    high_risk_segments = db.query(RoadSegment).filter(RoadSegment.risk_level.in_(["HIGH", "CRITICAL"])).count()
    total_defects = db.query(DefectDetection).count()
    critical_defects = db.query(DefectDetection).filter(DefectDetection.severity == "CRITICAL").count()

    # Severity distribution
    severity_counts = db.query(Accident.severity, func.count(Accident.id)).group_by(Accident.severity).all()
    severity_dist = {sev: count for sev, count in severity_counts}

    # Road condition distribution
    condition_counts = defaultdict(int)
    segments = db.query(RoadSegment).all()
    for s in segments:
        if s.health_score >= 90:
            condition_counts["Excellent"] += 1
        elif s.health_score >= 75:
            condition_counts["Good"] += 1
        elif s.health_score >= 55:
            condition_counts["Fair"] += 1
        elif s.health_score >= 40:
            condition_counts["Poor"] += 1
        else:
            condition_counts["Critical"] += 1

    # Accident trends (quarterly / month timeline)
    accidents = db.query(Accident).order_by(Accident.accident_date.asc()).all()
    timeline_map = defaultdict(lambda: {"total": 0, "fatal": 0, "severe": 0, "minor": 0})
    for a in accidents:
        month_key = a.accident_date.strftime("%Y-%m")
        timeline_map[month_key]["total"] += 1
        if a.severity == "Fatal":
            timeline_map[month_key]["fatal"] += 1
        elif a.severity == "Severe Injury":
            timeline_map[month_key]["severe"] += 1
        else:
            timeline_map[month_key]["minor"] += 1

    timeline = [{"month": k, **v} for k, v in sorted(timeline_map.items())[-8:]]

    # Defect severity overview
    defect_counts = db.query(DefectDetection.severity, func.count(DefectDetection.id)).group_by(DefectDetection.severity).all()
    defect_dist = {sev: count for sev, count in defect_counts}

    # Recent inspections
    recent_inspections = db.query(InspectionSession).order_by(InspectionSession.inspection_date.desc()).limit(5).all()
    inspections_list = [{
        "id": i.id,
        "session_code": i.session_code,
        "road_name": i.road.name if i.road else "NH Corridor",
        "date": i.inspection_date.strftime("%Y-%m-%d"),
        "defects_found": i.total_defects,
        "status": i.status
    } for i in recent_inspections]

    return {
        "kpis": {
            "total_roads": total_roads,
            "total_km_inspected": round(total_km, 1),
            "total_accidents": total_accidents,
            "identified_black_spots": black_spots_count,
            "high_risk_segments": high_risk_segments,
            "detected_defects": total_defects,
            "critical_defects": critical_defects,
            "pending_repairs": 0,
            "total_repairs": 0
        },
        "severity_distribution": [
            {"name": "Fatal", "count": severity_dist.get("Fatal", 0), "color": "#DC2626"},
            {"name": "Severe Injury", "count": severity_dist.get("Severe Injury", 0), "color": "#EA580C"},
            {"name": "Minor Injury", "count": severity_dist.get("Minor Injury", 0), "color": "#D97706"},
            {"name": "Property Damage", "count": severity_dist.get("Property Damage", 0), "color": "#64748B"}
        ],
        "condition_distribution": [
            {"name": "Excellent", "count": condition_counts["Excellent"], "color": "#16A34A"},
            {"name": "Good", "count": condition_counts["Good"], "color": "#65A30D"},
            {"name": "Fair", "count": condition_counts["Fair"], "color": "#D97706"},
            {"name": "Poor", "count": condition_counts["Poor"], "color": "#EA580C"},
            {"name": "Critical", "count": condition_counts["Critical"], "color": "#DC2626"}
        ],
        "accident_timeline": timeline,
        "priority_overview": [
            {"name": "CRITICAL", "count": defect_dist.get("CRITICAL", 0), "color": "#DC2626"},
            {"name": "HIGH", "count": defect_dist.get("HIGH", 0), "color": "#EA580C"},
            {"name": "MEDIUM", "count": defect_dist.get("MEDIUM", 0), "color": "#D97706"},
            {"name": "LOW", "count": defect_dist.get("LOW", 0), "color": "#2563EB"}
        ],
        "recent_inspections": inspections_list
    }

@router.get("/risk-analysis")
def get_risk_analysis(road_id: int = 1, db: Session = Depends(get_db)):
    """
    Evaluates both Historical Black Spots (evidence-based) and
    Predicted Risk Segments (model-estimated from defects, friction, and lighting).
    """
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        road = db.query(Road).first()

    black_spots = db.query(BlackSpot).filter(BlackSpot.road_id == road.id).all()
    segments = db.query(RoadSegment).filter(RoadSegment.road_id == road.id).order_by(RoadSegment.segment_index).all()

    evaluated_segments = []
    for s in segments:
        def_count = db.query(DefectDetection).filter(DefectDetection.segment_id == s.id).count()
        acc_count = db.query(Accident).filter(Accident.segment_id == s.id).count()

        # Hybrid Risk Model: Historical (60%) + Structural Defect Factor (40%)
        structural_risk = (100.0 - s.health_score) / 100.0
        historical_risk = min(1.0, acc_count / 3.0)
        composite_risk_score = round((0.60 * historical_risk + 0.40 * structural_risk) * 100.0, 1)

        is_blackspot = any(
            abs(bs.latitude - s.start_lat) < 0.005 and abs(bs.longitude - s.start_lng) < 0.005
            for bs in black_spots
        )

        explanation = []
        if is_blackspot:
            explanation.append("Verified MoRTH Black Spot Cluster (historical crash concentration).")
        if def_count > 0:
            explanation.append(f"{def_count} unmitigated surface defect(s) detected.")
        if not s.streetlight_present:
            explanation.append("Inadequate night-time illumination profile.")
        if s.drainage_condition != "Adequate":
            explanation.append(f"Drainage risk: {s.drainage_condition}.")

        if not explanation:
            explanation.append("Nominal operating conditions with compliant pavement friction.")

        evaluated_segments.append({
            "segment_id": s.id,
            "chainage": f"Ch {s.chainage_start_m}m - {s.chainage_end_m}m",
            "start_lat": s.start_lat,
            "start_lng": s.start_lng,
            "health_score": s.health_score,
            "composite_risk_score": composite_risk_score,
            "risk_category": "CRITICAL" if composite_risk_score >= 65 else "HIGH" if composite_risk_score >= 45 else "MEDIUM" if composite_risk_score >= 25 else "LOW",
            "is_historical_blackspot": is_blackspot,
            "accidents_recorded": acc_count,
            "defects_detected": def_count,
            "risk_explanation": " ".join(explanation),
            "suggested_intervention": "High friction surfacing & drainage relief" if composite_risk_score >= 60 else "Routine crack sealing & marking refresh"
        })

    return {
        "road_name": road.name,
        "corridor_length_km": road.length_km,
        "total_segments_analyzed": len(evaluated_segments),
        "disclaimer": "SCIENTIFIC NOTICE: Distinguishes empirical accident black spots from heuristic risk scores. Risk indices do not guarantee accident occurrence.",
        "segments": evaluated_segments
    }

@router.get("/lighting")
def get_lighting_analysis(road_id: int = 1, db: Session = Depends(get_db)):
    """Streetlight asset inventory and night-time safety indicators."""
    segments = db.query(RoadSegment).filter(RoadSegment.road_id == road_id).all()
    unlit_segments = [s for s in segments if not s.streetlight_present]
    night_accidents = db.query(Accident).filter(
        Accident.road_id == road_id,
        Accident.lighting_condition.in_(["Dark - Unlighted", "Dark - Lighted"])
    ).all()

    items = []
    for s in unlit_segments:
        items.append({
            "segment_id": s.id,
            "chainage": f"Ch {s.chainage_start_m}m - {s.chainage_end_m}m",
            "latitude": s.start_lat,
            "longitude": s.start_lng,
            "lighting_status": "LUMINAIRE_ABSENT_OR_INOPERATIVE",
            "night_accidents_nearby": sum(1 for a in night_accidents if a.segment_id == s.id),
            "recommended_action": "Install 120W High-Mast Solar LED Luminaire Array with 50m spacing",
            "priority": "HIGH"
        })

    return {
        "road_id": road_id,
        "total_segments_monitored": len(segments),
        "unlit_segments_count": len(unlit_segments),
        "night_accident_records": len(night_accidents),
        "compliance_rate_pct": round(((len(segments) - len(unlit_segments)) / len(segments)) * 100.0, 1) if segments else 100.0,
        "deficiencies": items,
        "methodology_disclaimer": "Light presence is recorded via daytime asset inventories and night photometric lux surveys. Daylight camera imagery does not infer lumen levels."
    }
