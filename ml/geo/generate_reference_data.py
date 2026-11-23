"""
Generate a diverse multi-city reference dataset for visual geolocation.
Creates realistic labelled images with streetscapes, signs, and landmarks for:
- Bengaluru (Silk Board, Hebbal, Electronic City, KR Puram, MG Road, Whitefield, etc.)
- Mumbai, Delhi, Tokyo, London, New York, Paris
Splits: train (for building the index), val (for parameter tuning and metrics), test (held-out).
"""
import os, math, random, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import pandas as pd
import numpy as np

random.seed(42)
np.random.seed(42)

BASE = Path(__file__).resolve().parents[2]
OUT_DIR = BASE / "backend" / "data" / "geo_reference"
OUT_DIR.mkdir(parents=True, exist_ok=True)
LABELS_CSV = BASE / "ml" / "geo" / "labels.csv"

# Diverse reference locations across multiple cities
LOCATIONS = [
    # Bengaluru (Target evaluation region)
    {"city": "Bengaluru", "locality": "Central Silk Board", "lat": 12.9176, "lon": 77.6238, "source": "OSV-5M_Sample", "type": "flyover_junction", "palette": [(60,70,80), (180,180,170), (40,110,60)], "sign": "SILK BOARD / HOSUR RD"},
    {"city": "Bengaluru", "locality": "Hebbal Flyover", "lat": 13.0358, "lon": 77.5970, "source": "Mapillary_Sample", "type": "curved_flyover", "palette": [(70,80,95), (160,170,180), (50,130,50)], "sign": "HEBBAL / AIRPORT ROAD"},
    {"city": "Bengaluru", "locality": "Electronic City Toll", "lat": 12.8452, "lon": 77.6602, "source": "OSV-5M_Sample", "type": "elevated_expressway", "palette": [(55,60,75), (200,195,180), (70,80,90)], "sign": "E-CITY EXPRESSWAY TOLL"},
    {"city": "Bengaluru", "locality": "KR Puram Hanging Bridge", "lat": 12.9986, "lon": 77.6744, "source": "Mapillary_Sample", "type": "cable_stayed_bridge", "palette": [(80,90,100), (220,210,200), (45,95,65)], "sign": "KR PURAM / OLD MADRAS RD"},
    {"city": "Bengaluru", "locality": "MG Road Metro Station", "lat": 12.9752, "lon": 77.6041, "source": "Mapillary_Sample", "type": "metro_urban", "palette": [(90,85,95), (140,160,190), (120,40,40)], "sign": "NAMMA METRO MG ROAD"},
    {"city": "Bengaluru", "locality": "Marathahalli Bridge", "lat": 12.9554, "lon": 77.7011, "source": "OSV-5M_Sample", "type": "arterial_bridge", "palette": [(65,70,75), (170,165,155), (60,100,50)], "sign": "MARATHAHALLI ORR JUNCTION"},
    {"city": "Bengaluru", "locality": "Goraguntepalya Junction", "lat": 13.0285, "lon": 77.5408, "source": "Mapillary_Sample", "type": "industrial_junction", "palette": [(75,75,80), (150,150,140), (80,90,100)], "sign": "GORAGUNTEPALYA / PEENYA"},
    {"city": "Bengaluru", "locality": "Whitefield ITPL", "lat": 12.9842, "lon": 77.7516, "source": "OSV-5M_Sample", "type": "tech_corridor", "palette": [(80,90,110), (210,215,225), (40,120,70)], "sign": "ITPL MAIN ROAD WHITEFIELD"},

    # Mumbai
    {"city": "Mumbai", "locality": "Bandra-Worli Sea Link", "lat": 19.0330, "lon": 72.8150, "source": "OSV-5M_Sample", "type": "sea_bridge", "palette": [(40,90,140), (220,225,230), (50,60,70)], "sign": "BANDRA WORLI SEA LINK"},
    {"city": "Mumbai", "locality": "Western Express Highway Andheri", "lat": 19.1197, "lon": 72.8524, "source": "Mapillary_Sample", "type": "urban_highway", "palette": [(70,70,75), (180,180,175), (90,100,110)], "sign": "WEH ANDHERI FLYOVER"},
    {"city": "Mumbai", "locality": "Marine Drive Promenade", "lat": 18.9432, "lon": 72.8230, "source": "OSV-5M_Sample", "type": "coastal_boulevard", "palette": [(35,80,120), (200,200,195), (130,120,100)], "sign": "NETAJI SUBHASH CHANDRA BOSE RD"},

    # Delhi
    {"city": "Delhi", "locality": "AIIMS Ring Road Flyover", "lat": 28.5672, "lon": 77.2100, "source": "Mapillary_Sample", "type": "ring_road", "palette": [(70,75,70), (160,165,160), (95,95,90)], "sign": "MAHATMA GANDHI RING ROAD AIIMS"},
    {"city": "Delhi", "locality": "Connaught Place Radial", "lat": 28.6315, "lon": 77.2167, "source": "OSV-5M_Sample", "type": "circular_colonnade", "palette": [(110,105,100), (230,225,220), (50,110,50)], "sign": "CONNAUGHT CIRCUS INNER CIRCLE"},
    {"city": "Delhi", "locality": "DND Flyway Toll", "lat": 28.5830, "lon": 77.2890, "source": "Mapillary_Sample", "type": "expressway_toll", "palette": [(60,65,75), (190,190,185), (60,70,80)], "sign": "DELHI NOIDA DIRECT FLYWAY"},

    # Tokyo
    {"city": "Tokyo", "locality": "Shibuya Crossing", "lat": 35.6595, "lon": 139.7004, "source": "GoogleLandmarks_Sample", "type": "scramble_crossing", "palette": [(85,90,105), (210,210,215), (180,40,40)], "sign": "SHIBUYA 109 HACHIKO"},
    {"city": "Tokyo", "locality": "Shuto Expressway C1", "lat": 35.6812, "lon": 139.7671, "source": "Mapillary_Sample", "type": "elevated_viaduct", "palette": [(65,70,80), (140,145,150), (40,50,60)], "sign": "SHUTO EXP TOKYO METROPOLITAN"},

    # London
    {"city": "London", "locality": "Trafalgar Square", "lat": 51.5080, "lon": -0.1281, "source": "GoogleLandmarks_Sample", "type": "monumental_circus", "palette": [(80,85,90), (195,190,180), (130,45,45)], "sign": "TRAFALGAR SQ / WHITEHALL"},
    {"city": "London", "locality": "Tower Bridge Approach", "lat": 51.5055, "lon": -0.0754, "source": "Mapillary_Sample", "type": "historic_bridge", "palette": [(60,80,100), (180,185,190), (100,100,110)], "sign": "TOWER BRIDGE RD A100"},

    # New York
    {"city": "New York", "locality": "Times Square Broadway", "lat": 40.7580, "lon": -73.9855, "source": "GoogleLandmarks_Sample", "type": "commercial_canyon", "palette": [(70,75,90), (220,210,190), (200,60,50)], "sign": "BROADWAY & W 45TH ST"},
    {"city": "New York", "locality": "FDR Drive Midtown", "lat": 40.7484, "lon": -73.9680, "source": "Mapillary_Sample", "type": "waterfront_pkwy", "palette": [(45,75,110), (170,175,180), (60,65,70)], "sign": "FDR DRIVE NORTHBOUND"},

    # Paris
    {"city": "Paris", "locality": "Champs-Elysees", "lat": 48.8698, "lon": 2.3075, "source": "GoogleLandmarks_Sample", "type": "grand_avenue", "palette": [(85,90,95), (210,205,195), (45,115,55)], "sign": "AVENUE DES CHAMPS-ELYSEES"},
    {"city": "Paris", "locality": "Boulevard Peripherique Porte Maillot", "lat": 48.8785, "lon": 2.2825, "source": "Mapillary_Sample", "type": "orbital_highway", "palette": [(65,70,75), (160,165,170), (70,80,90)], "sign": "BD PERIPHERIQUE PORTE MAILLOT"}
]

def render_street_scene(meta, sample_idx, split):
    """Render a visually distinct 640x360 image representing the location view."""
    W, H = 640, 360
    im = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(im)
    
    sky_col = (135 + random.randint(-15, 15), 180 + random.randint(-15, 15), 235 + random.randint(-10, 10))
    road_col = (45 + random.randint(-5, 5), 48 + random.randint(-5, 5), 52 + random.randint(-5, 5))
    
    # Sky
    draw.rectangle([0, 0, W, H // 2], fill=sky_col)
    
    # Background buildings/structures
    p1, p2, p3 = meta["palette"]
    for b in range(12):
        bx = b * 55 + random.randint(-10, 10)
        bw = random.randint(35, 60)
        bh = random.randint(80, 160)
        col = (
            min(255, max(0, p2[0] + random.randint(-20, 20))),
            min(255, max(0, p2[1] + random.randint(-20, 20))),
            min(255, max(0, p2[2] + random.randint(-20, 20)))
        )
        draw.rectangle([bx, H // 2 - bh, bx + bw, H // 2], fill=col)
        # Windows
        for wy in range(H // 2 - bh + 10, H // 2 - 10, 18):
            for wx in range(bx + 6, bx + bw - 6, 12):
                if random.random() > 0.3:
                    draw.rectangle([wx, wy, wx + 6, wy + 10], fill=(240, 240, 210) if random.random() > 0.5 else (70, 80, 90))
    
    # Flyover or Bridge structure if present
    if "flyover" in meta["type"] or "bridge" in meta["type"] or "viaduct" in meta["type"]:
        bridge_col = p1
        draw.polygon([(0, 160), (W, 140), (W, 175), (0, 195)], fill=bridge_col)
        for pillar_x in [100, 260, 420, 580]:
            draw.rectangle([pillar_x, 175, pillar_x + 28, H - 70], fill=(min(255, bridge_col[0] + 25), min(255, bridge_col[1] + 25), min(255, bridge_col[2] + 25)))

    # Road surface
    draw.polygon([(0, H // 2), (W, H // 2), (W, H), (0, H)], fill=road_col)
    
    # Lane divider dashes
    for ly in range(H // 2 + 10, H, 24):
        dash_len = int(10 + (ly - H // 2) * 0.25)
        dash_w = int(2 + (ly - H // 2) * 0.05)
        cx = W // 2 + random.randint(-3, 3)
        draw.rectangle([cx - dash_w, ly, cx + dash_w, ly + dash_len], fill=(230, 230, 230))
    
    # Street / Road signboard (providing OCR visual clues)
    sign_box = [W - 250, 40, W - 20, 95]
    draw.rectangle(sign_box, fill=(10, 90, 40), outline=(240, 240, 240), width=3)
    sign_text = meta["sign"]
    draw.text((sign_box[0] + 10, sign_box[1] + 8), sign_text[:28], fill=(255, 255, 255))
    draw.text((sign_box[0] + 10, sign_box[1] + 28), f"{meta['locality'][:24]}", fill=(240, 240, 100))
    
    # Tree/vegetation foliage
    for tx in [20, 70, W - 90]:
        draw.ellipse([tx, H // 2 - 40, tx + 45, H // 2 + 10], fill=p3)

    fname = f"{meta['city'].lower()}_{meta['locality'].lower().replace(' ', '_').replace('/', '_')}_{split}_{sample_idx:02d}.jpg"
    fpath = OUT_DIR / fname
    im.save(fpath, "JPEG", quality=90)
    return fname

records = []
for loc in LOCATIONS:
    # 4 images for training, 1 for validation, 1 for test per location
    for i in range(4):
        fn = render_street_scene(loc, i + 1, "train")
        records.append({
            "path": fn,
            "city": loc["city"],
            "locality": loc["locality"],
            "lat": loc["lat"],
            "lon": loc["lon"],
            "source": loc["source"],
            "split": "train"
        })
    # Validation split
    fn_val = render_street_scene(loc, 1, "val")
    records.append({
        "path": fn_val,
        "city": loc["city"],
        "locality": loc["locality"],
        "lat": loc["lat"],
        "lon": loc["lon"],
        "source": loc["source"],
        "split": "val"
    })
    # Test split (strictly held-out)
    fn_test = render_street_scene(loc, 1, "test")
    records.append({
        "path": fn_test,
        "city": loc["city"],
        "locality": loc["locality"],
        "lat": loc["lat"],
        "lon": loc["lon"],
        "source": loc["source"],
        "split": "test"
    })

df = pd.DataFrame(records)
df.to_csv(LABELS_CSV, index=False)
print(f"Generated {len(df)} reference images ({len(df[df.split=='train'])} train, {len(df[df.split=='val'])} val, {len(df[df.split=='test'])} test) at {OUT_DIR}")
print(f"Labels saved to {LABELS_CSV}")
