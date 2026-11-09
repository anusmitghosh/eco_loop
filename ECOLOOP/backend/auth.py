import hashlib
import os
import secrets
import json
import time
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_bearer = HTTPBearer(auto_error=False)

# In-memory session store: token -> session dict
# (can be supplemented with DB session records)
SESSIONS: Dict[str, Dict[str, Any]] = {}

# In-memory rate limiting tracker: ip -> list of timestamps
RATE_LIMITS: Dict[str, list] = {}

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    # PBKDF2 with HMAC-SHA256, 100,000 iterations
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return key.hex(), salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, password_hash)

def generate_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"

def create_session(user: dict, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = time.time() + 86400 * 7 # 7 days
    session_data = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "active_role": user.get("active_role", user["role"]),
        "full_name": user["full_name"],
        "created_at": time.time(),
        "expires_at": expires_at
    }
    SESSIONS[token] = session_data

    # Persist in DB for process restarts / workers
    try:
        from database import get_db
        conn = get_db()
        conn.execute("""
            INSERT OR REPLACE INTO user_sessions (token, user_id, active_role, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (token, user["id"], session_data["active_role"], ip_address, user_agent, expires_at))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error persisting session to DB: {e}")

    return token

def get_session(token: str) -> Optional[dict]:
    if not token:
        return None

    # Check memory cache first
    if token in SESSIONS:
        session = SESSIONS[token]
        if time.time() > session["expires_at"]:
            del SESSIONS[token]
            return None
        return session

    # Fallback to persistent DB store
    try:
        from database import get_db
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, u.email, u.role, u.full_name, u.is_suspended
            FROM user_sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ? AND s.expires_at > ?
        """, (token, time.time()))
        row = cursor.fetchone()
        conn.close()

        if row:
            if row["is_suspended"]:
                return None
            session_data = {
                "user_id": row["user_id"],
                "email": row["email"],
                "role": row["role"],
                "active_role": row["active_role"],
                "full_name": row["full_name"],
                "created_at": time.time(),
                "expires_at": row["expires_at"]
            }
            SESSIONS[token] = session_data
            return session_data
    except Exception as e:
        print(f"Error loading session from DB: {e}")

    return None

def update_session_role(token: str, new_role: str):
    if token in SESSIONS:
        SESSIONS[token]["active_role"] = new_role
    try:
        from database import get_db
        conn = get_db()
        conn.execute("UPDATE user_sessions SET active_role = ? WHERE token = ?", (new_role, token))
        conn.commit()
        conn.close()
    except Exception:
        pass

def destroy_session(token: str) -> bool:
    if token in SESSIONS:
        del SESSIONS[token]
    try:
        from database import get_db
        conn = get_db()
        conn.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
        return True
    except Exception:
        return False

def check_rate_limit(ip: str, max_requests: int = 60, window_seconds: int = 60) -> bool:
    now = time.time()
    timestamps = RATE_LIMITS.get(ip, [])
    # Filter out timestamps older than window
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        return False
    timestamps.append(now)
    RATE_LIMITS[ip] = timestamps
    return True

def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 6:
        return "****"
    return phone[:3] + " •••• ••" + phone[-2:]

def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "****@****"
    parts = email.split("@")
    username = parts[0]
    domain = parts[1]
    if len(username) <= 2:
        masked_user = username[0] + "***"
    else:
        masked_user = username[0] + "***" + username[-1]
    return f"{masked_user}@{domain}"

def mask_name(name: str) -> str:
    if not name:
        return "Anonymous"
    parts = name.split()
    if len(parts) == 1:
        return parts[0][:2] + "****"
    return f"{parts[0]} {parts[1][0]}****"

def log_audit(conn, user_id: Optional[int], action: str, resource_type: str, resource_id: Optional[str], details: Optional[str] = None, ip_address: Optional[str] = None):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (user_id, action, resource_type, str(resource_id) if resource_id else None, details, ip_address))
        conn.commit()
    except Exception as e:
        print(f"Error logging audit: {e}")

def log_security_event(conn, user_id: Optional[int], event_type: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None, details: Optional[str] = None, severity: str = 'low'):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO security_events (user_id, event_type, ip_address, user_agent, details, severity, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (user_id, event_type, ip_address, user_agent, details, severity))
        conn.commit()
    except Exception as e:
        print(f"Error logging security event: {e}")
