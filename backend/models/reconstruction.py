from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from datetime import datetime
from ..database import Base

class ReconstructionProposal(Base):
    """
    ROADGUARD VISION Flagship Model:
    Stores the before/after reconstruction simulation, proposed repair actions,
    cost estimates, and strictly verified disclaimers.
    """
    __tablename__ = "reconstruction_proposals"

    id = Column(Integer, primary_key=True, index=True)
    proposal_code = Column(String(50), unique=True, index=True) # e.g., RGV-2025-044
    title = Column(String(200), nullable=False)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)

    original_image_url = Column(String(255), nullable=False)
    reconstructed_image_url = Column(String(255), nullable=False)
    selected_actions = Column(JSON, default=list) # List of actions e.g. ["Pothole patching", "Road resurfacing", "Road marking restoration"]
    estimated_total_cost = Column(Float, default=0.0)

    disclaimer_label = Column(String(255), default="AI-GENERATED PROPOSED RECONSTRUCTION - NOT AN ACTUAL COMPLETED ROAD.")
    engineering_rationale = Column(Text, nullable=True)
    created_by = Column(String(100), default="Infrastructure Engineer")
    created_at = Column(DateTime, default=datetime.utcnow)
