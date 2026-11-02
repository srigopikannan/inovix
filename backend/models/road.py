from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)  # e.g., NH-44-SEC-09
    name = Column(String(200), nullable=False)          # e.g., Cyber City - Outer Expressway Corridor
    highway_class = Column(String(50), default="National Highway") # Expressway, State Highway, Arterial
    length_km = Column(Float, default=10.0)             # Up to 10 km signature route
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    surface_type = Column(String(50), default="Asphalt / Dense Bituminous Macadam")
    lane_count = Column(Integer, default=4)
    speed_limit_kph = Column(Integer, default=80)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    segments = relationship("RoadSegment", back_populates="road", cascade="all, delete-orphan", order_by="RoadSegment.segment_index")
    accidents = relationship("Accident", back_populates="road", cascade="all, delete-orphan")
    defects = relationship("DefectDetection", back_populates="road", cascade="all, delete-orphan")
    repairs = relationship("RepairTask", back_populates="road", cascade="all, delete-orphan")
    inspections = relationship("InspectionSession", back_populates="road", cascade="all, delete-orphan")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    segment_index = Column(Integer, nullable=False)      # 0 to 99 for a 10 km corridor
    chainage_start_m = Column(Integer, nullable=False)   # e.g., 0, 100, 200 ...
    chainage_end_m = Column(Integer, nullable=False)     # e.g., 100, 200, 300 ...
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)

    # Computed metrics
    health_score = Column(Float, default=100.0)         # 0-100 scale (100 = perfect, <50 = critical)
    risk_level = Column(String(20), default="LOW")      # LOW, MEDIUM, HIGH, CRITICAL
    defect_count = Column(Integer, default=0)
    surface_roughness_iri = Column(Float, default=2.1)   # International Roughness Index m/km
    streetlight_present = Column(Boolean, default=True)
    drainage_condition = Column(String(50), default="Adequate") # Adequate, Partially Blocked, Severely Damaged

    road = relationship("Road", back_populates="segments")
    accidents = relationship("Accident", back_populates="segment")
    defects = relationship("DefectDetection", back_populates="segment")
    repairs = relationship("RepairTask", back_populates="segment")
