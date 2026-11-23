"""
Notification Service supporting:
1. In-app real-time notification engine with role-based routing (Police vs Citizen).
2. Firebase Cloud Messaging (FCM) push notifications integration.
"""
import os, json, time
from datetime import datetime
from pathlib import Path
from ..config import DATA

TOKENS_FILE = DATA / "fcm_tokens.json"
NOTIFS_FILE = DATA / "notifications.json"

_fcm_initialized = False

def _init_fcm():
    global _fcm_initialized
    if _fcm_initialized: return True
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if cred_path and Path(cred_path).exists():
        try:
            import firebase_admin
            from firebase_admin import credentials
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _fcm_initialized = True
            print("Firebase Admin initialized successfully.")
            return True
        except Exception as e:
            print(f"Firebase init warning: {e}")
    return False

def _load_json(p, default):
    if not p.exists(): return default
    try: return json.loads(p.read_text())
    except Exception: return default

def _save_json(p, obj):
    try: p.write_text(json.dumps(obj, indent=2))
    except Exception: pass

def register_fcm_token(token: str, role: str = "citizen", user_id: str = "anonymous"):
    tokens = _load_json(TOKENS_FILE, [])
    # Update or insert
    tokens = [t for t in tokens if t.get("token") != token]
    tokens.append({"token": token, "role": role, "user_id": user_id, "updated_at": datetime.utcnow().isoformat()})
    _save_json(TOKENS_FILE, tokens)
    return {"registered": True, "role": role}

def push_notification(title: str, body: str, severity: str = "moderate", audience: list = None, data: dict = None):
    """
    Dispatches in-app notifications and attempts FCM push delivery.
    Audience can include: ["police"], ["citizen"], or ["police", "citizen"].
    """
    audience = audience or ["police"]
    notif = {
        "id": int(time.time() * 1000),
        "title": title,
        "body": body,
        "severity": severity,
        "audience": audience,
        "data": data or {},
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Store in-app notification
    notifs = _load_json(NOTIFS_FILE, [])
    notifs.insert(0, notif)
    notifs = notifs[:100]  # keep latest 100
    _save_json(NOTIFS_FILE, notifs)

    # Dispatch FCM if configured
    if _init_fcm():
        try:
            from firebase_admin import messaging
            tokens = _load_json(TOKENS_FILE, [])
            target_tokens = [t["token"] for t in tokens if any(a in t.get("role", "citizen") for a in audience)]
            if target_tokens:
                msg = messaging.MulticastMessage(
                    notification=messaging.Notification(title=title, body=body),
                    data={k: str(v) for k, v in (data or {}).items()},
                    tokens=target_tokens[:500]
                )
                messaging.send_multicast(msg)
        except Exception as e:
            print(f"FCM push dispatch exception (logged): {e}")

    return notif

def list_notifications(role: str = "police", limit: int = 30):
    notifs = _load_json(NOTIFS_FILE, [])
    # Filter by audience
    filtered = [n for n in notifs if role in n.get("audience", ["police"])]
    return filtered[:limit]
