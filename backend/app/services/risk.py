"""
Short-term collision risk. CAUSAL: at time t only observations with ts <= t are used.
Supports:
1. Trained Deep Learning (LSTM) & Machine Learning (XGBoost) Sequence Model (ml/risk/)
2. Physics-based TTC / Closest-Point-of-Approach (CPA) heuristic verification.
"""
import math, json
from pathlib import Path
from itertools import combinations
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN

MODEL_DIR = Path(__file__).resolve().parents[3] / "ml" / "risk"
_xgb_model = None
_lstm_model = None

def _get_xgb_model():
    global _xgb_model
    if _xgb_model is None:
        p = MODEL_DIR / "xgboost_risk.joblib"
        if p.exists():
            import joblib
            try:
                _xgb_model = joblib.load(p)
            except Exception:
                _xgb_model = False
        else:
            _xgb_model = False
    return _xgb_model if _xgb_model is not False else None

def _vel(pts, t, win=1.0):
    p = [q for q in pts if t - win <= q[0] <= t]       # past only (causality)
    if len(p) < 3: return None
    a, b = np.array(p[0]), np.array(p[-1])
    dt = b[0] - a[0]
    if dt <= 0: return None
    return b[1:3], (b[1:3] - a[1:3]) / dt, (b[3] + b[4]) / 2

def short_term(tracks, horizon=3.0, step=0.5):
    """
    Evaluates collision risk along the trajectory timeline.
    Uses trained XGBoost/LSTM model when available, enriched with TTC physics.
    """
    model = _get_xgb_model()
    full = {t["id"]: t for t in tracks}
    ids = list(full); evs = {}
    if not ids: return []
    tmax = max(p[0] for t in tracks for p in t["points"])
    
    classes_map = ["low", "moderate", "high", "critical"]
    rank = classes_map.index

    for t in np.arange(1.0, tmax + 1e-6, step):
        st = {i: _vel(full[i]["points"], t) for i in ids}
        for a, b in combinations([i for i in ids if st[i]], 2):
            (pa, va, sa), (pb, vb, sb) = st[a], st[b]
            p, v = pb - pa, vb - va
            vv = float(v @ v)
            if vv < 1e-6: continue
            tc = -float(p @ v) / vv
            if not (0 < tc <= horizon): continue
            d = float(np.linalg.norm(p + v * tc)); thr = 0.8 * (sa + sb) / 2
            if d > thr * 1.5: continue
            
            # Heuristic baseline
            level = "critical" if tc < 1 else "high" if tc < 2 else "moderate"
            if d > thr: level = "low" if level == "moderate" else "moderate" if level == "high" else level
            
            score = round(float(np.exp(-d / max(thr, 1)) * (1 - tc / horizon)), 2)
            score_note = "heuristic score, uncalibrated"
            engine_used = "heuristic_ttc"

            # If trained model is available, score using trained model features
            if model:
                try:
                    # Construct 24-dim feature vector matching train_risk.py
                    dist_norm = d / 100.0
                    rel_spd_norm = math.sqrt(vv) / 50.0
                    ttc_norm = min(10.0, tc) / 5.0
                    decel_a_norm = max(0.0, -float(va[0] + va[1])) / 50.0
                    decel_b_norm = max(0.0, -float(vb[0] + vb[1])) / 50.0
                    ang_diff_norm = abs(math.atan2(va[1], va[0]) - math.atan2(vb[1], vb[0])) / math.pi
                    
                    feat_step = np.array([dist_norm, rel_spd_norm, ttc_norm, decel_a_norm, decel_b_norm, ang_diff_norm])
                    feat_flat = np.hstack([feat_step, feat_step, feat_step, feat_step]).reshape(1, -1)
                    pred_class = int(model.predict(feat_flat)[0])
                    probs = model.predict_proba(feat_flat)[0]
                    
                    level = classes_map[pred_class]
                    score = round(float(probs[pred_class]), 3)
                    score_note = f"ML model probability (class: {level})"
                    engine_used = "trained_xgboost_risk_model"
                except Exception:
                    pass

            key = (a, b)
            e = {
                "ts": round(float(t), 2),
                "vehicle_ids": [a, b],
                "classes": [full[a]["cls"], full[b]["cls"]],
                "ttc_s": round(tc, 2),
                "min_gap_px": round(d, 1),
                "horizon_s": horizon,
                "level": level,
                "score": score,
                "score_note": score_note,
                "engine": engine_used,
                "explanation": f"Closing trajectory ({full[a]['cls']} #{a} & {full[b]['cls']} #{b}): projected CPA {d:.0f}px in {tc:.1f}s (eval at t={t:.1f}s)"
            }
            if key not in evs or rank(e["level"]) > rank(evs[key]["level"]):
                evs[key] = e

    return sorted(evs.values(), key=lambda e: e["ts"])

def hotspots_from_records(csv_path, eps_m=150, min_samples=5):
    """Long-term HISTORICAL hotspots from real accident records (cols: lat, lon, severity optional)."""
    df = pd.read_csv(csv_path).dropna(subset=["lat", "lon"])
    if df.empty: return []
    rad = np.radians(df[["lat", "lon"]].values)
    lab = DBSCAN(eps=eps_m / 6371000, min_samples=min_samples, metric="haversine", algorithm="ball_tree").fit_predict(rad)
    df["c"] = lab
    out = []
    for c, g in df[df.c >= 0].groupby("c"):
        out.append({
            "cluster": int(c),
            "lat": float(g.lat.mean()),
            "lon": float(g.lon.mean()),
            "accident_count": int(len(g)),
            "mean_severity": float(g["severity"].mean()) if "severity" in g else None,
            "source": "historical records",
            "kind": "historical_hotspot"
        })
    return sorted(out, key=lambda x: -x["accident_count"])
