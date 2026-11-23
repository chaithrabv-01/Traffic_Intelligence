"""
Visual geolocation = (1) image-embedding retrieval against a labelled reference index
built from MANY cities (ml/geo/build_index.py), plus (2) OCR text -> Nominatim geocoding.
Nothing is hardcoded to Bengaluru. Output is *evidence*, never verified truth:
coordinates are only stored on a video after a human confirms them.
"""
import json, time, numpy as np, requests
from collections import defaultdict
from ..config import GEO_INDEX, NOMINATIM_UA

SIM_MIN = 0.45      # below this top similarity -> "Location Unknown" (tuned on validation set)
_model = None; _index = None; _transform = None

def _get_encoder():
    global _model, _transform
    if _model is not None:
        return _model, _transform
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("clip-ViT-B-32", device="cpu")
        _transform = "clip"
        return _model, _transform
    except Exception:
        pass
    import torch
    import torchvision.transforms as T
    import torchvision.models as models
    base = models.mobilenet_v3_small(weights=None)
    base.classifier = torch.nn.Sequential(
        torch.nn.Linear(base.classifier[0].in_features, 512),
        torch.nn.BatchNorm1d(512)
    )
    base.eval()
    _model = base
    _transform = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return _model, _transform

def _embed(paths):
    from PIL import Image
    model, transform = _get_encoder()
    if transform == "clip":
        e = model.encode([Image.open(p).convert("RGB") for p in paths], batch_size=16, normalize_embeddings=True)
        return np.asarray(e)
    import torch
    tensors = torch.stack([transform(Image.open(p).convert("RGB")) for p in paths])
    with torch.no_grad():
        feat = model(tensors)
        feat = feat / torch.norm(feat, p=2, dim=1, keepdim=True).clamp(min=1e-8)
        return feat.cpu().numpy()

def _load_index():
    global _index
    if _index is None and (GEO_INDEX.with_suffix(".npz")).exists():
        z = np.load(GEO_INDEX.with_suffix(".npz"))
        _index = {"emb": z["emb"], "meta": json.loads(GEO_INDEX.with_suffix(".json").read_text())}
    return _index

def retrieve(frames, k=10):
    idx = _load_index()
    if idx is None:
        return [], "No reference index found. Run ml/geo/build_index.py first."
    q = _embed([f["path"] for f in frames])
    sims = q @ idx["emb"].T                       # (frames, refs)
    agg = defaultdict(list)
    for row in sims:
        for j in np.argsort(-row)[:k]:
            m = idx["meta"][j]
            agg[(m["city"], m["locality"], m["lat"], m["lon"])].append(float(row[j]))
    cands = []
    for (city, loc, lat, lon), s in agg.items():
        cands.append({"city": city, "locality": loc, "lat": lat, "lon": lon,
                      "similarity": round(float(np.mean(sorted(s, reverse=True)[:5])), 3),
                      "support": len(s), "source": "image_retrieval",
                      "match_type": "visual similarity (approximate, not exact recognition)"})
    cands.sort(key=lambda c: -c["similarity"])
    return cands[:5], None

_last = 0.0
def geocode_ocr(texts, max_queries=6):
    global _last
    hits = []
    for t in texts[:max_queries]:
        wait = 1.1 - (time.time() - _last)          # Nominatim policy: <=1 req/s
        if wait > 0: time.sleep(wait)
        try:
            r = requests.get("https://nominatim.openstreetmap.org/search",
                params={"q": t["text"], "format": "json", "limit": 2, "addressdetails": 1},
                headers={"User-Agent": NOMINATIM_UA}, timeout=10)
            _last = time.time()
            for h in r.json():
                hits.append({"query": t["text"], "name": h["display_name"],
                             "lat": float(h["lat"]), "lon": float(h["lon"]),
                             "source": "OpenStreetMap Nominatim",
                             "note": "text match only; OCR text may be a common word"})
        except Exception:
            continue
    return hits

def identify(frames, ocr_texts):
    cands, err = retrieve(frames)
    geo_hits = geocode_ocr(ocr_texts)
    top = cands[0] if cands else None
    if top and top["similarity"] >= SIM_MIN:
        status, label = "candidates", f'{top["locality"]}, {top["city"]}'
    else:
        status, label = "unknown", None   # honest fallback; do NOT invent a marker
    return {"status": status, "best_label": label, "candidates": cands,
            "ocr_geocode_hits": geo_hits, "ocr_text": ocr_texts,
            "warnings": ([err] if err else []) + (["Top similarity below threshold; location unknown."] if status == "unknown" and cands else []),
            "requires_confirmation": True}
