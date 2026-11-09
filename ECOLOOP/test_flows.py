import os
import sys

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from starlette.testclient import TestClient
from app import app

client = TestClient(app)

def test_complete_circular_flow():
    print("=== TESTING COMPLETE ECOLOOP CIRCULAR ECONOMY LIFECYCLE ===")

    # 1. Login as Buyer (PackRight)
    r = client.post("/api/auth/demo-switch", json={"demo_role": "buyer"})
    assert r.status_code == 200
    buyer_token = r.json()["token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    print("[STEP 1] Logged in as Buyer (PackRight Sustainable Packaging).")

    # 2. Login as Seller (GreenLeaf)
    r = client.post("/api/auth/demo-switch", json={"demo_role": "seller"})
    assert r.status_code == 200
    seller_token = r.json()["token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    print("[STEP 2] Logged in as Seller (GreenLeaf Restaurant).")

    # 3. Seller creates a new listing (Spent Coffee Grounds)
    new_listing_payload = {
        "title": "Industrial Spent Coffee Grounds (Batch #99)",
        "category_id": 6, # Food Waste
        "resource_type": "High Nitrogen Compostable Espresso Grounds",
        "quantity": 150.0,
        "unit": "kg",
        "condition": "Excellent",
        "price_per_unit": 5.0,
        "currency": "INR",
        "minimum_order": 25.0,
        "city": "Guwahati",
        "state": "Assam",
        "approx_latitude": 26.1445,
        "approx_longitude": 91.7362,
        "exact_address": "Dock 4, GreenLeaf Central Kitchen, Guwahati 781005",
        "exact_latitude": 26.1462,
        "exact_longitude": 91.7378,
        "pickup_available": True,
        "delivery_available": True,
        "ecoloop_logistics_available": True,
        "description": "Daily collected organic spent coffee grounds for mushroom substrate.",
        "images": ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800"]
    }
    r = client.post("/api/listings", json=new_listing_payload, headers=seller_headers)
    assert r.status_code == 200
    listing_id = r.json()["listing_id"]
    print(f"[STEP 3] Seller published listing #{listing_id}.")

    # 4. Buyer searches for the listing
    r = client.get(f"/api/listings/{listing_id}", headers=buyer_headers)
    assert r.status_code == 200
    l_detail = r.json()["listing"]
    assert l_detail["is_location_masked"] is True
    print(f"[STEP 4] Buyer discovered listing #{listing_id}. Location masked: {l_detail['exact_address']}.")

    # 5. Buyer makes a purchase request & offer
    req_payload = {
        "listing_id": listing_id,
        "requested_quantity": 100.0,
        "offer_price": 4.5,
        "delivery_preference": "ecoloop_logistics",
        "message": "We need this for compost briquetting. Can you bag it in biodegradable sacks?"
    }
    r = client.post("/api/requests", json=req_payload, headers=buyer_headers)
    assert r.status_code == 200
    req_res = r.json()
    conv_id = req_res["conversation_id"]
    pr_id = req_res["request_id"]
    print(f"[STEP 5] Purchase request #{pr_id} submitted. Negotiation room #{conv_id} initialized.")

    # 6. Seller reviews conversation and sends a Counter-Offer
    r = client.post(f"/api/requests/conversation/{conv_id}/action", json={
        "action": "counter",
        "counter_quantity": 100.0,
        "counter_price": 4.8,
        "counter_delivery": "ecoloop_logistics",
        "note": "We can provide sealed sacks at Rs 4.8/kg."
    }, headers=seller_headers)
    assert r.status_code == 200
    print("[STEP 6] Seller sent counter-offer: 100 kg @ Rs 4.8/kg.")

    # 7. Buyer accepts the counter-offer
    r = client.post(f"/api/requests/conversation/{conv_id}/action", json={
        "action": "accept"
    }, headers=buyer_headers)
    assert r.status_code == 200
    print("[STEP 7] Buyer accepted counter-offer. Deal terms locked.")

    # 8. Buyer checks out & confirms order with escrow payment
    order_payload = {
        "purchase_request_id": pr_id,
        "listing_id": listing_id,
        "quantity": 100.0,
        "unit_price": 4.8,
        "delivery_method": "ecoloop_logistics",
        "delivery_city": "Guwahati",
        "delivery_approx_area": "Beltola Industrial Hub",
        "delivery_exact_address": "Warehouse 12, Beltola-Basistha Link Rd, Guwahati 781028"
    }
    r = client.post("/api/orders/create", json=order_payload, headers=buyer_headers)
    assert r.status_code == 200
    ord_res = r.json()
    order_id = ord_res["order_id"]
    order_number = ord_res["order_number"]
    total_amount = ord_res["total_amount"]
    print(f"[STEP 8] Order #{order_number} created. Total escrow hold: Rs {total_amount}.")

    # 9. Process escrow payment
    r = client.post(f"/api/orders/{order_id}/pay", json={"payment_method": "upi", "vpa_or_card": "packright@upi"}, headers=buyer_headers)
    assert r.status_code == 200
    print(f"[STEP 9] Payment captured in escrow: {r.json()['transaction_reference']}. Logistics dispatched.")

    # 10. Logistics Partner accesses assigned job
    r = client.post("/api/auth/demo-switch", json={"demo_role": "logistics"})
    logistics_token = r.json()["token"]
    logistics_headers = {"Authorization": f"Bearer {logistics_token}"}

    r = client.get(f"/api/logistics/track/{order_number}", headers=logistics_headers)
    assert r.status_code == 200
    shipment = r.json()["shipment"]
    pickup_otp = shipment["pickup_otp"]
    delivery_otp = shipment["delivery_otp"]
    print(f"[STEP 10] Driver assigned: {shipment['driver_name']} ({shipment['vehicle_model']}). Stage: {shipment['stage']}.")
    print(f"         Pickup OTP: {pickup_otp} | Delivery OTP: {delivery_otp}")

    # 11. Driver arrives at seller dock & enters Pickup OTP
    r = client.post("/api/logistics/verify-pickup", json={"tracking_id": order_number, "pickup_otp": pickup_otp}, headers=logistics_headers)
    assert r.status_code == 200
    assert r.json()["stage"] == "in_transit"
    print("[STEP 11] Pickup OTP verified! Shipment transitioned to IN TRANSIT.")

    # 12. Driver transmits live GPS telemetry updates along route
    r = client.post("/api/logistics/update-location", json={
        "tracking_id": order_number,
        "lat": 26.1320,
        "lng": 91.7650,
        "speed_kmh": 38.0,
        "heading": 135.0,
        "status_label": "En route on GS Road bypass",
        "advance_stage": "in_transit"
    }, headers=logistics_headers)
    assert r.status_code == 200
    print("[STEP 12] Live GPS breadcrumbs recorded. Buyer can see driver moving on interactive radar.")

    # 13. Driver arrives at buyer dock & verifies Delivery OTP + digital signature
    r = client.post("/api/logistics/verify-delivery", json={
        "tracking_id": order_number,
        "delivery_otp": delivery_otp,
        "digital_signature": "SIG_DATA_URI_VERIFIED"
    }, headers=logistics_headers)
    assert r.status_code == 200
    deliv_res = r.json()
    assert deliv_res["stage"] == "delivery_confirmed"
    impact = deliv_res["impact"]
    print(f"[STEP 13] Delivery confirmed! Escrow funds released to seller.")
    print(f"         Impact: Diverted {impact['waste_diverted_tonnes']} tonnes, avoided {impact['co2_avoided_kg']} kg CO2e, saved {impact['water_saved_liters']} L water.")

    # 14. Verify Live GPS stream is automatically TERMINATED after delivery
    r = client.get(f"/api/logistics/track/{order_number}", headers=buyer_headers)
    assert r.status_code == 200
    completed_shipment = r.json()["shipment"]
    assert completed_shipment["is_tracking_active"] == 0 or completed_shipment["is_tracking_active"] is False
    print("[STEP 14] Privacy Verified: Live GPS stream automatically terminated post-delivery.")

    # 15. Verify environmental certificate generation
    r = client.get(f"/api/impact/certificate/{order_number}")
    assert r.status_code == 200
    cert = r.json()
    print(f"[STEP 15] Verifiable Environmental Certificate generated: {cert['verification_hash']}")

    print("\n=== COMPLETE USER & SYSTEM JOURNEY PASSED 100% SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_complete_circular_flow()
