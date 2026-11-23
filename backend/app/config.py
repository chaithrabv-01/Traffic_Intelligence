import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA/'app.db'}")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-4-6")
NOMINATIM_UA = os.getenv("NOMINATIM_USER_AGENT", "traffic-platform-demo")
YOLO_WEIGHTS = os.getenv("YOLO_WEIGHTS", "yolov8n.pt")
FRAME_EVERY_SEC = float(os.getenv("FRAME_EVERY_SEC", "2"))
GEO_INDEX = BASE.parent / "ml" / "geo" / "index"
