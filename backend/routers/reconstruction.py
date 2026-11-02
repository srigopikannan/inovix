from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from pathlib import Path
import os

from ..database import get_db
from ..config import UPLOADS_DIR
from ..models import ReconstructionProposal, DefectDetection, RoadSegment, Road
from ..services.reconstruction_engine import ReconstructionEngine

router = APIRouter(prefix="/api/reconstruction", tags=["ROADGUARD VISION Simulator"])

class SimulationRequest(BaseModel):
    road_id: int
    segment_id: Optional[int] = None
    image_url: Optional[str] = None
    selected_actions: List[str] # ["Pothole patching", "Crack sealing", "Road resurfacing", "Road marking restoration", "Streetlight installation or maintenance"]

class ProposalSaveRequest(BaseModel):
    road_id: int
    segment_id: Optional[int] = None
    title: str
    original_image_url: str
    reconstructed_image_url: str
    selected_actions: List[str]
    estimated_total_cost: Optional[float] = 0.0
    engineering_rationale: Optional[str] = None
    created_by: Optional[str] = "Infrastructure Engineer"

@router.get("/proposals")
def list_proposals(road_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ReconstructionProposal)
    if road_id:
        query = query.filter(ReconstructionProposal.road_id == road_id)
    proposals = query.order_by(ReconstructionProposal.created_at.desc()).all()
    results = []
    for p in proposals:
        results.append({
            "id": p.id,
            "proposal_code": p.proposal_code,
            "title": p.title,
            "road_id": p.road_id,
            "segment_id": p.segment_id,
            "original_image_url": p.original_image_url,
            "reconstructed_image_url": p.reconstructed_image_url,
            "selected_actions": p.selected_actions,
            "estimated_total_cost": p.estimated_total_cost,
            "disclaimer_label": p.disclaimer_label,
            "engineering_rationale": p.engineering_rationale,
            "created_by": p.created_by,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return results

@router.post("/simulate")
def simulate_reconstruction_api(payload: SimulationRequest, db: Session = Depends(get_db)):
    """
    Flagship ROADGUARD VISION Simulator:
    Applies synthetic asphalt overlay, polymer crack sealant, and IRC-35 thermoplastic
    markings to the target image. Returns before/after URLs and budget estimate.
    """
    # Resolve physical image path
    target_path = None
    if payload.image_url:
        fname = Path(payload.image_url).name
        fpath = UPLOADS_DIR / fname
        if fpath.exists():
            target_path = str(fpath)

    if not target_path:
        # Default sample image from disk
        fallback = UPLOADS_DIR / "sample_pothole_nh44.jpg"
        if fallback.exists():
            target_path = str(fallback)
            payload.image_url = "/uploads/sample_pothole_nh44.jpg"
        else:
            raise HTTPException(status_code=400, detail="Source image file not found for reconstruction simulation.")

    # Fetch associated defects for bounding reference
    defects = []
    if payload.segment_id:
        seg_defects = db.query(DefectDetection).filter(DefectDetection.segment_id == payload.segment_id).all()
        for d in seg_defects:
            defects.append({
                "defect_type": d.defect_type,
                "bbox": [d.bbox_x, d.bbox_y, d.bbox_w, d.bbox_h]
            })

    # Execute simulation
    sim_result = ReconstructionEngine.simulate_reconstruction(
        image_path=target_path,
        detections=defects,
        selected_actions=payload.selected_actions
    )

    return {
        "status": "SIMULATION_SUCCESS",
        "original_image_url": payload.image_url,
        "reconstructed_image_url": sim_result["reconstructed_image_url"],
        "selected_actions": payload.selected_actions,
        "disclaimer_label": ReconstructionEngine.MANDATORY_DISCLAIMER
    }

@router.post("/proposals")
def save_proposal(payload: ProposalSaveRequest, db: Session = Depends(get_db)):
    code = f"RGV-PROP-{db.query(ReconstructionProposal).count() + 1:04d}"
    prop = ReconstructionProposal(
        proposal_code=code,
        title=payload.title,
        road_id=payload.road_id,
        segment_id=payload.segment_id,
        original_image_url=payload.original_image_url,
        reconstructed_image_url=payload.reconstructed_image_url,
        selected_actions=payload.selected_actions,
        estimated_total_cost=payload.estimated_total_cost,
        engineering_rationale=payload.engineering_rationale,
        disclaimer_label=ReconstructionEngine.MANDATORY_DISCLAIMER,
        created_by=payload.created_by
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return {"message": "Reconstruction proposal saved", "id": prop.id, "proposal_code": prop.proposal_code}
