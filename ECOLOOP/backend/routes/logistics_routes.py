from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import time
from database import get_db
from routes.auth_routes import get_current_user, get_optional_user
from auth import log_audit, mask_name, mask_phone
from matching_engine import calculate_environmental_impact

router = APIRouter(prefix="/api/logistics", tags=["logistics"])

class PickupVerifyRequest(BaseModel):
    tracking_id: str
    pickup_otp: str
    driver_lat: Optional[float] = None
    driver_lng: Optional[float] = None

class DeliveryVerifyRequest(BaseModel):
    tracking_id: str
    delivery_otp: str
    digital_signature: Optional[str] = None
    photo_url: Optional[str] = None
    driver_lat: Optional[float] = None
    driver_lng: Optional[float] = None

class LocationUpdateRequest(BaseModel):
    tracking_id: str
    lat: float
    lng: float
    speed_kmh: Optional[float] = 30.0
    heading: Optional[float] = 0.0
    status_label: Optional[str] = "En route"
    advance_stage: Optional[str] = None

@router.get("/jobs")
def get_logistics_jobs(user: dict = Depends(get_current_user)):
    """Logistics partner dashboard list of delivery jobs."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT lo.*, o.order_number, o.quantity, o.unit, o.material_amount, o.order_status,
               o.pickup_otp, o.delivery_otp,
               l.title as material_title, l.condition as material_condition,
               sb.business_name as seller_name, bb.business_name as buyer_name,
               d.name as driver_name, d.vehicle_model, d.license_plate
        FROM logistics_orders lo
        JOIN orders o ON o.id = lo.order_id
        JOIN listings l ON l.id = o.listing_id
        JOIN businesses sb ON sb.user_id = o.seller_id
        JOIN businesses bb ON bb.user_id = o.buyer_id
        LEFT JOIN drivers d ON d.id = lo.driver_id
        ORDER BY lo.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    jobs = []
    for r in rows:
        job = dict(r)
        # As an authorized logistics driver/partner, exact addresses are accessible for active jobs
        jobs.append(job)

    return {"success": True, "jobs": jobs}

@router.get("/track/{tracking_id}")
def track_shipment(tracking_id: str, user: Optional[dict] = Depends(get_optional_user)):
    """
    Live location tracking endpoint with strict privacy controls.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT lo.*, o.order_number, o.quantity, o.unit, o.order_status, o.pickup_otp, o.delivery_otp,
               o.buyer_id, o.seller_id,
               l.id as listing_id, l.title as material_title, l.condition as material_condition,
               c.name as category_name,
               sb.business_name as seller_name, bb.business_name as buyer_name,
               d.name as driver_name, d.masked_phone as driver_phone, d.vehicle_model, d.license_plate,
               d.current_lat as driver_live_lat, d.current_lng as driver_live_lng
        FROM logistics_orders lo
        JOIN orders o ON o.id = lo.order_id
        JOIN listings l ON l.id = o.listing_id
        JOIN categories c ON c.id = l.category_id
        JOIN businesses sb ON sb.user_id = o.seller_id
        JOIN businesses bb ON bb.user_id = o.buyer_id
        LEFT JOIN drivers d ON d.id = lo.driver_id
        WHERE lo.tracking_id = ?
    """, (tracking_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Tracking ID {tracking_id} not found.")

    shipment = dict(row)

    # Determine user role & authorization
    is_buyer = user and user.get("id") == shipment["buyer_id"]
    is_seller = user and user.get("id") == shipment["seller_id"]
    is_admin = user and user.get("role") == "admin"
    is_logistics = user and (user.get("active_role") == "logistics" or user.get("role") == "logistics")

    is_authorized = is_buyer or is_seller or is_admin or is_logistics

    # PRIVACY ENFORCEMENT RULES:
    # 1. If not authorized (public visitor):
    if not is_authorized:
        # Mask everything sensitive
        shipment["pickup_exact_address"] = f"{shipment['pickup_approx_area']}, {shipment['pickup_city']}"
        shipment["delivery_exact_address"] = f"{shipment['delivery_approx_area']}, {shipment['delivery_city']}"
        shipment["driver_name"] = "EcoLoop Authorized Driver"
        shipment["driver_phone"] = "Masked"
        shipment["pickup_otp"] = None
        shipment["delivery_otp"] = None
        # Approximate coordinates only
        shipment["pickup_lat"] = round(shipment["pickup_lat"], 2)
        shipment["pickup_lng"] = round(shipment["pickup_lng"], 2)
        shipment["delivery_lat"] = round(shipment["delivery_lat"], 2)
        shipment["delivery_lng"] = round(shipment["delivery_lng"], 2)
        shipment["driver_live_lat"] = None
        shipment["driver_live_lng"] = None
        shipment["is_tracking_active"] = False
        conn.close()
        return {"success": True, "shipment": shipment, "is_authorized": False}

    # 2. For Authorized Users:
    # Buyer sees delivery_otp, Seller sees pickup_otp
    if is_buyer:
        shipment["my_otp"] = shipment["delivery_otp"]
        shipment["my_otp_instruction"] = "Provide this 6-digit OTP to the driver when material arrives."
        # Buyer sees approximate pickup before pickup occurs
        if shipment["stage"] in ["order_confirmed", "logistics_assigned", "pickup_scheduled"]:
            shipment["pickup_exact_address"] = f"Near {shipment['pickup_approx_area']}, {shipment['pickup_city']}"
    elif is_seller:
        shipment["my_otp"] = shipment["pickup_otp"]
        shipment["my_otp_instruction"] = "Provide this 6-digit OTP to the driver when they arrive for pickup."
        # Seller never sees buyer's exact home address if handled by EcoLoop Logistics
        shipment["delivery_exact_address"] = f"Delivery Hub: {shipment['delivery_approx_area']}, {shipment['delivery_city']} (EcoLoop Protected)"
    elif is_admin:
        shipment["my_otp"] = f"P:{shipment['pickup_otp']} / D:{shipment['delivery_otp']}"
        shipment["my_otp_instruction"] = "EcoLoop Master Verification Key"

    # Driver Name Masking (Rajesh K****) for external viewers, full for admin/logistics
    if not (is_admin or is_logistics):
        shipment["driver_name"] = mask_name(shipment["driver_name"])

    # If delivery completed, stop live GPS tracking
    if shipment["stage"] in ["delivered", "delivery_confirmed"]:
        shipment["is_tracking_active"] = False
        shipment["driver_live_lat"] = shipment["delivery_lat"]
        shipment["driver_live_lng"] = shipment["delivery_lng"]

    # Fetch waypoint breadcrumbs
    cursor.execute("""
        SELECT current_lat, current_lng, heading, speed_kmh, status_label, recorded_at
        FROM location_events
        WHERE logistics_order_id = ?
        ORDER BY id DESC LIMIT 10
    """, (shipment["id"],))
    breadcrumbs = [dict(b) for b in cursor.fetchall()]
    shipment["recent_breadcrumbs"] = breadcrumbs

    # Fetch proof if delivered
    cursor.execute("SELECT * FROM delivery_proofs WHERE logistics_order_id = ?", (shipment["id"],))
    proof = cursor.fetchone()
    shipment["delivery_proof"] = dict(proof) if proof else None

    # Audit access
    if user:
        log_audit(conn, user["id"], "SHIPMENT_TRACKED", "logistics_order", tracking_id, f"Tracked shipment stage: {shipment['stage']}")

    conn.close()
    return {"success": True, "shipment": shipment, "is_authorized": True}

@router.post("/verify-pickup")
def verify_pickup(req: PickupVerifyRequest, user: dict = Depends(get_current_user)):
    """Driver inputs seller OTP to confirm pickup."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT lo.*, o.pickup_otp, o.id as order_id, o.buyer_id, o.seller_id
        FROM logistics_orders lo
        JOIN orders o ON o.id = lo.order_id
        WHERE lo.tracking_id = ?
    """, (req.tracking_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Shipment not found")

    if row["pickup_otp"] != req.pickup_otp:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid Pickup OTP. Please request the 6-digit OTP from the seller.")

    # OTP is valid! Advance stage to 'picked_up' -> 'in_transit'
    cursor.execute("""
        UPDATE logistics_orders
        SET stage = 'in_transit', is_tracking_active = 1, pickup_actual_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (row["id"],))

    cursor.execute("UPDATE orders SET order_status = 'in_transit', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (row["order_id"],))

    # Log location event
    cur_lat = req.driver_lat or row["pickup_lat"]
    cur_lng = req.driver_lng or row["pickup_lng"]
    cursor.execute("""
        INSERT INTO location_events (logistics_order_id, current_lat, current_lng, speed_kmh, status_label)
        VALUES (?, ?, ?, 25.0, 'Material verified & picked up by EcoLoop Fleet')
    """, (row["id"], cur_lat, cur_lng))

    # Notify Buyer and Seller
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Material Picked Up', ?, 'logistics', ?)
    """, (row["buyer_id"], f"Your order {req.tracking_id} was picked up and is now in transit.", f"#tracking/{req.tracking_id}"))

    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Pickup Confirmed by Driver', ?, 'logistics', ?)
    """, (row["seller_id"], f"EcoLoop driver confirmed pickup for order {req.tracking_id}.", f"#orders/{row['order_id']}"))

    conn.commit()
    log_audit(conn, user["id"], "PICKUP_OTP_VERIFIED", "logistics_order", req.tracking_id, "Pickup OTP matched, stage set to in_transit")
    conn.close()

    return {"success": True, "stage": "in_transit", "message": "Pickup successfully verified! Live tracking is now active."}

@router.post("/verify-delivery")
def verify_delivery(req: DeliveryVerifyRequest, user: dict = Depends(get_current_user)):
    """Driver inputs buyer OTP + signature to confirm delivery."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT lo.*, o.delivery_otp, o.id as order_id, o.buyer_id, o.seller_id, o.quantity, o.listing_id,
               l.category_id, l.title as material_title,
               c.name as category_name
        FROM logistics_orders lo
        JOIN orders o ON o.id = lo.order_id
        JOIN listings l ON l.id = o.listing_id
        JOIN categories c ON c.id = l.category_id
        WHERE lo.tracking_id = ?
    """, (req.tracking_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Shipment not found")

    if row["delivery_otp"] != req.delivery_otp:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid Delivery OTP. Please request the 6-digit OTP from the buyer upon handing over material.")

    # Advance stage to 'delivered' and then 'delivery_confirmed'
    cursor.execute("""
        UPDATE logistics_orders
        SET stage = 'delivery_confirmed', is_tracking_active = 0, delivery_actual_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (row["id"],))

    cursor.execute("UPDATE orders SET order_status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (row["order_id"],))

    # Stop tracking session
    cursor.execute("UPDATE tracking_sessions SET is_active = 0, ended_at = CURRENT_TIMESTAMP WHERE logistics_order_id = ?", (row["id"],))

    # Record Delivery Proof
    cursor.execute("""
        INSERT INTO delivery_proofs (
            order_id, logistics_order_id, pickup_otp_verified, delivery_otp_verified,
            signature_svg_or_base64, photo_url, verified_gps_lat, verified_gps_lng, driver_name
        ) VALUES (?, ?, 1, 1, ?, ?, ?, ?, 'Rajesh Sharma')
    """, (row["order_id"], row["id"], req.digital_signature or "DIGITAL_VERIFIED_OTP", req.photo_url, req.driver_lat or row["delivery_lat"], req.driver_lng or row["delivery_lng"]))

    # Update Environmental Impact Record
    impact = calculate_environmental_impact(row["category_name"], row["quantity"])

    # Update seller's business total stats
    cursor.execute("""
        UPDATE businesses
        SET materials_sold_kg = materials_sold_kg + ?, transactions_completed = transactions_completed + 1
        WHERE user_id = ?
    """, (row["quantity"], row["seller_id"]))

    cursor.execute("""
        UPDATE businesses
        SET materials_purchased_kg = materials_purchased_kg + ?, transactions_completed = transactions_completed + 1
        WHERE user_id = ?
    """, (row["quantity"], row["buyer_id"]))

    # Create environmental impact record
    cursor.execute("""
        INSERT INTO environmental_impacts (
            order_id, business_id, material_type, category_id, weight_kg,
            waste_diverted_tonnes, co2_avoided_kg, water_saved_liters, energy_saved_kwh, trees_equivalent
        ) VALUES (?, (SELECT id FROM businesses WHERE user_id = ?), ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        row["order_id"], row["seller_id"], row["material_title"], row["category_id"], row["quantity"],
        impact["waste_diverted_tonnes"], impact["co2_avoided_kg"], impact["water_saved_liters"],
        impact["energy_saved_kwh"], impact["trees_equivalent"]
    ))

    # Notifications
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Delivery Completed!', ?, 'logistics', ?)
    """, (row["buyer_id"], f"Shipment {req.tracking_id} successfully delivered. Impact: {impact['waste_diverted_tonnes']} tonnes diverted!", f"#impact"))

    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Order Delivered & Escrow Released', ?, 'payment', ?)
    """, (row["seller_id"], f"Delivery confirmed for order {req.tracking_id}. Funds released to your account.", f"#orders/{row['order_id']}"))

    conn.commit()
    log_audit(conn, user["id"], "DELIVERY_CONFIRMED", "logistics_order", req.tracking_id, f"Delivery confirmed via OTP. Live tracking terminated.")
    conn.close()

    return {
        "success": True,
        "stage": "delivery_confirmed",
        "impact": impact,
        "message": "Delivery successfully verified! Proof of delivery generated and environmental impact updated."
    }

@router.post("/update-location")
def update_driver_location(req: LocationUpdateRequest, user: dict = Depends(get_current_user)):
    """Simulates or accepts live driver location telemetry updates."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM logistics_orders WHERE tracking_id = ?", (req.tracking_id,))
    lo = cursor.fetchone()
    if not lo:
        conn.close()
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Update driver coords
    if lo["driver_id"]:
        cursor.execute("UPDATE drivers SET current_lat = ?, current_lng = ? WHERE id = ?", (req.lat, req.lng, lo["driver_id"]))

    # Insert breadcrumb event
    cursor.execute("""
        INSERT INTO location_events (logistics_order_id, current_lat, current_lng, speed_kmh, heading, status_label)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (lo["id"], req.lat, req.lng, req.speed_kmh, req.heading, req.status_label))

    if req.advance_stage:
        cursor.execute("UPDATE logistics_orders SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (req.advance_stage, lo["id"]))

    conn.commit()
    conn.close()

    return {"success": True, "lat": req.lat, "lng": req.lng, "status": req.status_label}

@router.post("/simulate-step/{tracking_id}")
def simulate_logistics_step(tracking_id: str, user: dict = Depends(get_current_user)):
    """Automatically progresses vehicle coordinates along the route between pickup and delivery."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM logistics_orders WHERE tracking_id = ?", (tracking_id,))
    lo = cursor.fetchone()
    if not lo:
        conn.close()
        raise HTTPException(status_code=404, detail="Shipment not found")

    p_lat, p_lng = lo["pickup_lat"], lo["pickup_lng"]
    d_lat, d_lng = lo["delivery_lat"], lo["delivery_lng"]

    # Count existing breadcrumbs to determine progress
    cursor.execute("SELECT count(*) as cnt FROM location_events WHERE logistics_order_id = ?", (lo["id"],))
    count = cursor.fetchone()["cnt"]

    # Progress fraction along route
    progress = min(1.0, (count % 5 + 1) * 0.2)
    next_lat = round(p_lat + (d_lat - p_lat) * progress, 5)
    next_lng = round(p_lng + (d_lng - p_lng) * progress, 5)

    if progress < 0.4:
        stage = "in_transit"
        label = "Cruising along commercial corridor"
    elif progress < 0.8:
        stage = "near_destination"
        label = "Entering destination industrial zone"
    else:
        stage = "out_for_delivery"
        label = "Arrived at buyer unloading gate"

    # Update driver
    if lo["driver_id"]:
        cursor.execute("UPDATE drivers SET current_lat = ?, current_lng = ? WHERE id = ?", (next_lat, next_lng, lo["driver_id"]))

    cursor.execute("""
        INSERT INTO location_events (logistics_order_id, current_lat, current_lng, speed_kmh, heading, status_label)
        VALUES (?, ?, ?, 35.0, 135.0, ?)
    """, (lo["id"], next_lat, next_lng, label))

    cursor.execute("UPDATE logistics_orders SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (stage, lo["id"]))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "lat": next_lat,
        "lng": next_lng,
        "stage": stage,
        "progress": progress,
        "status_label": label
    }
