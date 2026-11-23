"""Congestion forecasting from real count history (CSV: timestamp, count). Chronological split only."""
import json, numpy as np, pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor
from ..config import DATA

def _feat(df):
    d = pd.DataFrame({"hour": df.timestamp.dt.hour, "dow": df.timestamp.dt.dayofweek})
    for l in (1, 2, 3, 24): d[f"lag{l}"] = df["count"].shift(l)
    return d

def train(csv=DATA / "traffic_counts" / "counts.csv", test_frac=0.2):
    df = pd.read_csv(csv, parse_dates=["timestamp"]).sort_values("timestamp").reset_index(drop=True)
    X, y = _feat(df), df["count"]; ok = X.notna().all(axis=1); X, y = X[ok], y[ok]
    cut = int(len(X) * (1 - test_frac))                        # time-ordered split: no leakage
    Xtr, Xte, ytr, yte = X[:cut], X[cut:], y[:cut], y[cut:]
    res = {}
    models = {"xgboost": XGBRegressor(n_estimators=300, max_depth=4, learning_rate=0.05),
              "random_forest": RandomForestRegressor(n_estimators=200, random_state=0)}
    for n, m in models.items():
        m.fit(Xtr, ytr); p = m.predict(Xte)
        res[n] = {"MAE": float(mean_absolute_error(yte, p)), "RMSE": float(np.sqrt(mean_squared_error(yte, p)))}
    try:
        from statsmodels.tsa.arima.model import ARIMA
        p = ARIMA(df["count"][:cut], order=(2, 1, 2)).fit().forecast(len(df) - cut)
        res["arima_baseline"] = {"MAE": float(mean_absolute_error(df["count"][cut:], p)),
                                 "RMSE": float(np.sqrt(mean_squared_error(df["count"][cut:], p)))}
    except Exception as e: res["arima_baseline"] = {"error": str(e)}
    res["n_train"], res["n_test"] = int(len(Xtr)), int(len(Xte))
    (DATA / "metrics" / "forecast.json").write_text(json.dumps(res, indent=2))
    return res
