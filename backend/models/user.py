from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(String(50), default="Road Safety Engineer") # Admin, Road Safety Engineer, Maintenance Chief, GIS Analyst, Inspector
    department = Column(String(100), default="State Highway Authority & Transportation Directorate")
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    performed_by = Column(String(100), default="System")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
