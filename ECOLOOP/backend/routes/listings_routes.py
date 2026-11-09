from fastapi import APIRouter, HTTPException, Request, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
import json
from database import get_db
from routes.auth_routes import get_current_user, get_optional_user
from matching_engine import calculate_ai_match, haversine_distance
from auth import log_audit

router = APIRouter(prefix="/api/listings", tags=["listings"])

class ListingCreateRequest(BaseModel):
    title: str
    category_id: int
    resource_type: str
    quantity: float
    unit: str = "kg"
    condition: str
    price_per_unit: float
    currency: str = "INR"
    minimum_order: float = 1.0
    city: str
    state: str
    approx_latitude: float
    approx_longitude: float
    exact_address: str
    exact_latitude: float
    exact_longitude: float
    pickup_available: bool = True
    delivery_available: bool = True
    ecoloop_logistics_available: bool = True
    description: str
    available_from: Optional[str] = None
    available_until: Optional[str] = None
    images: List[str] = []

@router.get("")
def get_listings(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    verified_only: Optional[bool] = Query(False),
    logistics_only: Optional[bool] = Query(False),
    buyer_lat: Optional[float] = Query(26.1445), # default Guwahati region
    buyer_lng: Optional[float] = Query(91.7362),
    sort: Optional[str] = Query("match") # match, price_asc, price_desc, distance, newest
):
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT l.id, l.title, l.resource_type, l.quantity, l.unit, l.condition,
               l.price_per_unit, l.currency, l.minimum_order, l.availability_status,
               l.city, l.state, l.approx_latitude, l.approx_longitude,
               l.pickup_available, l.delivery_available, l.ecoloop_logistics_available,
               l.description, l.views_count, l.status, l.created_at,
               c.id as category_id, c.name as category_name, c.slug as category_slug,
               b.id as business_id, b.business_name, b.business_type, b.is_verified as seller_verified,
               b.rating as seller_rating, b.transactions_completed as seller_tx_count
        FROM listings l
        JOIN categories c ON c.id = l.category_id
        JOIN businesses b ON b.id = l.business_id
        WHERE l.status = 'active'
    """
    params = []

    if q:
        query += " AND (l.title LIKE ? OR l.description LIKE ? OR l.resource_type LIKE ?)"
        term = f"%{q}%"
        params.extend([term, term, term])

    if category and category != "all":
        query += " AND c.slug = ?"
        params.append(category)

    if condition and condition != "all":
        query += " AND l.condition = ?"
        params.append(condition)

    if city and city != "all":
        query += " AND l.city LIKE ?"
        params.append(f"%{city}%")

    if min_price is not None:
        query += " AND l.price_per_unit >= ?"
        params.append(min_price)

    if max_price is not None:
        query += " AND l.price_per_unit <= ?"
        params.append(max_price)

    if verified_only:
        query += " AND b.is_verified = 1"

    if logistics_only:
        query += " AND l.ecoloop_logistics_available = 1"

    cursor.execute(query, params)
    rows = cursor.fetchall()

    buyer_profile = {"lat": buyer_lat, "lng": buyer_lng}

    listings = []
    for r in rows:
        item = dict(r)
        # Fetch primary image
        cursor.execute("SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC, id ASC", (item["id"],))
        img_rows = cursor.fetchall()
        item["images"] = [img["image_url"] for img in img_rows] or ["https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop"]

        # Run AI Matching
        ai_data = calculate_ai_match(item, buyer_profile)
        item["ai_match"] = ai_data["match_percentage"]
        item["distance_km"] = ai_data["distance_km"]
        item["demand_level"] = ai_data["demand_level"]
        item["estimated_logistics_cost"] = ai_data["estimated_logistics_cost"]
        item["match_reasons"] = ai_data["reasons"]
        item["environmental_benefit"] = ai_data["environmental_benefit"]

        # ENSURE PRIVACY: DO NOT EXPOSE EXACT ADDRESS IN LISTING LIST
        # item does not have exact_address, exact_latitude, or exact_longitude in SELECT!
        listings.append(item)

    # Sort results
    if sort == "match":
        listings.sort(key=lambda x: x["ai_match"], reverse=True)
    elif sort == "price_asc":
        listings.sort(key=lambda x: x["price_per_unit"])
    elif sort == "price_desc":
        listings.sort(key=lambda x: x["price_per_unit"], reverse=True)
    elif sort == "distance":
        listings.sort(key=lambda x: x["distance_km"])
    elif sort == "newest":
        listings.sort(key=lambda x: x["id"], reverse=True)

    conn.close()
    return {"success": True, "count": len(listings), "listings": listings}

@router.get("/categories")
def get_categories():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, count(l.id) as listing_count
        FROM categories c
        LEFT JOIN listings l ON l.category_id = c.id AND l.status = 'active'
        GROUP BY c.id
        ORDER BY c.name ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return {"success": True, "categories": [dict(r) for r in rows]}

@router.get("/{listing_id}")
def get_listing_detail(listing_id: int, user: Optional[dict] = Depends(get_optional_user)):
    conn = get_db()
    cursor = conn.cursor()

    # Increment view count
    cursor.execute("UPDATE listings SET views_count = views_count + 1 WHERE id = ?", (listing_id,))
    conn.commit()

    cursor.execute("""
        SELECT l.*, c.name as category_name, c.slug as category_slug, c.co2_factor_per_kg,
               b.id as business_id, b.user_id as seller_user_id, b.business_name,
               b.business_type, b.city as seller_city, b.state as seller_state,
               b.is_verified as seller_verified, b.rating as seller_rating,
               b.total_reviews as seller_reviews, b.transactions_completed as seller_tx_count,
               b.materials_sold_kg, b.logo_url as seller_logo
        FROM listings l
        JOIN categories c ON c.id = l.category_id
        JOIN businesses b ON b.id = l.business_id
        WHERE l.id = ?
    """, (listing_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Material listing not found.")

    listing = dict(row)

    # Fetch images
    cursor.execute("SELECT image_url, is_primary FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC, id ASC", (listing_id,))
    listing["images"] = [img["image_url"] for img in cursor.fetchall()]

    # PRIVACY ENFORCEMENT:
    # A user can only see exact_address and exact coordinates if:
    # 1. They are the seller themselves
    # 2. Or they are the admin
    is_owner_or_admin = user and (user.get("id") == listing["seller_user_id"] or user.get("role") == "admin")
    if not is_owner_or_admin:
        listing["exact_address"] = "Protected by EcoLoop Privacy. Revealed upon order confirmation."
        listing["exact_latitude"] = listing["approx_latitude"]
        listing["exact_longitude"] = listing["approx_longitude"]
        listing["is_location_masked"] = True
    else:
        listing["is_location_masked"] = False

    # AI Match Engine Computation
    buyer_profile = {"lat": 26.1445, "lng": 91.7362}
    ai_data = calculate_ai_match(listing, buyer_profile)
    listing["ai_match_details"] = ai_data

    conn.close()
    return {"success": True, "listing": listing}

@router.post("")
def create_listing(req: ListingCreateRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    # Fetch business for current user
    cursor.execute("SELECT id FROM businesses WHERE user_id = ?", (user["id"],))
    biz = cursor.fetchone()
    if not biz:
        conn.close()
        raise HTTPException(status_code=400, detail="Business profile required to list waste materials.")

    biz_id = biz["id"]

    try:
        cursor.execute("""
            INSERT INTO listings (
                business_id, title, category_id, resource_type, quantity, unit,
                condition, price_per_unit, currency, minimum_order, city, state,
                approx_latitude, approx_longitude, exact_address, exact_latitude, exact_longitude,
                pickup_available, delivery_available, ecoloop_logistics_available,
                description, available_from, available_until, status
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active'
            )
        """, (
            biz_id, req.title, req.category_id, req.resource_type, req.quantity, req.unit,
            req.condition, req.price_per_unit, req.currency, req.minimum_order, req.city, req.state,
            req.approx_latitude, req.approx_longitude, req.exact_address, req.exact_latitude, req.exact_longitude,
            1 if req.pickup_available else 0, 1 if req.delivery_available else 0, 1 if req.ecoloop_logistics_available else 0,
            req.description, req.available_from, req.available_until
        ))
        listing_id = cursor.lastrowid

        # Insert images
        images = req.images if req.images else ["https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop"]
        for idx, img_url in enumerate(images):
            cursor.execute("""
                INSERT INTO listing_images (listing_id, image_url, is_primary)
                VALUES (?, ?, ?)
            """, (listing_id, img_url, 1 if idx == 0 else 0))

        conn.commit()

        log_audit(conn, user["id"], "LISTING_CREATED", "listing", str(listing_id), f"Created material listing: {req.title}")
        conn.close()

        return {
            "success": True,
            "listing_id": listing_id,
            "message": "Listing published successfully with privacy-protected approximate location."
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to create listing: {str(e)}")

class ListingUpdateRequest(BaseModel):
    title: Optional[str] = None
    quantity: Optional[float] = None
    price_per_unit: Optional[float] = None
    minimum_order: Optional[float] = None
    condition: Optional[str] = None
    status: Optional[str] = None # active, reserved, sold, archived
    description: Optional[str] = None

@router.get("/user/my")
def get_my_listings(user: dict = Depends(get_current_user)):
    """Fetch all listings owned by the authenticated business with inquiries count."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT l.*, c.name as category_name,
               (SELECT count(*) FROM purchase_requests pr WHERE pr.listing_id = l.id) as inquiries_count
        FROM listings l
        JOIN categories c ON c.id = l.category_id
        WHERE l.business_id = (SELECT id FROM businesses WHERE user_id = ?)
        ORDER BY l.id DESC
    """, (user["id"],))
    rows = cursor.fetchall()

    result = []
    for r in rows:
        item = dict(r)
        cursor.execute("SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC LIMIT 1", (item["id"],))
        img = cursor.fetchone()
        item["image"] = img["image_url"] if img else "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800"
        result.append(item)

    conn.close()
    return {"success": True, "count": len(result), "listings": result}

@router.put("/{listing_id}")
def update_listing(listing_id: int, req: ListingUpdateRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT l.*, b.user_id as owner_id
        FROM listings l
        JOIN businesses b ON b.id = l.business_id
        WHERE l.id = ?
    """, (listing_id,))
    listing = cursor.fetchone()

    if not listing:
        conn.close()
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing["owner_id"] != user["id"] and user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized to modify this listing")

    updates = []
    params = []
    if req.title is not None:
        updates.append("title = ?")
        params.append(req.title)
    if req.quantity is not None:
        updates.append("quantity = ?")
        params.append(req.quantity)
    if req.price_per_unit is not None:
        updates.append("price_per_unit = ?")
        params.append(req.price_per_unit)
    if req.minimum_order is not None:
        updates.append("minimum_order = ?")
        params.append(req.minimum_order)
    if req.condition is not None:
        updates.append("condition = ?")
        params.append(req.condition)
    if req.status is not None:
        updates.append("status = ?")
        params.append(req.status)
    if req.description is not None:
        updates.append("description = ?")
        params.append(req.description)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        query = f"UPDATE listings SET {', '.join(updates)} WHERE id = ?"
        params.append(listing_id)
        cursor.execute(query, params)
        conn.commit()
        log_audit(conn, user["id"], "LISTING_UPDATED", "listing", str(listing_id), "Updated listing details")

    conn.close()
    return {"success": True, "message": "Listing updated successfully."}

@router.delete("/{listing_id}")
def delete_listing(listing_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT l.*, b.user_id as owner_id
        FROM listings l
        JOIN businesses b ON b.id = l.business_id
        WHERE l.id = ?
    """, (listing_id,))
    listing = cursor.fetchone()

    if not listing:
        conn.close()
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing["owner_id"] != user["id"] and user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized to delete this listing")

    # Soft delete / archive
    cursor.execute("UPDATE listings SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (listing_id,))
    conn.commit()
    log_audit(conn, user["id"], "LISTING_ARCHIVED", "listing", str(listing_id), "Listing moved to archived state")
    conn.close()

    return {"success": True, "message": "Listing archived successfully."}
