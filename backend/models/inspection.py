from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class InspectionSession(Base):
    __tablename__ = "inspection_sessions"

    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    session_code = Column(String(50), unique=True, index=True) # e.g., INSP-2025-10-01

    inspector_name = Column(String(100), default="Senior Road Safety Inspector")
    inspection_date = Column(DateTime, default=datetime.utcnow)
    direction = Column(String(20), default="Northbound") # Northbound, Southbound, Eastbound, Westbound
    route_length_km = Column(Float, default=10.0)
    total_segments = Column(Integer, default=100)
    total_defects = Column(Integer, default=0)

    status = Column(String(30), default="COMPLETED") # IN_PROGRESS, COMPLETED, REVIEWED
    video_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    road = relationship("Road", back_populates="inspections")
    defects = relationship("DefectDetection", back_populates="inspection")
