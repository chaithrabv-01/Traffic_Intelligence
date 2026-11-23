"""Central event engine: routes by severity, confidence, verification and location certainty."""
from ..models import Event
from . import notifications

POLICE_MIN = {"moderate", "high", "critical"}

def emit(db, type_, severity, video=None, ts=None, confidence=None, payload=None, status="unverified"):
    located = bool(video and video.location_status == "confirmed")
    audience = ["police"] if severity in POLICE_MIN or type_ == "citizen_report" else []
    e = Event(type=type_, severity=severity, video_id=video.id if video else None, ts=ts,
              confidence=confidence, status=status, payload=payload or {}, audience=audience,
              lat=video.loc_lat if located else None, lon=video.loc_lon if located else None)
    db.add(e); db.commit()

    # Route real-time notification
    title = f"Traffic Alert: {type_.replace('_', ' ').title()} ({severity.upper()})"
    loc_str = f" at {video.loc_label}" if (video and video.loc_label) else ""
    body = f"{type_.replace('_', ' ').capitalize()} detected{loc_str} (Severity: {severity})."
    notifications.push_notification(title, body, severity, audience=audience, data={"event_id": e.id, "type": type_})

    return e

def citizen_visible(e):
    # Citizens only see VERIFIED events with a confirmed location. Predicted risk never goes public unverified.
    return e.status == "verified" and e.lat is not None and e.lon is not None

def on_video_done(db, video):
    for r in (video.analysis or {}).get("risk", []):
        if r["level"] in ("moderate", "high", "critical"):
            emit(db, "predicted_collision_risk", r["level"], video, r["ts"], r["score"], r)
    d = (video.analysis or {}).get("density", {})
    if d.get("level") in ("high", "severe"):
        emit(db, "congestion", "high" if d["level"] == "high" else "critical", video, None, None, d)
