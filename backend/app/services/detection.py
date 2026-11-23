"""
YOLO + ByteTrack (via ultralytics) on CPU.
Performs vehicle detection, tracking, unique-ID counting, trajectory extraction,
and generates a playable annotated video with bounding boxes, vehicle classes, IDs and telemetry.
"""
import cv2
from pathlib import Path
from collections import Counter, defaultdict
import numpy as np
from ..config import YOLO_WEIGHTS

COCO = {1: "bicycle", 2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}

# Distinct BGR color palette for vehicle classes
CLASS_BGR = {
    "car": (235, 99, 37),         # Blue
    "motorcycle": (38, 38, 220),   # Red
    "bus": (6, 119, 217),         # Amber
    "truck": (237, 58, 124),      # Purple
    "bicycle": (74, 163, 22)      # Green
}

def transcode_to_h264(input_path: Path, output_path: Path) -> bool:
    """Ensure output MP4 is encoded in browser-compatible H.264 (yuv420p)"""
    import shutil
    import subprocess
    
    ffmpeg_exe = shutil.which("ffmpeg")
    if not ffmpeg_exe:
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            ffmpeg_exe = None

    if ffmpeg_exe:
        tmp_target = output_path.with_name(f"{output_path.stem}_browser.mp4")
        cmd = [
            ffmpeg_exe, "-y",
            "-i", str(input_path),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            str(tmp_target)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and tmp_target.exists():
            if input_path == output_path:
                tmp_target.replace(output_path)
            else:
                input_path.unlink(missing_ok=True)
                tmp_target.replace(output_path)
            return True
    return False

def run_tracking(video_path, output_annotated_path=None, target_fps=5.0, imgsz=640):
    from ultralytics import YOLO
    model = YOLO(YOLO_WEIGHTS)
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 360
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    duration_s = total_frames / max(fps, 1.0)
    stride = max(int(round(fps / target_fps)), 1)
    
    tracks = defaultdict(lambda: {"cls": Counter(), "pts": []})
    per_frame, i = [], 0

    writer = None
    raw_out = None
    out_p = None
    if output_annotated_path:
        out_p = Path(output_annotated_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        raw_out = out_p.with_name(f"raw_{out_p.name}")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(str(raw_out), fourcc, target_fps, (W, H))

    while True:
        ok, frame = cap.read()
        if not ok: break
        
        if i % stride == 0:
            t = i / fps
            r = model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=list(COCO),
                imgsz=imgsz,
                conf=0.25,
                verbose=False,
                device="cpu"
            )[0]
            
            n = 0
            current_boxes = []

            if r.boxes is not None and r.boxes.id is not None:
                boxes_xywh = r.boxes.xywh.tolist()
                track_ids = r.boxes.id.int().tolist()
                classes = r.boxes.cls.int().tolist()
                confs = r.boxes.conf.tolist() if r.boxes.conf is not None else [0.8] * len(boxes_xywh)

                for b, tid, c, conf in zip(boxes_xywh, track_ids, classes, confs):
                    cx, cy, w, h = b
                    cls_name = COCO.get(c, "vehicle")
                    tracks[tid]["cls"][cls_name] += 1
                    tracks[tid]["pts"].append([round(t, 2), round(cx, 1), round(cy, 1), round(w, 1), round(h, 1)])
                    current_boxes.append((tid, cls_name, conf, cx, cy, w, h))
                    n += 1

            per_frame.append((round(t, 2), n))

            # Render annotations if video writer is enabled
            if writer is not None:
                annotated = frame.copy()
                
                # Draw top status banner
                cv2.rectangle(annotated, (0, 0), (W, 36), (20, 24, 33), -1)
                hud_text = f"Time: {t:.1f}s | Active Vehicles: {n} | Total Tracked: {len(tracks)}"
                cv2.putText(annotated, hud_text, (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

                # Draw trajectory trails and bounding boxes
                for tid, cls_name, conf, cx, cy, w, h in current_boxes:
                    col = CLASS_BGR.get(cls_name, (255, 255, 255))
                    x1, y1 = int(cx - w / 2), int(cy - h / 2)
                    x2, y2 = int(cx + w / 2), int(cy + h / 2)

                    # Draw past trajectory points (tail)
                    pts = tracks[tid]["pts"][-12:]
                    if len(pts) > 1:
                        for k in range(1, len(pts)):
                            pt1 = (int(pts[k-1][1]), int(pts[k-1][2]))
                            pt2 = (int(pts[k][1]), int(pts[k][2]))
                            cv2.line(annotated, pt1, pt2, col, 2, cv2.LINE_AA)

                    # Bounding Box
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), col, 2, cv2.LINE_AA)

                    # Label badge
                    label = f"#{tid} {cls_name} {conf:.2f}"
                    (tw, th), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                    cv2.rectangle(annotated, (x1, max(0, y1 - th - 6)), (x1 + tw + 6, y1), col, -1)
                    cv2.putText(annotated, label, (x1 + 3, max(th, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

                writer.write(annotated)

        i += 1

    cap.release()
    if writer is not None:
        writer.release()
        if raw_out and raw_out.exists() and out_p:
            success = transcode_to_h264(raw_out, out_p)
            if not success and not out_p.exists():
                raw_out.replace(out_p)

    return {
        "fps": fps,
        "size": [W, H],
        "duration_s": round(duration_s, 2),
        "tracks": tracks,
        "per_frame": per_frame,
        "annotated_path": str(output_annotated_path) if output_annotated_path else None
    }
