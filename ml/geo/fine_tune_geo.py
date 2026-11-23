"""
Fine-tuning module for visual geolocation.
Implements contrastive metric learning (Triplet Margin Loss) on location-labelled images
to learn discriminative spatial embeddings separating distinct cities, junctions and corridors.
Saves fine-tuned projection weights to ml/geo/geo_projector.pt and metrics to ml/geo/fine_tune_metrics.json.
"""
import os, json, random
from pathlib import Path
import numpy as np
import pandas as pd
from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.transforms as T
import torchvision.models as models

class TripletGeoDataset(torch.utils.data.Dataset):
    def __init__(self, df, root, transform):
        self.df = df.reset_index(drop=True)
        self.root = Path(root)
        self.transform = transform
        self.loc_to_indices = {}
        for idx, row in self.df.iterrows():
            key = f"{row['city']}_{row['locality']}"
            self.loc_to_indices.setdefault(key, []).append(idx)
        self.all_keys = list(self.loc_to_indices.keys())

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        anchor_row = self.df.iloc[idx]
        anchor_key = f"{anchor_row['city']}_{anchor_row['locality']}"
        
        # Positive: same locality, different index
        pos_candidates = self.loc_to_indices[anchor_key]
        pos_idx = random.choice([i for i in pos_candidates if i != idx] or pos_candidates)
        pos_row = self.df.iloc[pos_idx]

        # Negative: different locality / city
        neg_key = random.choice([k for k in self.all_keys if k != anchor_key])
        neg_idx = random.choice(self.loc_to_indices[neg_key])
        neg_row = self.df.iloc[neg_idx]

        a_img = self.transform(Image.open(self.root / anchor_row["path"]).convert("RGB"))
        p_img = self.transform(Image.open(self.root / pos_row["path"]).convert("RGB"))
        n_img = self.transform(Image.open(self.root / neg_row["path"]).convert("RGB"))

        return a_img, p_img, n_img

class GeoProjectionModel(nn.Module):
    def __init__(self, emb_dim=512, proj_dim=256):
        super().__init__()
        base = models.mobilenet_v3_small(weights=None)
        self.backbone = base.features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        in_dim = base.classifier[0].in_features
        self.projector = nn.Sequential(
            nn.Linear(in_dim, emb_dim),
            nn.BatchNorm1d(emb_dim),
            nn.ReLU(inplace=True),
            nn.Linear(emb_dim, proj_dim)
        )

    def forward(self, x):
        feat = self.backbone(x)
        feat = self.pool(feat).flatten(1)
        proj = self.projector(feat)
        return proj / torch.norm(proj, p=2, dim=1, keepdim=True).clamp(min=1e-8)

def train_fine_tuning(epochs=5, batch_size=8, lr=1e-3):
    base_dir = Path(__file__).resolve().parent
    data_root = base_dir.parents[1] / "backend" / "data" / "geo_reference"
    labels_csv = base_dir / "labels.csv"

    if not labels_csv.exists():
        print(f"Error: {labels_csv} not found.")
        return

    df = pd.read_csv(labels_csv)
    train_df = df[df.split == "train"]
    val_df = df[df.split == "val"]

    transform = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_ds = TripletGeoDataset(train_df, data_root, transform)
    train_loader = torch.utils.data.DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=True)

    model = GeoProjectionModel()
    criterion = nn.TripletMarginLoss(margin=0.3, p=2)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    print(f"Fine-tuning Geolocation Metric Model on {len(train_ds)} triplets over {epochs} epochs...")
    model.train()
    loss_history = []
    for ep in range(epochs):
        ep_loss = 0.0
        for a, p, n in train_loader:
            optimizer.zero_grad()
            ea = model(a)
            ep_feat = model(p)
            en = model(n)
            loss = criterion(ea, ep_feat, en)
            loss.backward()
            optimizer.step()
            ep_loss += loss.item()
        avg_loss = ep_loss / max(len(train_loader), 1)
        loss_history.append(round(avg_loss, 4))
        print(f"Epoch [{ep+1}/{epochs}] - Triplet Loss: {avg_loss:.4f}")

    model_path = base_dir / "geo_projector.pt"
    torch.save(model.state_dict(), model_path)
    print(f"Fine-tuned model saved to {model_path}")

    # Evaluate validation triplet accuracy
    model.eval()
    val_ds = TripletGeoDataset(val_df, data_root, transform)
    val_loader = torch.utils.data.DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    correct, total = 0, 0
    with torch.no_grad():
        for a, p, n in val_loader:
            ea = model(a)
            ep_feat = model(p)
            en = model(n)
            dp = torch.norm(ea - ep_feat, p=2, dim=1)
            dn = torch.norm(ea - en, p=2, dim=1)
            correct += int((dp < dn).sum().item())
            total += len(a)

    val_acc = round(correct / max(total, 1), 4)
    metrics = {
        "epochs": epochs,
        "final_train_loss": loss_history[-1],
        "validation_triplet_accuracy": val_acc,
        "loss_history": loss_history,
        "objective": "TripletMarginLoss (margin=0.3)",
        "output_embedding_dim": 256
    }
    (base_dir / "fine_tune_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"Validation Triplet Accuracy: {val_acc * 100:.2f}%")
    return metrics

if __name__ == "__main__":
    train_fine_tuning()
