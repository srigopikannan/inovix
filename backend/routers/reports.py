from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from pathlib import Path
from ..database import get_db
from ..config import REPORTS_DIR
from ..models import Road, RoadSegment, BlackSpot, DefectDetection, Accident, ReconstructionProposal
from ..services.report_engine import ReportEngine, format_inr_text

router = APIRouter(prefix="/api/reports", tags=["Report Generation"])

class ReportRequest(BaseModel):
    report_type: str # "blackspot", "health"
    format: str = "pdf" # "pdf" or "csv"
    road_id: int = 1

@router.post("/generate")
def generate_report(payload: ReportRequest, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == payload.road_id).first()
    if not road:
        road = db.query(Road).first()

    corridor_info = {
        "name": road.name,
        "code": road.code,
        "length_km": road.length_km,
        "authority": "State Highway & Infrastructure Directorate"
    }

    if payload.report_type == "blackspot":
        blackspots = db.query(BlackSpot).filter(BlackSpot.road_id == road.id).all()
        if payload.format == "csv":
            data = [{
                "Code": b.code,
                "Name": b.name,
                "Severity_Index": b.severity_index,
                "Total_Accidents": b.total_accidents,
                "Fatal": b.fatal_count,
                "Severe": b.severe_count,
                "Risk_Tier": b.risk_tier,
                "Reason": b.classification_reason
            } for b in blackspots]
            url = ReportEngine.generate_csv_report(
                data,
                ["Code", "Name", "Severity_Index", "Total_Accidents", "Fatal", "Severe", "Risk_Tier", "Reason"],
                "BlackSpot_Analysis"
            )
            return {"download_url": url, "format": "csv"}
        else:
            headers = ["Code", "Zone / Location", "Severity Index", "Fatal / Severe", "Risk Tier", "Countermeasure"]
            rows = [
                [b.code, b.name, f"{b.severity_index:.1f}", f"{b.fatal_count} / {b.severe_count}", b.risk_tier, b.recommended_countermeasure[:60] + "..."]
                for b in blackspots
            ]
            summary = [
                {"label": "Total Black Spots", "value": str(len(blackspots))},
                {"label": "Critical Priority", "value": str(sum(1 for b in blackspots if b.risk_tier == "CRITICAL_BLACK_SPOT"))},
                {"label": "MoRTH SI Threshold", "value": ">= 10.0"},
                {"label": "Cluster Radius", "value": "500 m"}
            ]
            methodology = (
                "MoRTH / Indian Road Congress (IRC:SP:88-2019) Protocol. Severity Index SI = (5 x Fatal) + (3 x Severe) + (1 x Minor). "
                "Zones with SI >= 10.0 or multiple fatal incidents within 500m window are designated as statutory black spots."
            )
            url = ReportEngine.generate_pdf_report(
                title="ROAD ACCIDENT BLACK SPOT AUDIT REPORT",
                subtitle="MoRTH / IRC Protocol Black Spot Identification & Remedial Plan",
                corridor_info=corridor_info,
                summary_metrics=summary,
                table_headers=headers,
                table_rows=rows,
                methodology_text=methodology,
                filename_prefix="BlackSpot_Audit"
            )
            return {"download_url": url, "format": "pdf"}

    elif payload.report_type == "health":
        segments = db.query(RoadSegment).filter(RoadSegment.road_id == road.id).order_by(RoadSegment.segment_index).all()
        if payload.format == "csv":
            data = [{
                "Segment_ID": s.id,
                "Chainage_Start": s.chainage_start_m,
                "Chainage_End": s.chainage_end_m,
                "Health_Score": s.health_score,
                "Risk_Level": s.risk_level,
                "Defects": s.defect_count,
                "Roughness_IRI": s.surface_roughness_iri,
                "Drainage": s.drainage_condition
            } for s in segments]
            url = ReportEngine.generate_csv_report(
                data,
                ["Segment_ID", "Chainage_Start", "Chainage_End", "Health_Score", "Risk_Level", "Defects", "Roughness_IRI", "Drainage"],
                "Road_Health_Index"
            )
            return {"download_url": url, "format": "csv"}
        else:
            headers = ["Chainage", "Health Index", "Risk Level", "Defects", "IRI (m/km)", "Drainage"]
            rows = [
                [f"Ch {s.chainage_start_m}-{s.chainage_end_m}m", f"{s.health_score}/100", s.risk_level, str(s.defect_count), f"{s.surface_roughness_iri}", s.drainage_condition]
                for s in segments[:25] # Top 25 segments for executive view
            ]
            avg_score = sum(s.health_score for s in segments) / len(segments) if segments else 100
            summary = [
                {"label": "Monitored Segments", "value": f"{len(segments)} (100m ea)"},
                {"label": "Corridor Health Avg", "value": f"{avg_score:.1f} / 100"},
                {"label": "Critical Segments", "value": str(sum(1 for s in segments if s.risk_level == 'CRITICAL'))},
                {"label": "High Risk Segments", "value": str(sum(1 for s in segments if s.risk_level == 'HIGH'))}
            ]
            methodology = (
                "Road Health Index (RHI) calculated via defect severity deductions (Critical: -18, High: -10, Medium: -5), "
                "drainage condition status, and International Roughness Index (IRI) penalties."
            )
            url = ReportEngine.generate_pdf_report(
                title="PAVEMENT HEALTH & ASSET CONDITION REPORT",
                subtitle="Segment-Wise Road Condition Assessment & Friction Index",
                corridor_info=corridor_info,
                summary_metrics=summary,
                table_headers=headers,
                table_rows=rows,
                methodology_text=methodology,
                filename_prefix="Road_Health_Report"
            )
            return {"download_url": url, "format": "pdf"}

    else:
        raise HTTPException(status_code=400, detail="Invalid report type specified")

@router.get("/download/{filename}")
def download_file(filename: str):
    # Security: Guard against path traversal attacks
    safe_name = Path(filename).name
    file_path = (REPORTS_DIR / safe_name).resolve()
    if not str(file_path).startswith(str(REPORTS_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Forbidden: path traversal violation detected")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested report file not found")
    media_type = "application/pdf" if filename.endswith(".pdf") else "text/csv"
    return FileResponse(path=str(file_path), media_type=media_type, filename=safe_name)
