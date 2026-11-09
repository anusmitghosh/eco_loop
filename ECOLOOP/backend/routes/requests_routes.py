from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import json
from database import get_db
from routes.auth_routes import get_current_user
from matching_engine import estimate_logistics_cost
from auth import log_audit, mask_phone, mask_email

router = APIRouter(prefix="/api/requests", tags=["requests"])

class PurchaseRequestCreate(BaseModel):
    listing_id: int
    requested_quantity: float
    offer_price: float
    delivery_preference: str = "ecoloop_logistics" # buyer_pickup, seller_delivery, ecoloop_logistics
    message: Optional[str] = None
    required_date: Optional[str] = None

class MessageSendRequest(BaseModel):
    content: str
    message_type: str = "text" # text, offer, counter_offer, acceptance, rejection
    metadata: Optional[dict] = None

class OfferActionRequest(BaseModel):
    action: str # accept, decline, counter
    counter_quantity: Optional[float] = None
    counter_price: Optional[float] = None
    counter_delivery: Optional[str] = None
    note: Optional[str] = None

@router.post("")
def create_purchase_request(req: PurchaseRequestCreate, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    # Fetch listing and seller details
    cursor.execute("""
        SELECT l.*, b.user_id as seller_user_id, b.business_name as seller_biz_name
        FROM listings l
        JOIN businesses b ON b.id = l.business_id
        WHERE l.id = ?
    """, (req.listing_id,))
    listing = cursor.fetchone()

    if not listing:
        conn.close()
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing["seller_user_id"] == user["id"]:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="You are currently signed in as the seller of this listing. Use the top 'Demo Persona' dropdown to switch to PackRight (Buyer) to test submitting a request."
        )

    seller_id = listing["seller_user_id"]
    buyer_id = user["id"]

    total_offer = round(req.requested_quantity * req.offer_price, 2)

    try:
        cursor.execute("""
            INSERT INTO purchase_requests (
                listing_id, buyer_id, seller_id, requested_quantity, unit,
                offer_price, total_material_offer, message, delivery_preference,
                required_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (
            req.listing_id, buyer_id, seller_id, req.requested_quantity, listing["unit"],
            req.offer_price, total_offer, req.message, req.delivery_preference, req.required_date
        ))
        request_id = cursor.lastrowid

        # Create linked conversation
        cursor.execute("""
            INSERT INTO conversations (purchase_request_id, buyer_id, seller_id)
            VALUES (?, ?, ?)
        """, (request_id, buyer_id, seller_id))
        conv_id = cursor.lastrowid

        # Insert initial offer message
        meta = {
            "requested_quantity": req.requested_quantity,
            "unit": listing["unit"],
            "offer_price": req.offer_price,
            "total_offer": total_offer,
            "delivery_preference": req.delivery_preference,
            "required_date": req.required_date
        }
        msg_content = f"Initial Purchase Request: {req.requested_quantity} {listing['unit']} @ ₹{req.offer_price}/{listing['unit']} (Total: ₹{total_offer}). Preferred logistics: {req.delivery_preference.replace('_', ' ').title()}."
        if req.message:
            msg_content += f" Note: {req.message}"

        cursor.execute("""
            INSERT INTO messages (conversation_id, sender_id, message_type, content, metadata_json, is_read)
            VALUES (?, ?, 'offer', ?, ?, 0)
        """, (conv_id, buyer_id, msg_content, json.dumps(meta)))

        # Create in-app notification for seller
        buyer_name = user.get("business_name") or user.get("full_name")
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, link_url)
            VALUES (?, 'New Purchase Request', ?, 'request', ?)
        """, (
            seller_id,
            f"Received new request from {buyer_name} for {req.requested_quantity} {listing['unit']} of {listing['title']}.",
            f"#negotiation/{conv_id}"
        ))

        conn.commit()

        log_audit(conn, buyer_id, "PURCHASE_REQUEST_SUBMITTED", "purchase_request", str(request_id), f"Request for listing #{req.listing_id}")
        conn.close()

        return {
            "success": True,
            "request_id": request_id,
            "conversation_id": conv_id,
            "message": "Purchase request and negotiation room created successfully."
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to submit request: {str(e)}")

@router.get("")
def get_user_requests(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    # If active_role is seller, get inbound requests. If buyer, get outbound requests.
    if user["active_role"] == "seller":
        cursor.execute("""
            SELECT pr.*, l.title as listing_title, l.price_per_unit as original_price,
                   bb.business_name as buyer_business_name, bb.city as buyer_city,
                   bb.is_verified as buyer_verified, bb.rating as buyer_rating,
                   c.id as conversation_id
            FROM purchase_requests pr
            JOIN listings l ON l.id = pr.listing_id
            JOIN users u ON u.id = pr.buyer_id
            LEFT JOIN businesses bb ON bb.user_id = u.id
            LEFT JOIN conversations c ON c.purchase_request_id = pr.id
            WHERE pr.seller_id = ?
            ORDER BY pr.id DESC
        """, (user["id"],))
    else:
        cursor.execute("""
            SELECT pr.*, l.title as listing_title, l.price_per_unit as original_price,
                   sb.business_name as seller_business_name, sb.city as seller_city,
                   sb.is_verified as seller_verified, sb.rating as seller_rating,
                   c.id as conversation_id
            FROM purchase_requests pr
            JOIN listings l ON l.id = pr.listing_id
            JOIN users u ON u.id = pr.seller_id
            LEFT JOIN businesses sb ON sb.user_id = u.id
            LEFT JOIN conversations c ON c.purchase_request_id = pr.id
            WHERE pr.buyer_id = ?
            ORDER BY pr.id DESC
        """, (user["id"],))

    rows = cursor.fetchall()
    conn.close()
    return {"success": True, "role": user["active_role"], "requests": [dict(r) for r in rows]}

@router.get("/conversation/{conv_id}")
def get_conversation(conv_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.*,
               pr.listing_id, pr.requested_quantity, pr.unit, pr.offer_price,
               pr.total_material_offer, pr.delivery_preference, pr.status as request_status,
               l.title as listing_title, l.price_per_unit as listing_original_price,
               l.city as listing_city, l.approx_latitude, l.approx_longitude,
               buyer_u.full_name as buyer_name, buyer_b.business_name as buyer_biz_name, buyer_b.is_verified as buyer_verified,
               seller_u.full_name as seller_name, seller_b.business_name as seller_biz_name, seller_b.is_verified as seller_verified
        FROM conversations c
        JOIN purchase_requests pr ON pr.id = c.purchase_request_id
        JOIN listings l ON l.id = pr.listing_id
        JOIN users buyer_u ON buyer_u.id = c.buyer_id
        LEFT JOIN businesses buyer_b ON buyer_b.user_id = buyer_u.id
        JOIN users seller_u ON seller_u.id = c.seller_id
        LEFT JOIN businesses seller_b ON seller_b.user_id = seller_u.id
        WHERE c.id = ?
    """, (conv_id,))
    conv = cursor.fetchone()

    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Access control
    if user["id"] not in [conv["buyer_id"], conv["seller_id"]] and user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized to view this conversation")

    # Fetch messages
    cursor.execute("""
        SELECT m.*, u.full_name as sender_name, u.role as sender_role
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ?
        ORDER BY m.id ASC
    """, (conv_id,))
    msg_rows = cursor.fetchall()

    # Mark incoming unread messages as read
    cursor.execute("""
        UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?
    """, (conv_id, user["id"]))
    conn.commit()
    conn.close()

    conv_dict = dict(conv)
    # Mask partner names if needed
    conv_dict["buyer_display"] = conv_dict["buyer_biz_name"] or conv_dict["buyer_name"]
    conv_dict["seller_display"] = conv_dict["seller_biz_name"] or conv_dict["seller_name"]

    messages = []
    for m in msg_rows:
        md = dict(m)
        if md["metadata_json"]:
            try:
                md["metadata"] = json.loads(md["metadata_json"])
            except Exception:
                md["metadata"] = {}
        messages.append(md)

    return {
        "success": True,
        "conversation": conv_dict,
        "messages": messages,
        "is_buyer": user["id"] == conv["buyer_id"],
        "is_seller": user["id"] == conv["seller_id"]
    }

@router.post("/conversation/{conv_id}/messages")
def send_message(conv_id: int, req: MessageSendRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    conv = cursor.fetchone()
    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user["id"] not in [conv["buyer_id"], conv["seller_id"]] and user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized")

    if conv["is_blocked"]:
        conn.close()
        raise HTTPException(status_code=403, detail="This conversation has been blocked.")

    other_user_id = conv["seller_id"] if user["id"] == conv["buyer_id"] else conv["buyer_id"]

    cursor.execute("""
        INSERT INTO messages (conversation_id, sender_id, message_type, content, metadata_json, is_read)
        VALUES (?, ?, ?, ?, ?, 0)
    """, (conv_id, user["id"], req.message_type, req.content, json.dumps(req.metadata) if req.metadata else None))
    msg_id = cursor.lastrowid

    cursor.execute("UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?", (conv_id,))

    # Notification for other party
    sender_name = user.get("business_name") or user.get("full_name")
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (?, 'New Negotiation Message', ?, 'offer', ?)
    """, (
        other_user_id,
        f"{sender_name}: {req.content[:60]}...",
        f"#negotiation/{conv_id}"
    ))

    conn.commit()
    conn.close()

    return {"success": True, "message_id": msg_id}

@router.post("/conversation/{conv_id}/action")
def handle_offer_action(conv_id: int, req: OfferActionRequest, user: dict = Depends(get_current_user)):
    """Handle accept, reject, or counter-offer within the negotiation."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.*, pr.id as request_id, pr.listing_id, pr.requested_quantity, pr.offer_price, pr.unit,
               l.title as listing_title
        FROM conversations c
        JOIN purchase_requests pr ON pr.id = c.purchase_request_id
        JOIN listings l ON l.id = pr.listing_id
        WHERE c.id = ?
    """, (conv_id,))
    conv = cursor.fetchone()

    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_buyer = user["id"] == conv["buyer_id"]
    is_seller = user["id"] == conv["seller_id"]

    if not (is_buyer or is_seller) and user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized")

    other_user_id = conv["seller_id"] if is_buyer else conv["buyer_id"]
    sender_name = user.get("business_name") or user.get("full_name")

    if req.action == "accept":
        # Mark request accepted
        cursor.execute("UPDATE purchase_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (conv["request_id"],))
        accept_msg = f"Offer accepted by {sender_name}! The transaction is confirmed. Ready to proceed to payment and logistics scheduling."
        cursor.execute("""
            INSERT INTO messages (conversation_id, sender_id, message_type, content, is_read)
            VALUES (?, ?, 'acceptance', ?, 0)
        """, (conv_id, user["id"], accept_msg))

        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, link_url)
            VALUES (?, 'Offer Accepted!', ?, 'offer', ?)
        """, (other_user_id, f"{sender_name} accepted your offer for {conv['listing_title']}. Proceed to checkout.", f"#checkout/{conv['request_id']}"))

    elif req.action == "decline":
        cursor.execute("UPDATE purchase_requests SET status = 'declined', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (conv["request_id"],))
        decline_msg = f"Offer declined by {sender_name}. Reason: {req.note or 'Terms not feasible'}"
        cursor.execute("""
            INSERT INTO messages (conversation_id, sender_id, message_type, content, is_read)
            VALUES (?, ?, 'rejection', ?, 0)
        """, (conv_id, user["id"], decline_msg))

        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, link_url)
            VALUES (?, 'Offer Declined', ?, 'offer', ?)
        """, (other_user_id, f"{sender_name} declined the offer for {conv['listing_title']}.", f"#negotiation/{conv_id}"))

    elif req.action == "counter":
        qty = req.counter_quantity or conv["requested_quantity"]
        price = req.counter_price or conv["offer_price"]
        delivery = req.counter_delivery or "ecoloop_logistics"
        total = round(qty * price, 2)

        # Update purchase request with counter terms
        cursor.execute("""
            UPDATE purchase_requests
            SET requested_quantity = ?, offer_price = ?, total_material_offer = ?,
                delivery_preference = ?, status = 'negotiating', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (qty, price, total, delivery, conv["request_id"]))

        counter_meta = {
            "counter_quantity": qty,
            "counter_price": price,
            "counter_delivery": delivery,
            "total_offer": total,
            "note": req.note
        }
        counter_msg = f"Counter-Offer from {sender_name}: {qty} {conv['unit']} @ ₹{price}/{conv['unit']} (Total: ₹{total}). Delivery: {delivery.replace('_', ' ').title()}."
        if req.note:
            counter_msg += f" Note: {req.note}"

        cursor.execute("""
            INSERT INTO messages (conversation_id, sender_id, message_type, content, metadata_json, is_read)
            VALUES (?, ?, 'counter_offer', ?, ?, 0)
        """, (conv_id, user["id"], counter_msg, json.dumps(counter_meta)))

        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, link_url)
            VALUES (?, 'New Counter-Offer Received', ?, 'offer', ?)
        """, (other_user_id, f"{sender_name} sent a counter-offer: ₹{price}/{conv['unit']}.", f"#negotiation/{conv_id}"))

    conn.commit()
    conn.close()

    return {"success": True, "action": req.action, "message": f"Negotiation {req.action} applied."}

@router.get("/{request_id}")
def get_request_detail(request_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT pr.*, l.title as listing_title, l.unit, l.price_per_unit as original_price,
               bb.business_name as buyer_business_name,
               sb.business_name as seller_business_name,
               c.id as conversation_id
        FROM purchase_requests pr
        JOIN listings l ON l.id = pr.listing_id
        JOIN businesses bb ON bb.user_id = pr.buyer_id
        JOIN businesses sb ON sb.user_id = pr.seller_id
        LEFT JOIN conversations c ON c.purchase_request_id = pr.id
        WHERE pr.id = ?
    """, (request_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Purchase request not found")

    rd = dict(row)
    if user["id"] not in [rd["buyer_id"], rd["seller_id"]] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    return {"success": True, "request": rd}

@router.post("/{request_id}/cancel")
def cancel_request(request_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM purchase_requests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")

    if row["buyer_id"] != user["id"] and user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Only buyer can cancel this request")

    if row["status"] in ["converted_to_order", "accepted"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot cancel an accepted or confirmed request")

    cursor.execute("UPDATE purchase_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (request_id,))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Purchase request cancelled."}

@router.get("/user/conversations")
def get_user_conversations(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.*,
               pr.listing_id, pr.requested_quantity, pr.unit, pr.offer_price, pr.total_material_offer,
               pr.status as request_status, pr.delivery_preference,
               l.title as listing_title, l.city as listing_city,
               buyer_u.full_name as buyer_name, buyer_b.business_name as buyer_biz_name, buyer_b.city as buyer_city,
               seller_u.full_name as seller_name, seller_b.business_name as seller_biz_name, seller_b.city as seller_city,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message_content,
               (SELECT message_type FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message_type,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message_time,
               (SELECT count(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_messages
        FROM conversations c
        JOIN purchase_requests pr ON pr.id = c.purchase_request_id
        JOIN listings l ON l.id = pr.listing_id
        JOIN users buyer_u ON buyer_u.id = c.buyer_id
        LEFT JOIN businesses buyer_b ON buyer_b.user_id = buyer_u.id
        JOIN users seller_u ON seller_u.id = c.seller_id
        LEFT JOIN businesses seller_b ON seller_b.user_id = seller_u.id
        WHERE c.buyer_id = ? OR c.seller_id = ?
        ORDER BY c.last_message_at DESC
    """, (user["id"], user["id"], user["id"]))

    rows = cursor.fetchall()
    conn.close()

    conversations = []
    for r in rows:
        cd = dict(r)
        is_buyer = user["id"] == cd["buyer_id"]
        cd["other_party_name"] = cd["seller_biz_name"] if is_buyer else cd["buyer_biz_name"]
        cd["other_party_city"] = cd["seller_city"] if is_buyer else cd["buyer_city"]
        cd["is_buyer"] = is_buyer
        conversations.append(cd)

    return {"success": True, "conversations": conversations}
