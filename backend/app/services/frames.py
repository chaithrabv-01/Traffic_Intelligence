"""Frame extraction with timestamps and sharpness-based selection."""
import cv2
from pathlib import Path

def extract_frames(video_path, out_dir, every_sec=2.0, max_frames=40):
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError("Cannot open video")
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    step = max(int(fps * every_sec), 1)
    cands, idx = [], 0
    while True:
        ok, frame = cap.read()
        if not ok: break
        if idx % step == 0:
            sharp = cv2.Laplacian(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
            cands.append((idx / fps, sharp, frame))
        idx += 1
    cap.release()
    # keep sharpest frames, then restore chronological order
    cands = sorted(sorted(cands, key=lambda c: -c[1])[:max_frames], key=lambda c: c[0])
    res = []
    for t, s, f in cands:
        p = out / f"f_{t:08.2f}.jpg"
        cv2.imwrite(str(p), f)
        res.append({"ts": round(t, 2), "path": str(p), "sharpness": round(float(s), 1)})
    return res
