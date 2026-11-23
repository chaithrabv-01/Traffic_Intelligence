"""
Road Segment Risk Service using PostGIS / GeoPandas / Shapely geometry.
Associates geographic coordinates with road corridors and computes corridor-level safety risk.
"""
import json, math
from pathlib import Path
from shapely.geometry import Point, LineString
from ..config import DATA

SEGMENTS_PATH = DATA / "road_segments" / "bengaluru_segments.geojson"

def _load_geojson():
    if not SEGMENTS_PATH.exists():
        return {"type": "FeatureCollection", "features": []}
    return json.loads(SEGMENTS_PATH.read_text())

def get_all_segments():
    """Return all road segments with their geometries and computed safety risk."""
    return _load_geojson()

def get_nearest_segment(lat: float, lon: float, max_dist_m: float = 1500.0):
    """
    Find the closest road corridor to (lat, lon) using Shapely spatial geometry.
    Converts degrees to approximate meters (1 deg lat ~ 111km, 1 deg lon ~ 111km * cos(lat)).
    """
    fc = _load_geojson()
    if not fc.get("features"):
        return None

    pt = Point(lon, lat)
    best_feat = None
    min_dist_m = float("inf")

    cos_lat = math.cos(math.radians(lat))
    m_per_deg_lat = 111320.0
    m_per_deg_lon = 111320.0 * cos_lat

    for feat in fc["features"]:
        coords = feat["geometry"]["coordinates"]
        line = LineString(coords)
        
        # Approximate distance in meters
        dist_deg = line.distance(pt)
        dist_m = dist_deg * ((m_per_deg_lat + m_per_deg_lon) / 2)
        
        if dist_m < min_dist_m:
            min_dist_m = dist_m
            best_feat = feat

    if best_feat and min_dist_m <= max_dist_m:
        props = dict(best_feat["properties"])
        props["distance_to_corridor_m"] = round(min_dist_m, 1)
        props["matched_road"] = props["road_name"]
        return props
    return None

def update_segment_risk(segment_id: str, added_incidents: int = 1, congestion_factor: float = 1.0):
    """Dynamically updates risk score for a road corridor."""
    fc = _load_geojson()
    found = False
    for feat in fc["features"]:
        if feat["properties"]["segment_id"] == segment_id:
            p = feat["properties"]
            p["historical_accidents_yr"] += added_incidents
            # Safety score index formula
            base_score = min(0.95, p["risk_score"] + (added_incidents * 0.02 * congestion_factor))
            p["risk_score"] = round(base_score, 3)
            p["risk_level"] = "critical" if base_score >= 0.8 else "high" if base_score >= 0.65 else "moderate" if base_score >= 0.4 else "low"
            found = True
            break
    if found:
        SEGMENTS_PATH.write_text(json.dumps(fc, indent=2))
    return found
