"""
Generate realistic datasets for:
1. Historical accident records (backend/data/accidents/accidents.csv)
2. Hourly traffic counts (backend/data/traffic_counts/counts.csv)
3. Bengaluru road network segments GeoJSON (backend/data/road_segments/bengaluru_segments.geojson)
"""
import math, json, random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import numpy as np

random.seed(42)
np.random.seed(42)

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "backend" / "data"

# -------------------------------------------------------------
# 1. Historical Accident Records (accidents.csv)
# -------------------------------------------------------------
# Bengaluru clusters + control cities
hotspots = [
    # Bengaluru Hotspots
    {"name": "Silk Board Junction", "city": "Bengaluru", "locality": "Central Silk Board", "lat": 12.9176, "lon": 77.6238, "count": 48, "spread": 0.0025, "mean_sev": 3.8},
    {"name": "Tin Factory / KR Puram", "city": "Bengaluru", "locality": "KR Puram Hanging Bridge", "lat": 12.9986, "lon": 77.6744, "count": 42, "spread": 0.003, "mean_sev": 4.1},
    {"name": "Hebbal Flyover", "city": "Bengaluru", "locality": "Hebbal Junction", "lat": 13.0358, "lon": 77.5970, "count": 39, "spread": 0.0028, "mean_sev": 3.6},
    {"name": "Marathahalli Bridge", "city": "Bengaluru", "locality": "Marathahalli ORR", "lat": 12.9554, "lon": 77.7011, "count": 35, "spread": 0.0022, "mean_sev": 3.4},
    {"name": "Goraguntepalya Junction", "city": "Bengaluru", "locality": "Yeshwanthpur-Tumkur Rd", "lat": 13.0285, "lon": 77.5408, "count": 31, "spread": 0.0026, "mean_sev": 3.9},
    {"name": "Electronic City Toll Gate", "city": "Bengaluru", "locality": "Hosur Road Elevated Toll", "lat": 12.8452, "lon": 77.6602, "count": 27, "spread": 0.0035, "mean_sev": 4.2},
    {"name": "Dairy Circle / Bannerghatta Rd", "city": "Bengaluru", "locality": "Dairy Circle", "lat": 12.9344, "lon": 77.5997, "count": 24, "spread": 0.0020, "mean_sev": 3.1},
    {"name": "Mysore Road Satellite Bus Station", "city": "Bengaluru", "locality": "Bapuji Nagar", "lat": 12.9538, "lon": 77.5412, "count": 22, "spread": 0.0024, "mean_sev": 3.5},
    {"name": "Whitefield Hope Farm", "city": "Bengaluru", "locality": "Hope Farm Junction", "lat": 12.9842, "lon": 77.7516, "count": 18, "spread": 0.0025, "mean_sev": 3.2},
    # Other cities (showing generalization and multi-city support)
    {"name": "Western Express Highway Andheri", "city": "Mumbai", "locality": "Andheri East", "lat": 19.1197, "lon": 72.8524, "count": 25, "spread": 0.003, "mean_sev": 3.7},
    {"name": "AIIMS Ring Road Flyover", "city": "Delhi", "locality": "Ansari Nagar", "lat": 28.5672, "lon": 77.2100, "count": 26, "spread": 0.003, "mean_sev": 3.9},
]

acc_records = []
rec_id = 1
start_date = datetime(2025, 1, 1)

for spot in hotspots:
    for _ in range(spot["count"]):
        dt = start_date + timedelta(days=random.randint(0, 365), hours=random.randint(0, 23), minutes=random.randint(0, 59))
        lat = spot["lat"] + np.random.normal(0, spot["spread"])
        lon = spot["lon"] + np.random.normal(0, spot["spread"])
        sev = min(5, max(1, int(round(np.random.normal(spot["mean_sev"], 0.7)))))
        ctype = random.choice(["rear-end", "side-swipe", "head-on", "pedestrian-collision", "t-bone", "skid"])
        weather = random.choice(["clear", "rain", "fog", "cloudy"])
        road_cond = "wet" if weather == "rain" else "dry"
        vehicles = random.randint(1, 4)
        casualties = 1 if sev >= 4 and random.random() > 0.4 else (0 if sev < 4 else random.randint(0, 2))
        
        acc_records.append({
            "accident_id": f"ACC-{rec_id:05d}",
            "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "city": spot["city"],
            "locality": spot["locality"],
            "hotspot_name": spot["name"],
            "severity": sev,
            "collision_type": ctype,
            "weather": weather,
            "road_condition": road_cond,
            "vehicles_involved": vehicles,
            "casualties": casualties
        })
        rec_id += 1

# Add some scattered random records
for _ in range(40):
    dt = start_date + timedelta(days=random.randint(0, 365), hours=random.randint(0, 23))
    lat = 12.9000 + random.random() * 0.18
    lon = 77.5200 + random.random() * 0.22
    acc_records.append({
        "accident_id": f"ACC-{rec_id:05d}",
        "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "city": "Bengaluru",
        "locality": "Urban Roadway",
        "hotspot_name": "Isolated Incident",
        "severity": random.randint(1, 3),
        "collision_type": random.choice(["rear-end", "side-swipe", "two-wheeler skid"]),
        "weather": random.choice(["clear", "rain"]),
        "road_condition": "dry",
        "vehicles_involved": random.randint(1, 2),
        "casualties": 0
    })
    rec_id += 1

acc_df = pd.DataFrame(acc_records)
acc_path = DATA / "accidents" / "accidents.csv"
acc_df.to_csv(acc_path, index=False)
print(f"Generated {len(acc_df)} accident records at {acc_path}")

# -------------------------------------------------------------
# 2. Hourly Traffic Counts (counts.csv)
# -------------------------------------------------------------
# Generate 90 days of hourly traffic count data (2160 timestamps)
ts_start = datetime(2025, 9, 1, 0, 0, 0)
count_rows = []

for h in range(2160):
    cur_time = ts_start + timedelta(hours=h)
    hour = cur_time.hour
    dow = cur_time.weekday()  # 0=Monday, 6=Sunday
    is_weekend = dow >= 5
    
    # Base diurnal traffic pattern
    if 0 <= hour < 5:
        base = 25 + hour * 5
    elif 5 <= hour < 8:
        base = 60 + (hour - 5) * 60
    elif 8 <= hour <= 11:
        base = 240 + 40 * math.sin((hour - 8) / 3 * math.pi)  # Morning Peak ~280
    elif 12 <= hour < 16:
        base = 170 + 20 * math.sin((hour - 12) / 4 * math.pi) # Midday lull ~170-190
    elif 16 <= hour <= 20:
        base = 270 + 50 * math.sin((hour - 16) / 4 * math.pi) # Evening Peak ~320
    elif 21 <= hour <= 23:
        base = 190 - (hour - 21) * 65
    else:
        base = 50

    if is_weekend:
        base = base * 0.72 + 20  # Weekend shift

    # Weather/random noise
    noise = np.random.normal(0, 14)
    count = max(5, int(round(base + noise)))
    count_rows.append({"timestamp": cur_time.strftime("%Y-%m-%d %H:%M:%S"), "count": count})

count_df = pd.DataFrame(count_rows)
count_path = DATA / "traffic_counts" / "counts.csv"
count_df.to_csv(count_path, index=False)
print(f"Generated {len(count_df)} traffic count rows at {count_path}")

# -------------------------------------------------------------
# 3. Bengaluru Road Network Segments (GeoJSON)
# -------------------------------------------------------------
# Major corridors with GIS geometry, risk ratings, accident frequency, capacity
segments = [
    {
        "segment_id": "BLR-SEG-01",
        "road_name": "Outer Ring Road (Silk Board to Bellandur)",
        "road_type": "Expressway / Arterial",
        "lanes": 6,
        "speed_limit_kmh": 60,
        "historical_accidents_yr": 74,
        "mean_daily_volume": 115000,
        "risk_level": "critical",
        "risk_score": 0.88,
        "coordinates": [
            [77.6238, 12.9176],
            [77.6412, 12.9234],
            [77.6621, 12.9288],
            [77.6784, 12.9341]
        ]
    },
    {
        "segment_id": "BLR-SEG-02",
        "road_name": "Outer Ring Road (Bellandur to Marathahalli)",
        "road_type": "Expressway / Arterial",
        "lanes": 6,
        "speed_limit_kmh": 60,
        "historical_accidents_yr": 58,
        "mean_daily_volume": 108000,
        "risk_level": "high",
        "risk_score": 0.76,
        "coordinates": [
            [77.6784, 12.9341],
            [77.6912, 12.9421],
            [77.7011, 12.9554]
        ]
    },
    {
        "segment_id": "BLR-SEG-03",
        "road_name": "Old Madras Road (Indiranagar to KR Puram)",
        "road_type": "Primary Arterial",
        "lanes": 4,
        "speed_limit_kmh": 50,
        "historical_accidents_yr": 62,
        "mean_daily_volume": 89000,
        "risk_level": "critical",
        "risk_score": 0.85,
        "coordinates": [
            [77.6387, 12.9784],
            [77.6534, 12.9882],
            [77.6744, 12.9986]
        ]
    },
    {
        "segment_id": "BLR-SEG-04",
        "road_name": "Bellary Road (Hebbal to Yelahanka Bypass)",
        "road_type": "National Highway / Airport Corridor",
        "lanes": 6,
        "speed_limit_kmh": 80,
        "historical_accidents_yr": 54,
        "mean_daily_volume": 94000,
        "risk_level": "high",
        "risk_score": 0.72,
        "coordinates": [
            [77.5970, 13.0358],
            [77.5954, 13.0612],
            [77.5968, 13.0921]
        ]
    },
    {
        "segment_id": "BLR-SEG-05",
        "road_name": "Hosur Road (Madiwala to Electronic City Elevated Toll)",
        "road_type": "National Highway",
        "lanes": 6,
        "speed_limit_kmh": 70,
        "historical_accidents_yr": 49,
        "mean_daily_volume": 120000,
        "risk_level": "high",
        "risk_score": 0.74,
        "coordinates": [
            [77.6189, 12.9211],
            [77.6352, 12.8941],
            [77.6602, 12.8452]
        ]
    },
    {
        "segment_id": "BLR-SEG-06",
        "road_name": "Tumkur Road (Goraguntepalya to Peenya Industrial Area)",
        "road_type": "National Highway",
        "lanes": 6,
        "speed_limit_kmh": 60,
        "historical_accidents_yr": 46,
        "mean_daily_volume": 82000,
        "risk_level": "high",
        "risk_score": 0.71,
        "coordinates": [
            [77.5408, 13.0285],
            [77.5254, 13.0331],
            [77.5082, 13.0365]
        ]
    },
    {
        "segment_id": "BLR-SEG-07",
        "road_name": "Bannerghatta Road (Dairy Circle to Jayadeva)",
        "road_type": "Secondary Arterial",
        "lanes": 4,
        "speed_limit_kmh": 40,
        "historical_accidents_yr": 32,
        "mean_daily_volume": 68000,
        "risk_level": "moderate",
        "risk_score": 0.52,
        "coordinates": [
            [77.5997, 12.9344],
            [77.5982, 12.9214],
            [77.5965, 12.9112]
        ]
    },
    {
        "segment_id": "BLR-SEG-08",
        "road_name": "MG Road & Cubbon Park Perimeter",
        "road_type": "Urban CBD",
        "lanes": 4,
        "speed_limit_kmh": 40,
        "historical_accidents_yr": 14,
        "mean_daily_volume": 55000,
        "risk_level": "low",
        "risk_score": 0.28,
        "coordinates": [
            [77.5912, 12.9734],
            [77.6041, 12.9752],
            [77.6185, 12.9748]
        ]
    }
]

geojson_features = []
for s in segments:
    feat = {
        "type": "Feature",
        "properties": {
            "segment_id": s["segment_id"],
            "road_name": s["road_name"],
            "road_type": s["road_type"],
            "lanes": s["lanes"],
            "speed_limit_kmh": s["speed_limit_kmh"],
            "historical_accidents_yr": s["historical_accidents_yr"],
            "mean_daily_volume": s["mean_daily_volume"],
            "risk_level": s["risk_level"],
            "risk_score": s["risk_score"]
        },
        "geometry": {
            "type": "LineString",
            "coordinates": s["coordinates"]
        }
    }
    geojson_features.append(feat)

geojson = {
    "type": "FeatureCollection",
    "name": "bengaluru_road_risk_segments",
    "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
    "features": geojson_features
}

geo_path = DATA / "road_segments" / "bengaluru_segments.geojson"
geo_path.write_text(json.dumps(geojson, indent=2))
print(f"Generated {len(geojson_features)} road segment features at {geo_path}")
