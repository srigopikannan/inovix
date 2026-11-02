from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class DefectDetection(Base):
    __tablename__ = "defect_detections"

    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspection_sessions.id"), nullable=True)

    defect_type = Column(String(60), nullable=False) 
    # Potholes, Road cracks, Surface deterioration, Damaged road edges, 
    # Visible drainage problems, Damaged road signs, Faded road markings, Waterlogging

    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.88) # AI confidence 0.00 to 1.00

    # Normalized Bounding Box Coordinates (0.0 to 1.0)
    bbox_x = Column(Float, default=0.2)
    bbox_y = Column(Float, default=0.3)
    bbox_w = Column(Float, default=0.35)
    bbox_h = Column(Float, default=0.25)

    image_url = Column(String(255), nullable=False)
    annotated_image_url = Column(String(255), nullable=True)

    # Physical Dimensions from Measurement Engine
    pixel_length = Column(Float, default=0.0)
    pixel_width = Column(Float, default=0.0)
    estimated_length_mm = Column(Float, default=0.0)
    estimated_width_mm = Column(Float, default=0.0)
    estimated_area_cm2 = Column(Float, default=0.0)
    measurement_calibrated = Column(Boolean, default=False)
    measurement_notes = Column(String(255), default="Calculated via camera reference pixel scale.")

    detected_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), default="UNRESOLVED") # UNRESOLVED, SCHEDULED_REPAIR, REPAIRED

    road = relationship("Road", back_populates="defects")
    segment = relationship("RoadSegment", back_populates="defects")
    inspection = relationship("InspectionSession", back_populates="defects")
