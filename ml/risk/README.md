Collision-risk model training (optional upgrade from the heuristic):
1. Use labelled near-miss/collision clips (e.g. public dashcam/CCTV accident datasets such as DoTA / CADP — check licences).
2. Track vehicles with backend/app/services/detection.py, build per-pair CAUSAL feature windows (rel. speed, TTC, gap, decel).
3. Split BY VIDEO (not by window) into train/val/test to avoid leakage.
4. Train XGBoost, report precision/recall/F1, false-positive rate and lead time on the test split into backend/data/metrics/risk.json.
Until that file exists the platform labels risk as "heuristic (unvalidated)".
