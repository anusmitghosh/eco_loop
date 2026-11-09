from fastapi import APIRouter, HTTPException, Request, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
import json
from database import get_db
from auth import (
    hash_password, verify_password, create_session, get_session,
    destroy_session, log_audit, log_security_event, check_rate_limit
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    phone: str
    password: str
    full_name: str
    business_name: str
    business_type: str
    registration_no: Optional[str] = None
    gstin: Optional[str] = None
    city: str
    state: str
    country: str = "India"
    role: str = "buyer" # buyer, seller, buyer_seller

class RoleSwitchRequest(BaseModel):
    new_role: str

def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif "ecoloop_token" in request.cookies:
        token = request.cookies.get("ecoloop_token")

    if not token:
        raise HTTPException(status_code=401, detail="Authentication credentials not provided")

    session = get_session(token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.email, u.phone, u.full_name, u.role, u.active_role, u.is_verified,
               u.two_factor_enabled, u.is_suspended,
               b.id as business_id, b.business_name, b.business_type, b.city, b.state,
               b.rating, b.materials_sold_kg, b.materials_purchased_kg, b.transactions_completed
        FROM users u
        LEFT JOIN businesses b ON b.user_id = u.id
        WHERE u.id = ?
    """, (session["user_id"],))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user["is_suspended"]:
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact support.")

    user_dict = dict(user)
    user_dict["token"] = token
    return user_dict

def get_optional_user(request: Request, authorization: Optional[str] = Header(None)) -> Optional[dict]:
    try:
        return get_current_user(request, authorization)
    except Exception:
        return None

@router.post("/login")
def login(req: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not check_rate_limit(client_ip, max_requests=30, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please wait a minute.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (req.email,))
    user = cursor.fetchone()

    if not user:
        log_security_event(conn, None, "login_failed", client_ip, request.headers.get("user-agent"), f"Failed login for non-existent email {req.email}", "medium")
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user["is_suspended"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Account suspended. Contact EcoLoop trust & safety.")

    if not verify_password(req.password, user["password_hash"], user["salt"]):
        cursor.execute("UPDATE users SET failed_logins = failed_logins + 1 WHERE id = ?", (user["id"],))
        conn.commit()
        log_security_event(conn, user["id"], "login_failed", client_ip, request.headers.get("user-agent"), "Incorrect password entered", "medium")
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Successful login
    cursor.execute("UPDATE users SET failed_logins = 0, last_login_at = CURRENT_TIMESTAMP WHERE id = ?", (user["id"],))
    conn.commit()

    token = create_session(dict(user))
    log_audit(conn, user["id"], "LOGIN", "user", str(user["id"]), "User logged in successfully", client_ip)
    log_security_event(conn, user["id"], "login_success", client_ip, request.headers.get("user-agent"), "Session created", "low")

    # Fetch business profile
    cursor.execute("SELECT * FROM businesses WHERE user_id = ?", (user["id"],))
    biz = cursor.fetchone()
    conn.close()

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "phone": user["phone"],
            "full_name": user["full_name"],
            "role": user["role"],
            "active_role": user["active_role"],
            "is_verified": bool(user["is_verified"]),
            "two_factor_enabled": bool(user["two_factor_enabled"]),
            "business": dict(biz) if biz else None
        }
    }

@router.post("/signup")
def signup(req: SignupRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ? COLLATE NOCASE", (req.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    pwd_hash, salt = hash_password(req.password)
    active_role = "seller" if req.role in ["seller", "buyer_seller"] else "buyer"

    try:
        cursor.execute("""
            INSERT INTO users (email, phone, password_hash, salt, full_name, role, active_role, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        """, (req.email, req.phone, pwd_hash, salt, req.full_name, req.role, active_role))
        user_id = cursor.lastrowid

        # Create business profile
        cursor.execute("""
            INSERT INTO businesses (user_id, business_name, business_type, registration_no, gstin, city, state, country, description, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (user_id, req.business_name, req.business_type, req.registration_no, req.gstin, req.city, req.state, req.country, f"Enterprise operations in {req.city}."))
        biz_id = cursor.lastrowid

        # Create default privacy settings (privacy-by-default)
        cursor.execute("""
            INSERT INTO privacy_settings (user_id, show_city_publicly, show_approx_area, reveal_exact_after_confirmation, share_exact_with_logistics)
            VALUES (?, 1, 1, 1, 1)
        """, (user_id,))

        conn.commit()

        # Audit
        log_audit(conn, user_id, "USER_REGISTERED", "user", str(user_id), f"New {req.role} account created", client_ip)

        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        new_user = cursor.fetchone()
        token = create_session(dict(new_user))

        cursor.execute("SELECT * FROM businesses WHERE id = ?", (biz_id,))
        new_biz = cursor.fetchone()
        conn.close()

        return {
            "success": True,
            "token": token,
            "user": {
                "id": new_user["id"],
                "email": new_user["email"],
                "phone": new_user["phone"],
                "full_name": new_user["full_name"],
                "role": new_user["role"],
                "active_role": new_user["active_role"],
                "is_verified": False,
                "business": dict(new_biz)
            }
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0", (user["id"],))
    unread = cursor.fetchone()["unread_count"]
    cursor.execute("SELECT * FROM privacy_settings WHERE user_id = ?", (user["id"],))
    privacy = cursor.fetchone()
    conn.close()

    user_data = dict(user)
    user_data["unread_notifications"] = unread
    user_data["privacy_settings"] = dict(privacy) if privacy else {}
    return {"success": True, "user": user_data}

@router.post("/switch-role")
def switch_role(req: RoleSwitchRequest, user: dict = Depends(get_current_user)):
    target_role = req.new_role.lower()
    if target_role not in ["buyer", "seller", "logistics", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid target role")

    # Ensure role is permissible
    if target_role in ["admin", "logistics"] and user["role"] != target_role:
        raise HTTPException(status_code=403, detail="Role transition unauthorized")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET active_role = ? WHERE id = ?", (target_role, user["id"]))
    conn.commit()
    log_audit(conn, user["id"], "ROLE_SWITCHED", "user", str(user["id"]), f"Active role switched to {target_role}")
    conn.close()

    # Update current session
    token = user.get("token")
    if token and token in SESSIONS:
        SESSIONS[token]["active_role"] = target_role

    return {"success": True, "active_role": target_role, "message": f"Switched mode to {target_role.upper()}"}

@router.post("/demo-switch")
def demo_switch(req: dict):
    """Convenience helper for live demonstration & testing across all four perspectives."""
    role_target = req.get("demo_role", "seller")
    email_map = {
        "seller": "seller@greenleaf.in",
        "buyer": "buyer@packright.com",
        "both": "both@ecobiz.in",
        "logistics": "logistics@ecoloop.in",
        "admin": "admin@ecoloop.in"
    }
    target_email = email_map.get(role_target, "seller@greenleaf.in")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (target_email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Demo account not found")

    token = create_session(dict(user))
    cursor.execute("SELECT * FROM businesses WHERE user_id = ?", (user["id"],))
    biz = cursor.fetchone()
    conn.close()

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "phone": user["phone"],
            "full_name": user["full_name"],
            "role": user["role"],
            "active_role": user["active_role"],
            "is_verified": bool(user["is_verified"]),
            "two_factor_enabled": bool(user["two_factor_enabled"]),
            "business": dict(biz) if biz else None
        }
    }

@router.post("/logout")
def logout(user: dict = Depends(get_current_user)):
    token = user.get("token")
    if token:
        destroy_session(token)
    return {"success": True, "message": "Logged out successfully"}

class ProfileUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    registration_no: Optional[str] = None
    gstin: Optional[str] = None
    logo_url: Optional[str] = None
    full_name: Optional[str] = None

class VerificationSubmitRequest(BaseModel):
    document_type: str # gstin, trade_license, incorporation_cert, pollution_board
    document_number: str
    document_url: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

@router.get("/profile")
def get_profile(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.email, u.phone, u.full_name, u.role, u.active_role, u.is_verified,
               u.two_factor_enabled, u.created_at, u.last_login_at,
               b.id as business_id, b.business_name, b.business_type, b.registration_no,
               b.gstin, b.city, b.state, b.country, b.description, b.logo_url,
               b.is_verified as biz_verified, b.rating, b.total_reviews,
               b.materials_sold_kg, b.materials_purchased_kg, b.transactions_completed
        FROM users u
        LEFT JOIN businesses b ON b.user_id = u.id
        WHERE u.id = ?
    """, (user["id"],))
    row = cursor.fetchone()

    cursor.execute("""
        SELECT * FROM business_verifications WHERE business_id = ? ORDER BY id DESC
    """, (row["business_id"] if row and row["business_id"] else 0,))
    verifs = [dict(v) for v in cursor.fetchall()]

    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")

    p = dict(row)
    p["verifications"] = verifs
    return {"success": True, "profile": p}

@router.put("/profile")
def update_profile(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    if req.full_name:
        cursor.execute("UPDATE users SET full_name = ? WHERE id = ?", (req.full_name, user["id"]))

    cursor.execute("SELECT id FROM businesses WHERE user_id = ?", (user["id"],))
    biz = cursor.fetchone()
    if biz:
        cursor.execute("""
            UPDATE businesses
            SET business_name = COALESCE(?, business_name),
                business_type = COALESCE(?, business_type),
                description = COALESCE(?, description),
                city = COALESCE(?, city),
                state = COALESCE(?, state),
                registration_no = COALESCE(?, registration_no),
                gstin = COALESCE(?, gstin),
                logo_url = COALESCE(?, logo_url)
            WHERE id = ?
        """, (
            req.business_name, req.business_type, req.description,
            req.city, req.state, req.registration_no, req.gstin, req.logo_url,
            biz["id"]
        ))
    conn.commit()
    log_audit(conn, user["id"], "PROFILE_UPDATED", "business", str(biz["id"] if biz else 0), "Updated enterprise profile metadata")
    conn.close()

    return {"success": True, "message": "Business profile updated successfully."}

@router.post("/verify-business")
def submit_verification(req: VerificationSubmitRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM businesses WHERE user_id = ?", (user["id"],))
    biz = cursor.fetchone()
    if not biz:
        conn.close()
        raise HTTPException(status_code=404, detail="Business not found")

    cursor.execute("""
        INSERT INTO business_verifications (business_id, document_type, document_number, document_url, status)
        VALUES (?, ?, ?, ?, 'pending')
    """, (biz["id"], req.document_type, req.document_number, req.document_url or "/static/uploads/sample_gst.pdf"))
    verif_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Verification Submitted', 'Your enterprise compliance documents have been submitted to EcoLoop Trust & Security.', 'security', '#business-profile')
    """, (user["id"],))

    conn.commit()
    log_audit(conn, user["id"], "VERIFICATION_SUBMITTED", "business_verification", str(verif_id), f"Document type: {req.document_type}")
    conn.close()

    return {
        "success": True,
        "verification_id": verif_id,
        "status": "pending",
        "message": "Verification submitted successfully. EcoLoop Governance will review within 24 hours."
    }

@router.post("/toggle-2fa")
def toggle_2fa(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT two_factor_enabled FROM users WHERE id = ?", (user["id"],))
    curr = cursor.fetchone()["two_factor_enabled"]
    new_val = 0 if curr else 1

    cursor.execute("UPDATE users SET two_factor_enabled = ? WHERE id = ?", (new_val, user["id"]))
    conn.commit()
    log_audit(conn, user["id"], "2FA_TOGGLED", "user", str(user["id"]), f"2FA set to {bool(new_val)}")
    conn.close()

    return {
        "success": True,
        "two_factor_enabled": bool(new_val),
        "message": f"Two-Factor Authentication is now {'enabled' if new_val else 'disabled'}."
    }

@router.post("/change-password")
def change_password(req: PasswordChangeRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash, salt FROM users WHERE id = ?", (user["id"],))
    u = cursor.fetchone()

    if not verify_password(req.old_password, u["password_hash"], u["salt"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Current password incorrect")

    if len(req.new_password) < 6:
        conn.close()
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    new_hash, new_salt = hash_password(req.new_password)
    cursor.execute("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (new_hash, new_salt, user["id"]))
    conn.commit()
    log_audit(conn, user["id"], "PASSWORD_CHANGED", "user", str(user["id"]), "Password successfully updated")
    conn.close()

    return {"success": True, "message": "Password updated successfully."}

@router.get("/security-sessions")
def get_security_sessions(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM security_events
        WHERE user_id = ?
        ORDER BY id DESC LIMIT 20
    """, (user["id"],))
    events = [dict(e) for e in cursor.fetchall()]

    cursor.execute("""
        SELECT * FROM audit_logs
        WHERE user_id = ?
        ORDER BY id DESC LIMIT 20
    """, (user["id"],))
    audits = [dict(a) for a in cursor.fetchall()]
    conn.close()

    return {
        "success": True,
        "active_sessions": [
            {
                "session_id": "SES-" + str(user["id"]) + "-CURRENT",
                "device": "Current Web Browser (Chrome/Edge on Windows)",
                "ip_address": "127.0.0.1",
                "last_active": "Just now",
                "is_current": True
            }
        ],
        "recent_security_events": events,
        "audit_logs": audits
    }
