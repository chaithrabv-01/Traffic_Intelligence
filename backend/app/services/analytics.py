"""
Traffic analytics engine:
- Summarizes unique vehicles and trajectories
- Estimates speeds (pixels/s and calibrated km/h)
- Measures spatial density and flow throughput
- Multi-factor traffic classification: Low Traffic, Medium Traffic, High Traffic
"""
import math
from collections import Counter
import numpy as np

def compass(dx, dy):
    """Image coordinate direction: +y is downward."""
    if math.hypot(dx, dy) < 15:
        return "stationary"
    a = math.degrees(math.atan2(-dy, dx)) % 360
    directions = ["east", "north-east", "north(away)", "north-west", "west", "south-west", "south(toward)", "south-east"]
    return directions[int(((a + 22.5) % 360) // 45)]

def classify_traffic_condition(mean_density, peak_density, unique_volume, duration_s, stationary_ratio):
    """
    Multi-factor traffic classification:
    Combines:
    1. Spatial Density (vehicles per frame)
    2. Vehicle Volume Throughput (vehicles per minute)
    3. Congestion / Stationary Ratio (ratio of stopped/crawling vehicles)
    Returns: "Low Traffic" | "Medium Traffic" | "High Traffic" + detailed explanation.
    """
    duration_min = max(duration_s / 60.0, 0.1)
    flow_rate_per_min = unique_volume / duration_min
    
    # Composite Traffic Score (0 to 100)
    # Density component (weight: 40%)
    density_score = min(100.0, (mean_density / 15.0) * 100.0)
    # Flow volume component (weight: 35%)
    flow_score = min(100.0, (flow_rate_per_min / 30.0) * 100.0)
    # Stagnation/congestion component (weight: 25%)
    stagnation_score = min(100.0, stationary_ratio * 100.0)

    composite_index = round(0.40 * density_score + 0.35 * flow_score + 0.25 * stagnation_score, 1)

    if composite_index < 35.0 and mean_density < 6.0:
        category = "Low Traffic"
        explanation = f"Free-flowing traffic: average {mean_density:.1f} vehicles/frame, throughput {flow_rate_per_min:.1f} veh/min, minimal congestion."
    elif composite_index < 70.0 and mean_density < 14.0:
        category = "Medium Traffic"
        explanation = f"Moderate traffic volume: average {mean_density:.1f} vehicles/frame, throughput {flow_rate_per_min:.1f} veh/min with steady flow."
    else:
        category = "High Traffic"
        explanation = f"High density / congested traffic: peak {peak_density} vehicles/frame, throughput {flow_rate_per_min:.1f} veh/min with slowed movement."

    return {
        "category": category,
        "composite_traffic_index": composite_index,
        "flow_rate_per_min": round(flow_rate_per_min, 1),
        "mean_density_per_frame": round(mean_density, 1),
        "peak_density": peak_density,
        "stationary_ratio": round(stationary_ratio, 2),
        "explanation": explanation,
        "thresholds": "Low: index < 35, Medium: 35 <= index < 70, High: index >= 70 (multi-factor: density 40%, flow 35%, stagnation 25%)"
    }

def summarize(res, m_per_px=None, min_track_pts=3):
    tr, out, counts = res["tracks"], [], Counter()
    stationary_count = 0

    for tid, d in tr.items():
        pts = d["pts"]
        if len(pts) < min_track_pts:
            continue
        
        cls = d["cls"].most_common(1)[0][0]
        counts[cls] += 1
        
        (t0, x0, y0, *_), (t1, x1, y1, *_) = pts[0], pts[-1]
        dt = max(t1 - t0, 1e-6)
        dx, dy = x1 - x0, y1 - y0
        dist_px = math.hypot(dx, dy)
        px_s = dist_px / dt
        
        dir_label = compass(dx, dy)
        if dir_label == "stationary" or px_s < 10.0:
            stationary_count += 1

        out.append({
            "id": tid,
            "cls": cls,
            "direction": dir_label,
            "avg_speed_px_s": round(px_s, 1),
            "avg_speed_kmh": round(px_s * m_per_px * 3.6, 1) if m_per_px else None,
            "duration_s": round(dt, 2),
            "points": pts[::2]  # Subsample points for efficient JSON transfer
        })

    pf = np.array([n for _, n in res["per_frame"]] or [0])
    mean_density = float(pf.mean())
    peak_density = int(pf.max())
    total_unique = sum(counts.values())
    duration_s = res.get("duration_s", float(len(res["per_frame"]) * 0.2))
    stationary_ratio = (stationary_count / max(total_unique, 1))

    # Multi-factor traffic classification
    traffic_eval = classify_traffic_condition(
        mean_density=mean_density,
        peak_density=peak_density,
        unique_volume=total_unique,
        duration_s=duration_s,
        stationary_ratio=stationary_ratio
    )

    return {
        "counts": dict(counts),
        "total_unique_vehicles": total_unique,
        "tracks": out,
        "traffic_classification": traffic_eval,
        "traffic_category": traffic_eval["category"],
        "density": {
            "mean_vehicles_per_frame": round(mean_density, 1),
            "peak": peak_density,
            "level": traffic_eval["category"].lower().replace(" traffic", ""),
            "note": traffic_eval["explanation"]
        },
        "fps": res["fps"],
        "frame_size": res["size"],
        "calibrated": m_per_px is not None,
        "m_per_px": m_per_px
    }
