from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="citizen")  # "police" | "citizen"
    full_name = Column(String(120), nullable=True)
    badge_or_id = Column(String(64), nullable=True)               # Police badge number or officer ID
    phone = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    path = Column(String, nullable=False)                         # Original uploaded video path
    annotated_path = Column(String, nullable=True)               # Generated playable processed video with bounding boxes & tracking IDs
    status = Column(String, default="uploaded")                  # uploaded | processing | done | failed
    error = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_location = Column(String, nullable=True)                # User-entered recording location
    geo = Column(JSON, nullable=True)                            # Visual geolocation candidates & evidence
    location_status = Column(String, default="unknown")          # unknown | candidates | confirmed
    loc_label = Column(String, nullable=True)
    loc_lat = Column(Float, nullable=True)
    loc_lon = Column(Float, nullable=True)
    analysis = Column(JSON, nullable=True)                       # Counts, tracking, density, trajectories, risk events
    traffic_category = Column(String, nullable=True)             # Low Traffic | Medium Traffic | High Traffic
    created_at = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)                        # predicted_collision_risk | congestion | citizen_report
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=True)
    ts = Column(Float, nullable=True)                            # Video timestamp in seconds
    severity = Column(String, nullable=False)                    # low | moderate | high | critical
    confidence = Column(Float, nullable=True)
    status = Column(String, default="unverified")                # unverified | verified | rejected
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    audience = Column(JSON, default=list)                        # ["police"] or ["police", "citizen"]
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporting_user = Column(String, nullable=True)               # Citizen username or contact
    category = Column(String, nullable=False)                    # accident | pothole | waterlogging | roadblock | etc.
    description = Column(Text, nullable=False)
    location_name = Column(String, nullable=True)                # User-provided location string
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    photo = Column(String, nullable=True)                        # Uploaded photo or video evidence path
    status = Column(String, default="Pending Verification")      # Pending Verification | Under Review | Verified | Rejected | Resolved
    police_remarks = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    resolution_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IncidentStatusHistory(Base):
    __tablename__ = "incident_status_history"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    status = Column(String, nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    police_remarks = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)                    # Accident | Road Closure | Severe Congestion | Waterlogging | etc.
    severity = Column(String, default="Moderate")                # Low | Moderate | High | Critical
    location = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    target_area = Column(String, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PredictiveRiskAlert(Base):
    __tablename__ = "predictive_risk_alerts"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=True)
    location = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    risk_level = Column(String, nullable=False)                  # Low | Moderate | High | Critical
    explanation = Column(Text, nullable=False)
    timestamp_sec = Column(Float, nullable=True)
    safety_recommendation = Column(Text, nullable=True)
    review_status = Column(String, default="Approved")           # Pending Review | Approved | Rejected
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class VideoComparisonRecord(Base):
    __tablename__ = "video_comparisons"
    id = Column(Integer, primary_key=True, index=True)
    video_id_1 = Column(Integer, ForeignKey("videos.id"), nullable=False)
    video_id_2 = Column(Integer, ForeignKey("videos.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    comparison_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
