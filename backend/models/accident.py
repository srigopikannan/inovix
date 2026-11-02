from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Accident(Base):
    __tablename__ = "accidents"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True) # e.g., ACC-2025-1042
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)

    accident_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    severity = Column(String(30), nullable=False) # Fatal, Severe Injury, Minor Injury, Property Damage
    accident_type = Column(String(50), nullable=False) # Head-on, Rear-end, Skid / Loss of Control, Rollover, Pedestrian
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    weather = Column(String(30), default="Clear") # Clear, Rain, Fog, Night - Unlit
    surface_condition = Column(String(40), default="Dry") # Dry, Wet, Oil Slick, Broken Asphalt, Pothole Impact
    lighting_condition = Column(String(40), default="Daylight") # Daylight, Dark - Lighted, Dark - Unlighted
    vehicles_involved = Column(Integer, default=2)

    casualties_fatal = Column(Integer, default=0)
    casualties_severe = Column(Integer, default=0)
    casualties_minor = Column(Integer, default=0)

    primary_factor = Column(String(100), default="Pavement Failure / Skid")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    road = relationship("Road", back_populates="accidents")
    segment = relationship("RoadSegment", back_populates="accidents")


class BlackSpot(Base):
    """
    Transparent Black Spot Entity identified according to Ministry of Road Transport & Highways (MoRTH) /
    Indian Road Congress (IRC) / FHWA protocol:
    Severity Index (SI) = (5 * Fatalities) + (3 * Severe Injuries) + (1 * Minor Injuries)
    Cluster criteria: Radius <= 500m, Accidents >= 3 within 3 years, or SI >= 15.
    """
    __tablename__ = "black_spots"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True) # e.g., BS-NH44-KM04
    name = Column(String(150), nullable=False)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=500.0)

    total_accidents = Column(Integer, default=0)
    fatal_count = Column(Integer, default=0)
    severe_count = Column(Integer, default=0)
    minor_count = Column(Integer, default=0)
    severity_index = Column(Float, default=0.0)

    risk_tier = Column(String(30), default="HIGH_PRIORITY") # CRITICAL_BLACK_SPOT, HIGH_PRIORITY, MONITORING
    classification_reason = Column(Text, nullable=False)
    methodology_note = Column(Text, default="MoRTH/IRC Protocol: SI = (5*Fatal) + (3*Severe) + (1*Minor). Cluster Window: 500m.")
    recommended_countermeasure = Column(Text, nullable=True)
    status = Column(String(30), default="ACTIVE") # ACTIVE, MITIGATED, UNDER_INVESTIGATION
    identified_date = Column(DateTime, default=datetime.utcnow)
