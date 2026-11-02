from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class RepairTask(Base):
    __tablename__ = "repair_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(50), unique=True, index=True) # e.g., REP-2025-0089
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)
    defect_id = Column(Integer, ForeignKey("defect_detections.id"), nullable=True)

    title = Column(String(200), nullable=False)
    repair_type = Column(String(80), nullable=False)
    # Pothole Patching, Crack Sealing, Resurfacing / Milling, Road Marking Restoration, 
    # Drainage Maintenance, Streetlight Maintenance, Road Sign Replacement, Shoulder Edge Repair

    priority = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, ROUTINE
    status = Column(String(30), default="PENDING_APPROVAL") # PENDING_APPROVAL, APPROVED, SCHEDULED, IN_PROGRESS, COMPLETED

    # Cost breakdown according to Schedule of Rates (SOR)
    estimated_quantity = Column(Float, default=1.0)
    unit_of_measure = Column(String(30), default="sq_m") # sq_m, linear_m, units
    unit_rate_usd = Column(Float, default=45.0)
    material_cost = Column(Float, default=0.0)
    labor_cost = Column(Float, default=0.0)
    equipment_cost = Column(Float, default=0.0)
    total_estimated_cost = Column(Float, default=0.0)

    contractor_assigned = Column(String(100), default="Highway Maintenance Corp Zone 1")
    target_completion_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    road = relationship("Road", back_populates="repairs")
    segment = relationship("RoadSegment", back_populates="repairs")
