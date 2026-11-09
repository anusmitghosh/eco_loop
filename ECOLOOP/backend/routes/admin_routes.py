from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from routes.auth_routes import get_current_user
from auth import log_audit

router = APIRouter(prefix="/api/admin", tags=["admin"])

def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required.")
    return user

class VerificationReviewRequest(BaseModel):
    action: str # approve, reject
    notes: Optional[str] = None

class DisputeResolveRequest(BaseModel):
    action: str # resolve_refund_buyer, resolve_release_seller, reject
    resolution_notes: str

@router.get("/metrics")
def get_admin_metrics(admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT count(*) as total_users FROM users")
    total_users = cursor.fetchone()["total_users"]

    cursor.execute("SELECT count(*) as verified_biz FROM businesses WHERE is_verified = 1")
    verified_biz = cursor.fetchone()["verified_biz"]

    cursor.execute("SELECT count(*) as active_listings FROM listings WHERE status = 'active'")
    active_listings = cursor.fetchone()["active_listings"]

    cursor.execute("SELECT count(*) as active_orders, COALESCE(SUM(total_amount), 0) as total_volume FROM orders WHERE order_status NOT IN ('cancelled', 'completed')")
    order_data = cursor.fetchone()

    cursor.execute("SELECT count(*) as active_logistics FROM logistics_orders WHERE is_tracking_active = 1")
    active_logistics = cursor.fetchone()["active_logistics"]

    cursor.execute("SELECT count(*) as open_disputes FROM disputes WHERE status IN ('open', 'under_review')")
    open_disputes = cursor.fetchone()["open_disputes"]

    cursor.execute("SELECT count(*) as security_alerts FROM security_events WHERE severity IN ('medium', 'high')")
    security_alerts = cursor.fetchone()["security_alerts"]

    conn.close()

    return {
        "success": True,
        "metrics": {
            "total_users": total_users,
            "verified_businesses": verified_biz,
            "active_listings": active_listings,
            "active_orders": order_data["active_orders"],
            "total_trade_volume": order_data["total_volume"],
            "active_logistics": active_logistics,
            "open_disputes": open_disputes,
            "security_alerts": security_alerts
        }
    }

@router.get("/businesses")
def get_businesses(admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT b.*, u.email, u.phone, u.full_name as owner_name, u.is_suspended
        FROM businesses b
        JOIN users u ON u.id = b.user_id
        ORDER BY b.is_verified ASC, b.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    return {"success": True, "businesses": [dict(r) for r in rows]}

@router.post("/businesses/{business_id}/verify")
def review_business_verification(business_id: int, req: VerificationReviewRequest, admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM businesses WHERE id = ?", (business_id,))
    biz = cursor.fetchone()
    if not biz:
        conn.close()
        raise HTTPException(status_code=404, detail="Business not found")

    new_status = 1 if req.action == "approve" else 0
    cursor.execute("""
        UPDATE businesses
        SET is_verified = ?, verification_date = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_status, business_id))

    cursor.execute("""
        UPDATE users
        SET is_verified = ?
        WHERE id = ?
    """, (new_status, biz["user_id"]))

    # Notify business owner
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Business Verification Update', ?, 'alert', '#profile')
    """, (biz["user_id"], f"Your business verification status has been set to: {req.action.upper()}."))

    conn.commit()
    log_audit(conn, admin["id"], "BUSINESS_VERIFICATION_REVIEWED", "business", str(business_id), f"Action: {req.action}. Notes: {req.notes}")
    conn.close()

    return {"success": True, "message": f"Business verification status updated to {req.action}."}

@router.get("/disputes")
def get_disputes(admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT d.*, o.order_number, o.total_amount, o.delivery_method,
               u_raised.full_name as raised_by_name, u_raised.email as raised_by_email,
               u_against.full_name as against_name, u_against.email as against_email
        FROM disputes d
        JOIN orders o ON o.id = d.order_id
        JOIN users u_raised ON u_raised.id = d.raised_by_id
        JOIN users u_against ON u_against.id = d.against_id
        ORDER BY d.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    return {"success": True, "disputes": [dict(r) for r in rows]}

@router.post("/disputes/{dispute_id}/resolve")
def resolve_dispute(dispute_id: int, req: DisputeResolveRequest, admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT d.*, o.id as order_id, o.order_number, o.buyer_id, o.seller_id
        FROM disputes d
        JOIN orders o ON o.id = d.order_id
        WHERE d.id = ?
    """, (dispute_id,))
    disp = cursor.fetchone()

    if not disp:
        conn.close()
        raise HTTPException(status_code=404, detail="Dispute not found")

    status_str = "resolved" if req.action != "reject" else "rejected"
    cursor.execute("""
        UPDATE disputes
        SET status = ?, resolution_notes = ?, resolved_by_admin_id = ?, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (status_str, req.resolution_notes, admin["id"], dispute_id))

    if req.action == "resolve_refund_buyer":
        cursor.execute("UPDATE orders SET order_status = 'cancelled', payment_status = 'refunded' WHERE id = ?", (disp["order_id"],))
    elif req.action == "resolve_release_seller":
        cursor.execute("UPDATE orders SET order_status = 'completed' WHERE id = ?", (disp["order_id"],))

    # Notify parties
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Dispute Resolved', ?, 'alert', ?)
    """, (disp["buyer_id"], f"Admin resolved dispute on Order #{disp['order_number']}: {req.resolution_notes}", f"#orders/{disp['order_id']}"))

    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Dispute Resolved', ?, 'alert', ?)
    """, (disp["seller_id"], f"Admin resolved dispute on Order #{disp['order_number']}: {req.resolution_notes}", f"#orders/{disp['order_id']}"))

    conn.commit()
    log_audit(conn, admin["id"], "DISPUTE_RESOLVED", "dispute", str(dispute_id), f"Admin resolved dispute. Action: {req.action}")
    conn.close()

    return {"success": True, "message": "Dispute resolved successfully."}

@router.get("/audit-logs")
def get_audit_logs(action: Optional[str] = None, admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT a.*, u.email as user_email, u.full_name as user_name, u.role as user_role
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE 1=1
    """
    params = []
    if action:
        query += " AND a.action = ?"
        params.append(action)

    query += " ORDER BY a.id DESC LIMIT 100"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return {"success": True, "audit_logs": [dict(r) for r in rows]}

@router.get("/security-events")
def get_security_events(admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT se.*, u.email as user_email
        FROM security_events se
        LEFT JOIN users u ON u.id = se.user_id
        ORDER BY se.id DESC LIMIT 100
    """)
    rows = cursor.fetchall()
    conn.close()

    return {"success": True, "security_events": [dict(r) for r in rows]}

@router.post("/users/{user_id}/toggle-suspend")
def toggle_user_suspend(user_id: int, admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, is_suspended, email FROM users WHERE id = ?", (user_id,))
    target = cursor.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    new_val = 0 if target["is_suspended"] else 1
    cursor.execute("UPDATE users SET is_suspended = ? WHERE id = ?", (new_val, user_id))
    conn.commit()

    log_audit(conn, admin["id"], "USER_SUSPENSION_TOGGLED", "user", str(user_id), f"Suspension set to {new_val} for {target['email']}")
    conn.close()

    return {"success": True, "is_suspended": bool(new_val), "message": f"User suspension status set to {bool(new_val)}."}
