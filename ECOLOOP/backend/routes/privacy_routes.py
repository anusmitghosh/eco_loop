from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_db
from routes.auth_routes import get_current_user
from auth import log_audit

router = APIRouter(prefix="/api/privacy", tags=["privacy"])

class PrivacySettingsUpdate(BaseModel):
    show_city_publicly: bool
    show_approx_area: bool
    reveal_exact_after_confirmation: bool
    share_exact_with_logistics: bool
    phone_visibility: Optional[str] = "masked"
    email_visibility: Optional[str] = "masked"
    profile_visibility: Optional[str] = "public"

@router.get("/settings")
def get_privacy_settings(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM privacy_settings WHERE user_id = ?", (user["id"],))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {
            "success": True,
            "settings": {
                "show_city_publicly": True,
                "show_approx_area": True,
                "reveal_exact_after_confirmation": True,
                "share_exact_with_logistics": True,
                "phone_visibility": "masked",
                "email_visibility": "masked"
            }
        }
    return {"success": True, "settings": dict(row)}

@router.put("/settings")
def update_privacy_settings(req: PrivacySettingsUpdate, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE privacy_settings
        SET show_city_publicly = ?,
            show_approx_area = ?,
            reveal_exact_after_confirmation = ?,
            share_exact_with_logistics = ?,
            phone_visibility = ?,
            email_visibility = ?,
            profile_visibility = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
    """, (
        1 if req.show_city_publicly else 0,
        1 if req.show_approx_area else 0,
        1 if req.reveal_exact_after_confirmation else 0,
        1 if req.share_exact_with_logistics else 0,
        req.phone_visibility,
        req.email_visibility,
        req.profile_visibility,
        user["id"]
    ))

    conn.commit()
    log_audit(conn, user["id"], "PRIVACY_SETTINGS_UPDATED", "privacy_settings", str(user["id"]), "User modified location and visibility permissions.")
    conn.close()

    return {"success": True, "message": "Privacy & location preferences updated successfully."}

@router.get("/audit-history")
def get_location_access_history(user: dict = Depends(get_current_user)):
    """Provides transparency to sellers and buyers on who accessed their physical location data."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT a.*, u.full_name as requester_name, u.role as requester_role
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.action IN ('LOCATION_COORDINATES_ACCESSED', 'PICKUP_OTP_VERIFIED', 'DELIVERY_CONFIRMED', 'LOCATION_ACCESS_AUTHORIZED', 'SHIPMENT_TRACKED')
        ORDER BY a.id DESC LIMIT 25
    """)
    rows = cursor.fetchall()
    conn.close()

    return {"success": True, "audit_events": [dict(r) for r in rows]}

@router.get("/export-data")
def export_user_data(user: dict = Depends(get_current_user)):
    """Comprehensive data export for GDPR / DPDP compliance."""
    conn = get_db()
    cursor = conn.cursor()

    # User profile & business
    cursor.execute("SELECT id, email, phone, full_name, role, created_at FROM users WHERE id = ?", (user["id"],))
    u_info = dict(cursor.fetchone())

    cursor.execute("SELECT * FROM businesses WHERE user_id = ?", (user["id"],))
    b_info = dict(cursor.fetchone()) if cursor.fetchone() else None

    # Listings
    cursor.execute("SELECT id, title, quantity, unit, price_per_unit, city, status, created_at FROM listings WHERE business_id = (SELECT id FROM businesses WHERE user_id = ?)", (user["id"],))
    listings = [dict(r) for r in cursor.fetchall()]

    # Orders
    cursor.execute("SELECT order_number, quantity, unit, total_amount, payment_status, order_status, created_at FROM orders WHERE buyer_id = ? OR seller_id = ?", (user["id"], user["id"]))
    orders = [dict(r) for r in cursor.fetchall()]

    # Audit records
    cursor.execute("SELECT action, resource_type, resource_id, timestamp FROM audit_logs WHERE user_id = ?", (user["id"],))
    audits = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "export_metadata": {
            "platform": "EcoLoop Circular Economy Marketplace",
            "format_version": "1.0",
            "retrieval_timestamp": "2026-09-25T15:30:00Z"
        },
        "user_profile": u_info,
        "business_profile": b_info,
        "listings_count": len(listings),
        "listings": listings,
        "orders_count": len(orders),
        "orders": orders,
        "audit_logs": audits
    }
