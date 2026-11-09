from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import secrets
import json
from database import get_db
from routes.auth_routes import get_current_user
from matching_engine import estimate_logistics_cost, haversine_distance, calculate_environmental_impact
from auth import log_audit, generate_otp

router = APIRouter(prefix="/api/orders", tags=["orders"])

class OrderCreateRequest(BaseModel):
    purchase_request_id: Optional[int] = None
    listing_id: int
    quantity: float
    unit_price: float
    delivery_method: str = "ecoloop_logistics" # buyer_pickup, seller_delivery, ecoloop_logistics
    delivery_city: Optional[str] = None
    delivery_approx_area: Optional[str] = None
    delivery_exact_address: Optional[str] = None
    delivery_lat: Optional[float] = 26.1150
    delivery_lng: Optional[float] = 91.7920

class PaymentProcessRequest(BaseModel):
    payment_method: str # upi, card, netbanking, bank_transfer
    vpa_or_card: Optional[str] = None

class DisputeCreateRequest(BaseModel):
    reason: str
    description: str
    evidence_urls: Optional[str] = None

@router.post("/create")
def create_order(req: OrderCreateRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT l.*, b.id as seller_biz_id, b.user_id as seller_user_id, b.business_name as seller_biz_name
        FROM listings l
        JOIN businesses b ON b.id = l.business_id
        WHERE l.id = ?
    """, (req.listing_id,))
    listing = cursor.fetchone()

    if not listing:
        conn.close()
        raise HTTPException(status_code=404, detail="Listing not found")

    listing_dict = dict(listing)
    seller_id = listing_dict["seller_user_id"]
    buyer_id = user["id"]

    if seller_id == buyer_id:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot order your own listing")

    # Generate Order Number e.g. EL-10284
    random_num = secrets.randbelow(90000) + 10000
    order_number = f"EL-{random_num}"

    material_amount = round(req.quantity * req.unit_price, 2)
    platform_fee = max(30.0, round(material_amount * 0.05, 2))

    # Logistics fee calculation
    distance = haversine_distance(listing_dict["approx_latitude"], listing_dict["approx_longitude"], req.delivery_lat or 26.1150, req.delivery_lng or 91.7920)
    if req.delivery_method == "ecoloop_logistics":
        logistics_calc = estimate_logistics_cost(distance, req.quantity, listing_dict.get("category_slug", "general"))
        logistics_fee = logistics_calc["estimated_cost"]
    else:
        logistics_fee = 0.0

    total_amount = material_amount + platform_fee + logistics_fee

    pickup_otp = generate_otp()
    delivery_otp = generate_otp()

    try:
        cursor.execute("""
            INSERT INTO orders (
                order_number, purchase_request_id, listing_id, buyer_id, seller_id,
                quantity, unit, unit_price, material_amount, platform_fee, logistics_fee,
                total_amount, delivery_method, payment_status, order_status,
                pickup_otp, delivery_otp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'confirmed', ?, ?)
        """, (
            order_number, req.purchase_request_id, req.listing_id, buyer_id, seller_id,
            req.quantity, listing["unit"], req.unit_price, material_amount, platform_fee,
            logistics_fee, total_amount, req.delivery_method, pickup_otp, delivery_otp
        ))
        order_id = cursor.lastrowid

        # If purchase_request_id was provided, update it to converted_to_order
        if req.purchase_request_id:
            cursor.execute("UPDATE purchase_requests SET status = 'converted_to_order' WHERE id = ?", (req.purchase_request_id,))

        conn.commit()
        log_audit(conn, buyer_id, "ORDER_CREATED", "order", order_number, f"Order #{order_number} created, total ₹{total_amount}")
        conn.close()

        return {
            "success": True,
            "order_id": order_id,
            "order_number": order_number,
            "total_amount": total_amount,
            "material_amount": material_amount,
            "platform_fee": platform_fee,
            "logistics_fee": logistics_fee
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@router.get("")
def get_orders(
    status: Optional[str] = "all", # all, active, in_transit, completed, cancelled, disputed
    user: dict = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()

    is_admin = user["role"] == "admin"
    is_logistics = user["active_role"] == "logistics"

    query = """
        SELECT o.*, l.title as listing_title, l.city as listing_city,
               bb.business_name as buyer_business_name,
               sb.business_name as seller_business_name,
               lo.tracking_id, lo.stage as logistics_stage, lo.estimated_duration_mins,
               lo.is_tracking_active, d.name as driver_name, d.masked_phone as driver_phone
        FROM orders o
        JOIN listings l ON l.id = o.listing_id
        LEFT JOIN businesses bb ON bb.user_id = o.buyer_id
        LEFT JOIN businesses sb ON sb.user_id = o.seller_id
        LEFT JOIN logistics_orders lo ON lo.order_id = o.id
        LEFT JOIN drivers d ON d.id = lo.driver_id
        WHERE 1=1
    """
    params = []

    if not is_admin and not is_logistics:
        if user["active_role"] == "seller":
            query += " AND o.seller_id = ?"
            params.append(user["id"])
        else:
            query += " AND o.buyer_id = ?"
            params.append(user["id"])

    if status == "active":
        query += " AND o.order_status IN ('confirmed', 'processing', 'in_transit')"
    elif status == "in_transit":
        query += " AND (o.order_status = 'in_transit' OR lo.stage IN ('driver_arriving', 'picked_up', 'in_transit', 'near_destination', 'out_for_delivery'))"
    elif status == "completed":
        query += " AND o.order_status IN ('delivered', 'completed')"
    elif status == "disputed":
        query += " AND o.order_status = 'disputed'"
    elif status == "cancelled":
        query += " AND o.order_status = 'cancelled'"

    query += " ORDER BY o.id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    orders = []
    for r in rows:
        od = dict(r)
        # Privacy guard on OTPs:
        # Buyer sees delivery_otp, Seller sees pickup_otp
        if user["id"] == od["buyer_id"]:
            od["my_otp"] = od["delivery_otp"]
            od["otp_label"] = "Delivery OTP (give to driver upon arrival)"
        elif user["id"] == od["seller_id"]:
            od["my_otp"] = od["pickup_otp"]
            od["otp_label"] = "Pickup OTP (give to driver upon pickup)"
        elif is_admin:
            od["my_otp"] = f"P:{od['pickup_otp']} / D:{od['delivery_otp']}"
            od["otp_label"] = "Admin OTP Inspect"
        else:
            od["my_otp"] = None
            od["otp_label"] = None

        orders.append(od)

    return {"success": True, "orders": orders}

@router.get("/{order_id}")
def get_order_detail(order_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.*, l.title as listing_title, l.city as listing_city, l.state as listing_state,
               l.approx_latitude, l.approx_longitude, l.exact_address as seller_exact_address,
               l.exact_latitude as seller_exact_lat, l.exact_longitude as seller_exact_lng,
               bb.business_name as buyer_business_name, bb.city as buyer_city,
               sb.business_name as seller_business_name, sb.city as seller_city,
               lo.id as logistics_order_id, lo.tracking_id, lo.stage as logistics_stage,
               lo.pickup_city, lo.pickup_approx_area, lo.pickup_exact_address,
               lo.delivery_city, lo.delivery_approx_area, lo.delivery_exact_address,
               lo.estimated_distance_km, lo.estimated_duration_mins, lo.is_tracking_active,
               d.name as driver_name, d.masked_phone as driver_phone, d.vehicle_model, d.license_plate
        FROM orders o
        JOIN listings l ON l.id = o.listing_id
        LEFT JOIN businesses bb ON bb.user_id = o.buyer_id
        LEFT JOIN businesses sb ON sb.user_id = o.seller_id
        LEFT JOIN logistics_orders lo ON lo.order_id = o.id
        LEFT JOIN drivers d ON d.id = lo.driver_id
        WHERE o.id = ?
    """, (order_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    order = dict(row)

    # RBAC verification
    is_buyer = user["id"] == order["buyer_id"]
    is_seller = user["id"] == order["seller_id"]
    is_admin = user["role"] == "admin"
    is_logistics = user["active_role"] == "logistics"

    if not (is_buyer or is_seller or is_admin or is_logistics):
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized to view this order")

    # Fetch Payment history
    cursor.execute("SELECT * FROM payments WHERE order_id = ?", (order_id,))
    order["payments"] = [dict(p) for p in cursor.fetchall()]

    # Fetch Dispute if any
    cursor.execute("SELECT * FROM disputes WHERE order_id = ?", (order_id,))
    disp = cursor.fetchone()
    order["dispute"] = dict(disp) if disp else None

    # Fetch Delivery Proof if any
    cursor.execute("SELECT * FROM delivery_proofs WHERE order_id = ?", (order_id,))
    proof = cursor.fetchone()
    order["delivery_proof"] = dict(proof) if proof else None

    # LOCATION PRIVACY ENFORCEMENT:
    # Before payment/confirmation, exact coordinates are hidden.
    # Buyer only sees seller exact address AFTER confirmation and only if needed.
    # Seller NEVER sees buyer exact home/facility address (sees approximate delivery area),
    # unless seller is doing self-delivery.
    # Only Driver, Admin, and Buyer see exact delivery address.
    if is_seller and order["delivery_method"] == "ecoloop_logistics":
        order["delivery_exact_address"] = f"{order['delivery_approx_area']}, {order['delivery_city']} (Protected: Handled by EcoLoop Logistics)"

    if not (is_buyer or is_seller or is_admin or is_logistics):
        order["pickup_exact_address"] = "Protected"
        order["delivery_exact_address"] = "Protected"

    # Log location access audit if exact address was provided
    if is_logistics or is_buyer:
        log_audit(conn, user["id"], "LOCATION_COORDINATES_ACCESSED", "order", order["order_number"], "Authorized delivery route access")

    conn.close()
    return {"success": True, "order": order}

@router.post("/{order_id}/pay")
def process_payment(order_id: int, req: PaymentProcessRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    if user["id"] != order["buyer_id"] and user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Only buyer can pay for this order")

    if order["payment_status"] == "paid":
        conn.close()
        return {"success": True, "message": "Order is already paid"}

    # Generate transaction reference
    tx_ref = f"PAY-EL-{secrets.randbelow(90000) + 10000}"

    try:
        # Record payment
        cursor.execute("""
            INSERT INTO payments (order_id, transaction_reference, payment_method, amount, fee, status, gateway_response_json)
            VALUES (?, ?, ?, ?, ?, 'paid', ?)
        """, (order_id, tx_ref, req.payment_method, order["total_amount"], order["platform_fee"], json.dumps({"vpa": req.vpa_or_card or "business@upi", "status": "captured"})))

        # Update order status
        new_status = "in_transit" if order["delivery_method"] == "ecoloop_logistics" else "processing"
        cursor.execute("UPDATE orders SET payment_status = 'paid', order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, order_id))

        # If EcoLoop Logistics, ensure logistics_orders entry exists and assign driver
        if order["delivery_method"] == "ecoloop_logistics":
            cursor.execute("SELECT id FROM logistics_orders WHERE order_id = ?", (order_id,))
            existing_lo = cursor.fetchone()

            if not existing_lo:
                # Fetch seller business address
                cursor.execute("""
                    SELECT l.exact_address, l.city, l.state, l.exact_latitude, l.exact_longitude,
                           sb.business_name
                    FROM listings l
                    JOIN businesses sb ON sb.id = l.business_id
                    WHERE l.id = ?
                """, (order["listing_id"],))
                sinfo = cursor.fetchone()

                # Fetch available driver
                cursor.execute("SELECT d.id, d.partner_id FROM drivers d LIMIT 1")
                driver = cursor.fetchone()

                cursor.execute("""
                    INSERT INTO logistics_orders (
                        order_id, tracking_id, partner_id, driver_id, pickup_contact_name,
                        pickup_city, pickup_approx_area, pickup_exact_address, pickup_lat, pickup_lng,
                        delivery_city, delivery_approx_area, delivery_exact_address, delivery_lat, delivery_lng,
                        stage, estimated_distance_km, estimated_duration_mins, estimated_cost, is_tracking_active
                    ) VALUES (
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        'Guwahati', 'Beltola Industrial Hub', 'Warehouse 12, Beltola-Basistha Link Rd, Guwahati', 26.1150, 91.7920,
                        'logistics_assigned', 6.8, 18, ?, 1
                    )
                """, (
                    order_id, order["order_number"], driver["partner_id"], driver["id"], sinfo["business_name"],
                    sinfo["city"], "Central Sector", sinfo["exact_address"], sinfo["exact_latitude"], sinfo["exact_longitude"],
                    order["logistics_fee"]
                ))
                lo_id = cursor.lastrowid

                # Create tracking session
                cursor.execute("INSERT INTO tracking_sessions (logistics_order_id, is_active) VALUES (?, 1)", (lo_id,))

        # Notify Seller
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, link_url)
            VALUES (?, 'Payment Received!', ?, 'payment', ?)
        """, (order["seller_id"], f"Buyer paid ₹{order['total_amount']} for Order #{order['order_number']}.", f"#orders/{order_id}"))

        conn.commit()
        log_audit(conn, user["id"], "PAYMENT_PROCESSED", "payment", tx_ref, f"Paid ₹{order['total_amount']} via {req.payment_method}")
        conn.close()

        return {
            "success": True,
            "transaction_reference": tx_ref,
            "order_number": order["order_number"],
            "amount": order["total_amount"],
            "message": "Payment verified and held in EcoLoop escrow. Logistics dispatched!"
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")

@router.post("/{order_id}/dispute")
def open_dispute(order_id: int, req: DisputeCreateRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    is_buyer = user["id"] == order["buyer_id"]
    is_seller = user["id"] == order["seller_id"]
    if not (is_buyer or is_seller):
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized")

    against_id = order["seller_id"] if is_buyer else order["buyer_id"]

    cursor.execute("""
        INSERT INTO disputes (order_id, raised_by_id, against_id, reason, description, evidence_urls, status)
        VALUES (?, ?, ?, ?, ?, ?, 'open')
    """, (order_id, user["id"], against_id, req.reason, req.description, req.evidence_urls))
    dispute_id = cursor.lastrowid

    cursor.execute("UPDATE orders SET order_status = 'disputed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (order_id,))

    # Notify admin and counterparty
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'Dispute Opened', ?, 'alert', ?)
    """, (against_id, f"A dispute was opened for Order #{order['order_number']}: {req.reason}", f"#orders/{order_id}"))

    conn.commit()
    log_audit(conn, user["id"], "DISPUTE_OPENED", "dispute", str(dispute_id), f"Dispute on order #{order['order_number']}: {req.reason}")
    conn.close()

    return {"success": True, "dispute_id": dispute_id, "message": "Dispute lodged with EcoLoop Trust & Security. An admin will review."}

class ReviewCreateRequest(BaseModel):
    rating: int # 1 to 5
    comment: Optional[str] = None

@router.post("/{order_id}/reviews")
def submit_review(order_id: int, req: ReviewCreateRequest, user: dict = Depends(get_current_user)):
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    is_buyer = user["id"] == order["buyer_id"]
    is_seller = user["id"] == order["seller_id"]
    if not (is_buyer or is_seller):
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized")

    reviewee_id = order["seller_id"] if is_buyer else order["buyer_id"]
    role_str = "buyer_to_seller" if is_buyer else "seller_to_buyer"

    # Check if already reviewed
    cursor.execute("SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?", (order_id, user["id"]))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="You have already submitted a review for this transaction.")

    cursor.execute("""
        INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, comment, role)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (order_id, user["id"], reviewee_id, req.rating, req.comment, role_str))

    # Recalculate average rating
    cursor.execute("SELECT AVG(rating) as avg_rating, count(*) as count_reviews FROM reviews WHERE reviewee_id = ?", (reviewee_id,))
    stat = cursor.fetchone()
    avg_r = round(stat["avg_rating"], 1) if stat["avg_rating"] else 5.0
    cnt_r = stat["count_reviews"]

    cursor.execute("UPDATE businesses SET rating = ?, total_reviews = ? WHERE user_id = ?", (avg_r, cnt_r, reviewee_id))

    conn.commit()
    log_audit(conn, user["id"], "REVIEW_SUBMITTED", "order", str(order_id), f"Rated {req.rating} stars for user #{reviewee_id}")
    conn.close()

    return {"success": True, "message": "Rating submitted! Business trust score updated."}

@router.get("/{order_id}/invoice")
def get_order_invoice(order_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.*, l.title as listing_title, l.unit,
               bb.business_name as buyer_biz_name, bb.gstin as buyer_gstin, bb.city as buyer_city, bb.state as buyer_state,
               sb.business_name as seller_biz_name, sb.gstin as seller_gstin, sb.city as seller_city, sb.state as seller_state,
               p.transaction_reference, p.payment_method, p.paid_at
        FROM orders o
        JOIN listings l ON l.id = o.listing_id
        JOIN businesses bb ON bb.user_id = o.buyer_id
        JOIN businesses sb ON sb.user_id = o.seller_id
        LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.id = ?
    """, (order_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Order not found")

    o = dict(row)
    if user["id"] not in [o["buyer_id"], o["seller_id"]] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to view this invoice")

    cgst = round(o["platform_fee"] * 0.09, 2)
    sgst = round(o["platform_fee"] * 0.09, 2)
    total_tax = round(cgst + sgst, 2)

    return {
        "success": True,
        "invoice": {
            "invoice_number": f"INV-{o['order_number']}",
            "order_number": o["order_number"],
            "date": o["created_at"],
            "seller": {
                "name": o["seller_biz_name"],
                "gstin": o["seller_gstin"] or "18AABCG1234H1Z5",
                "location": f"{o['seller_city']}, {o['seller_state']}"
            },
            "buyer": {
                "name": o["buyer_biz_name"],
                "gstin": o["buyer_gstin"] or "19AAACP5678P1Z3",
                "location": f"{o['buyer_city']}, {o['buyer_state']}"
            },
            "line_items": [
                {
                    "description": o["listing_title"],
                    "quantity": o["quantity"],
                    "unit": o["unit"],
                    "rate": o["unit_price"],
                    "amount": o["material_amount"]
                }
            ],
            "logistics_fee": o["logistics_fee"],
            "platform_escrow_fee": o["platform_fee"],
            "cgst_9pct": cgst,
            "sgst_9pct": sgst,
            "total_gst": total_tax,
            "grand_total": round(o["total_amount"] + total_tax, 2),
            "payment_reference": o["transaction_reference"] or "PENDING",
            "payment_method": o["payment_method"] or "UPI Escrow",
            "status": o["payment_status"],
            "tamper_hash": f"INV-AUTH-{o['order_number']}-CERTIFIED"
        }
    }

@router.post("/{order_id}/cancel")
def cancel_order(order_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    if user["id"] not in [order["buyer_id"], order["seller_id"]] and user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized")

    if order["order_status"] in ["picked_up", "in_transit", "delivered", "completed"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot cancel an order that is already picked up or in transit.")

    cursor.execute("UPDATE orders SET order_status = 'cancelled', payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (order_id,))
    cursor.execute("UPDATE logistics_orders SET is_tracking_active = 0, stage = 'cancelled' WHERE order_id = ?", (order_id,))

    conn.commit()
    log_audit(conn, user["id"], "ORDER_CANCELLED", "order", str(order_id), "Order cancelled and escrow refund queued")
    conn.close()

    return {"success": True, "message": "Order cancelled successfully. Escrow funds refunded."}

@router.get("/disputes/my")
def get_my_disputes(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT d.*, o.order_number, o.total_amount, l.title as listing_title,
               ru.full_name as raised_by_name, au.full_name as against_name,
               rb.business_name as raised_by_biz, ab.business_name as against_biz
        FROM disputes d
        JOIN orders o ON o.id = d.order_id
        JOIN listings l ON l.id = o.listing_id
        JOIN users ru ON ru.id = d.raised_by_id
        LEFT JOIN businesses rb ON rb.user_id = ru.id
        JOIN users au ON au.id = d.against_id
        LEFT JOIN businesses ab ON ab.user_id = au.id
        WHERE d.raised_by_id = ? OR d.against_id = ?
        ORDER BY d.id DESC
    """, (user["id"], user["id"]))

    rows = cursor.fetchall()
    conn.close()

    disputes = []
    for r in rows:
        dd = dict(r)
        dd["is_raised_by_me"] = dd["raised_by_id"] == user["id"]
        disputes.append(dd)

    return {"success": True, "disputes": disputes}

@router.get("/payment/methods")
def get_payment_methods(user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "methods": [
            {
                "id": "pm_upi_1",
                "type": "upi",
                "title": "Business UPI Auto-Collect",
                "vpa": f"{user['email'].split('@')[0]}@okhdfcbank",
                "is_default": True
            },
            {
                "id": "pm_bank_1",
                "type": "bank_transfer",
                "title": "Current Bank Account (RTGS/NEFT)",
                "account_masked": "HDFC Bank •••• 9104",
                "ifsc": "HDFC0001892",
                "is_default": False
            },
            {
                "id": "pm_card_1",
                "type": "card",
                "title": "Corporate Purchasing Card",
                "card_masked": "Visa Corporate •••• 4242",
                "expiry": "09/28",
                "is_default": False
            }
        ]
    }
