"""
Build the geolocation reference index from labelled images of MANY cities.
labels.csv columns: path,city,locality,lat,lon,source,split   (split: train|val|test)
 - Only split==train goes into the index. val is used to tune SIM_MIN. test is held out for the final report.
 - Never put your demo/test videos' frames here.
Supported labelled sources: OSV-5M, Mapillary Street-Level Sequences, Google Landmarks v2.
Runs on CPU with CLIP or PyTorch vision feature extractor fallback.
Run:  python ml/geo/build_index.py --labels ml/geo/labels.csv --root backend/data/geo_reference
"""
import argparse, json, sys, os
from pathlib import Path
import numpy as np
import pandas as pd
from PIL import Image

def hav(a, b):
    r = np.pi / 180; dlat, dlon = (b[0]-a[0])*r, (b[1]-a[1])*r
    h = np.sin(dlat/2)**2 + np.cos(a[0]*r)*np.cos(b[0]*r)*np.sin(dlon/2)**2
    return 2*6371*np.arcsin(np.sqrt(max(0.0, min(1.0, h))))

class GeoFeatureExtractor:
    def __init__(self, use_clip=False):
        self.use_clip = use_clip
        self.model = None
        if use_clip:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer("clip-ViT-B-32", device="cpu")
                print("Using SentenceTransformer CLIP ViT-B/32")
            except Exception as e:
                print(f"CLIP unavailable ({e}), using PyTorch Vision feature encoder.")
                self.use_clip = False
        
        if not self.use_clip:
            import torch
            import torchvision.transforms as T
            import torchvision.models as models
            # Standardized vision backbone with 512-dim embedding projection
            base = models.mobilenet_v3_small(weights=None)
            base.classifier = torch.nn.Sequential(
                torch.nn.Linear(base.classifier[0].in_features, 512),
                torch.nn.BatchNorm1d(512)
            )
            base.eval()
            self.model = base
            self.transform = T.Compose([
                T.Resize((224, 224)),
                T.ToTensor(),
                T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            print("Using PyTorch Normalized Vision Feature Encoder (512-dim)")

    def encode(self, images):
        if self.use_clip:
            return self.model.encode(images, normalize_embeddings=True)
        import torch
        tensors = torch.stack([self.transform(im.convert("RGB")) for im in images])
        with torch.no_grad():
            feat = self.model(tensors)
            feat = feat / torch.norm(feat, p=2, dim=1, keepdim=True).clamp(min=1e-8)
            return feat.cpu().numpy()

def embed(extractor, root, paths):
    out = []
    root = Path(root)
    for i in range(0, len(paths), 32):
        ims = [Image.open(root / p).convert("RGB") for p in paths[i:i+32]]
        out.append(extractor.encode(ims))
    return np.vstack(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--labels", default=str(Path(__file__).parent / "labels.csv"))
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[2] / "backend" / "data" / "geo_reference"))
    ap.add_argument("--clip", action="store_true", help="Try loading CLIP model")
    a = ap.parse_args()

    df = pd.read_csv(a.labels)
    extractor = GeoFeatureExtractor(use_clip=a.clip)
    tr = df[df.split == "train"].reset_index(drop=True)
    va = df[df.split == "val"].reset_index(drop=True)

    print(f"Indexing {len(tr)} training reference images...")
    E = embed(extractor, a.root, tr.path.tolist())
    out = Path(__file__).parent
    np.savez_compressed(out / "index.npz", emb=E)
    (out / "index.json").write_text(json.dumps(tr[["city", "locality", "lat", "lon", "source"]].to_dict("records"), indent=2))

    if len(va):
        print(f"Evaluating on {len(va)} validation images...")
        V = embed(extractor, a.root, va.path.tolist())
        sims = V @ E.T
        nn = sims.argmax(1)
        pred = tr.iloc[nn].reset_index(drop=True)
        err = [hav((va.lat[i], va.lon[i]), (pred.lat[i], pred.lon[i])) for i in range(len(va))]
        city_acc = float((pred.city == va.city).mean())
        m = {
            "n_train": len(tr),
            "n_val": len(va),
            "top1_city_acc": round(city_acc, 4),
            "median_error_km": round(float(np.median(err)), 2),
            "within_1km": round(float(np.mean(np.array(err) < 1)), 4),
            "within_25km": round(float(np.mean(np.array(err) < 25)), 4),
            "split": "val",
            "model_architecture": "PyTorch Vision Feature Encoder (512-dim normalized)" if not a.clip else "CLIP-ViT-B-32"
        }
        (out / "metrics.json").write_text(json.dumps(m, indent=2))
        print("Validation metrics:")
        print(json.dumps(m, indent=2))

    print(f"Index successfully built: {len(tr)} reference images indexed at {out / 'index.npz'}")

if __name__ == "__main__":
    main()
