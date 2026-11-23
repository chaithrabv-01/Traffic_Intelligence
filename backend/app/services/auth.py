"""
Authentication and Role-Based Access Control (RBAC) Service.
Uses bcrypt for secure password hashing and python-jose for JWT access tokens.
Provides role guard dependencies for Traffic Police and Citizen portals.
"""
import os
from datetime import datetime, timedelta
import bcrypt
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..db import get_db, SessionLocal
from ..models import User

SECRET_KEY = os.getenv("JWT_SECRET", "traffic-intelligence-secret-key-prod-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found or disabled")
    return user

def get_optional_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username:
            return db.query(User).filter(User.username == username, User.is_active == True).first()
    except Exception:
        pass
    return None

def police_required(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "police":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Traffic Police authorization required."
        )
    return current_user

def citizen_required(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("citizen", "police"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Citizen authentication required."
        )
    return current_user

def init_default_users(db: Session = None):
    """Seed initial demo accounts if database has no users."""
    close = False
    if db is None:
        db = SessionLocal()
        close = True
    try:
        if db.query(User).count() == 0:
            police = User(
                username="police_officer",
                email="officer@traffic.police.gov",
                password_hash=hash_password("police123"),
                role="police",
                full_name="Inspector R. Sharma",
                badge_or_id="BTP-8842",
                phone="+91 98450 11223"
            )
            citizen = User(
                username="citizen_user",
                email="citizen@example.com",
                password_hash=hash_password("citizen123"),
                role="citizen",
                full_name="Arjun Varma",
                phone="+91 98765 43210"
            )
            db.add_all([police, citizen])
            db.commit()
            print("Initialized default accounts: police_officer / police123 and citizen_user / citizen123")
    except Exception as e:
        db.rollback()
        print(f"User seed notice: {e}")
    finally:
        if close:
            db.close()
