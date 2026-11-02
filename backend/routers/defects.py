from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import uuid
import os
from pathlib import Path

from ..database import get_db
from ..config import UPLOADS_DIR, DEFAULT_CONFIDENCE_THRESHOLD
from ..models import DefectDetection, RoadSegment, Road
from ..services.cv_engine import RoadCVEngine
from ..services.measurement_engine import MeasurementEngine
from ..services.health_engine import RoadHealthEngine

router = APIRouter(prefix="/api/defects", tags=["Defects & Computer Vision"])

@router.get("")
def list_defects(
    road_id: Optional[int] = None,
    segment_id: Optional[int] = None,
    defect_type: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DefectDetection)
    if road_id:
        query = query.filter(DefectDetection.road_id == road_id)
    if segment_id:
        query = query.filter(DefectDetection.segment_id == segment_id)
    if defect_type:
        query = query.filter(DefectDetection.defect_type == defect_type)
    if severity:
        query = query.filter(DefectDetection.severity == severity)

    defects = query.order_by(DefectDetection.detected_at.desc()).all()
    results = []
    for d in defects:
        results.append({
            "id": d.id,
            "road_id": d.road_id,
            "segment_id": d.segment_id,
            "inspection_id": d.inspection_id,
            "defect_type": d.defect_type,
            "severity": d.severity,
            "confidence": d.confidence,
            "bbox": [d.bbox_x, d.bbox_y, d.bbox_w, d.bbox_h],
            "image_url": d.image_url,
            "annotated_image_url": d.annotated_image_url,
            "pixel_length": d.pixel_length,
            "pixel_width": d.pixel_width,
            "estimated_length_mm": d.estimated_length_mm,
            "estimated_width_mm": d.estimated_width_mm,
            "estimated_area_cm2": d.estimated_area_cm2,
            "measurement_calibrated": d.measurement_calibrated,
            "measurement_notes": d.measurement_notes,
            "status": d.status,
            "detected_at": d.detected_at.isoformat()
        })
    return results

@router.post("/detect")
async def detect_defects_api(
    file: Optional[UploadFile] = File(None),
    sample_image_url: Optional[str] = Form(None),
    road_id: int = Form(1),
    segment_id: Optional[int] = Form(None),
    confidence_threshold: float = Form(DEFAULT_CONFIDENCE_THRESHOLD),
    db: Session = Depends(get_db)
):
    """
    Executes actual OpenCV computer vision inference pipeline on the uploaded image.
    Generates engineering annotations and calculates metric dimensional estimates.
    """
    saved_path = None
    if file and file.filename:
        # Security: validate file extension
        ext = Path(file.filename).suffix.lower()
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed extensions: {', '.join(sorted(allowed_extensions))}"
            )

        # Security: validate file size (25 MB max)
        MAX_UPLOAD_SIZE = 25 * 1024 * 1024
        contents = await file.read()
        if len(contents) > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="File size exceeds maximum permitted limit (25 MB).")

        filename = f"upload_{uuid.uuid4().hex[:8]}{ext}"
        saved_path = UPLOADS_DIR / filename
        with open(saved_path, "wb") as buffer:
            buffer.write(contents)
        image_url = f"/uploads/{filename}"
    elif sample_image_url:
        # Relocate relative path
        fname = Path(sample_image_url).name
        target = UPLOADS_DIR / fname
        if not target.exists():
            raise HTTPException(status_code=404, detail="Referenced sample image not found on disk")
        saved_path = target
        image_url = sample_image_url
    else:
        # Default sample image fallback
        target = UPLOADS_DIR / "sample_pothole_nh44.jpg"
        if not target.exists():
            raise HTTPException(status_code=400, detail="No image file uploaded or available")
        saved_path = target
        image_url = "/uploads/sample_pothole_nh44.jpg"

    # Run real OpenCV defect detection inference
    detections = RoadCVEngine.detect_defects(str(saved_path), confidence_threshold=confidence_threshold)

    # Generate annotated image
    annotated_url = RoadCVEngine.annotate_image(str(saved_path), detections)

    # Save detections to database
    saved_defects = []
    for det in detections:
        # Measurement computation
        meas = MeasurementEngine.compute_dimensions(
            pixel_length=det["pixel_length"],
            pixel_width=det["pixel_width"],
            contour_area_px=det["contour_area_px"]
        )

        db_defect = DefectDetection(
            road_id=road_id,
            segment_id=segment_id,
            defect_type=det["defect_type"],
            severity=det["severity"],
            confidence=det["confidence"],
            bbox_x=det["bbox"][0],
            bbox_y=det["bbox"][1],
            bbox_w=det["bbox"][2],
            bbox_h=det["bbox"][3],
            image_url=image_url,
            annotated_image_url=annotated_url,
            pixel_length=det["pixel_length"],
            pixel_width=det["pixel_width"],
            estimated_length_mm=meas["metric_dimensions"]["length_mm"],
            estimated_width_mm=meas["metric_dimensions"]["width_mm"],
            estimated_area_cm2=meas["metric_dimensions"]["estimated_area_cm2"],
            measurement_calibrated=meas["calibration"]["is_calibrated"],
            measurement_notes=meas["calibration"]["metrology_notice"],
            status="UNRESOLVED"
        )
        db.add(db_defect)
        saved_defects.append(db_defect)

    db.commit()

    # Recalculate health score for this segment if specified
    if segment_id:
        seg = db.query(RoadSegment).filter(RoadSegment.id == segment_id).first()
        if seg:
            all_seg_defects = db.query(DefectDetection).filter(DefectDetection.segment_id == segment_id).all()
            defect_dicts = [{"severity": d.severity, "defect_type": d.defect_type} for d in all_seg_defects]
            calc = RoadHealthEngine.calculate_segment_health(
                defects=defect_dicts,
                drainage_condition=seg.drainage_condition,
                streetlight_present=seg.streetlight_present,
                iri=seg.surface_roughness_iri
            )
            seg.health_score = calc["health_score"]
            seg.risk_level = calc["risk_level"]
            seg.defect_count = len(all_seg_defects)
            db.commit()

    return {
        "status": "DETECTION_COMPLETED",
        "image_url": image_url,
        "annotated_image_url": annotated_url,
        "detections_count": len(detections),
        "detections": detections
    }
