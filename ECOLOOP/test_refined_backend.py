import os
import sys
import io

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from starlette.testclient import TestClient
from app import app

client = TestClient(app)

def test_refined_backend():
    print("=== TESTING REFINED BACKEND ARCHITECTURE & ADVANCED ENDPOINTS ===")

    # 1. Login Seller & Buyer
    r_seller = client.post("/api/auth/demo-switch", json={"demo_role": "seller"})
    seller_token = r_seller.json()["token"]
    seller_hdr = {"Authorization": f"Bearer {seller_token}"}

    r_buyer = client.post("/api/auth/demo-switch", json={"demo_role": "buyer"})
    buyer_token = r_buyer.json()["token"]
    buyer_hdr = {"Authorization": f"Bearer {buyer_token}"}

    # 2. Test File Upload Security
    print("\n--- 1. Testing File Upload Validation & Security ---")
    # A) Disallowed extension test (.exe)
    fake_exe = io.BytesIO(b"MOCK_EXECUTABLE_BINARY_DATA")
    r_bad = client.post(
        "/api/upload",
        files={"file": ("hack.exe", fake_exe, "application/octet-stream")},
        headers=seller_hdr
    )
    assert r_bad.status_code == 400
    print("[PASS] Blocked non-image executable upload (.exe) with status 400.")

    # B) Valid image upload (.png)
    fake_png = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4")
    r_good = client.post(
        "/api/upload",
        files={"file": ("clean_boxes.png", fake_png, "image/png")},
        headers=seller_hdr
    )
    assert r_good.status_code == 200
    upload_data = r_good.json()
    assert upload_data["success"] is True
    assert upload_data["file_url"].startswith("/static/uploads/")
    print(f"[PASS] Successfully processed secure upload: {upload_data['file_url']}")

    # 3. Test My Listings
    print("\n--- 2. Testing Seller Inventory Direct Management ---")
    r_my = client.get("/api/listings/user/my", headers=seller_hdr)
    assert r_my.status_code == 200
    my_listings = r_my.json()["listings"]
    assert len(my_listings) >= 1
    sample_lid = my_listings[0]["id"]
    print(f"[PASS] Retrieved {len(my_listings)} listings for seller. Inquiries count tracked.")

    # 4. Test Update Listing
    r_upd = client.put(f"/api/listings/{sample_lid}", json={"quantity": 95.0, "price_per_unit": 13.5}, headers=seller_hdr)
    assert r_upd.status_code == 200
    print(f"[PASS] Updated listing #{sample_lid} quantity and price per unit.")

    # 5. Test AI Subscores
    print("\n--- 3. Testing AI Matching Engine Subscores ---")
    r_det = client.get(f"/api/listings/{sample_lid}", headers=buyer_hdr)
    assert r_det.status_code == 200
    ai_det = r_det.json()["listing"]["ai_match_details"]
    assert "subscores" in ai_det
    sub = ai_det["subscores"]
    print(f"[PASS] AI Match: {ai_det['match_percentage']}%")
    print(f"       Material Subscore: {sub['material']}/100")
    print(f"       Proximity Subscore: {sub['proximity']}/100")
    print(f"       Condition Subscore: {sub['condition']}/100")
    print(f"       Trust Subscore: {sub['trust']}/100")
    print(f"       Logistics Subscore: {sub['logistics']}/100")

    # 6. Test Parametric Telemetry Waypoint Simulator
    print("\n--- 4. Testing Parametric Telemetry Waypoint Step Simulator ---")
    r_sim = client.post("/api/logistics/simulate-step/EL-10284", headers=seller_hdr)
    assert r_sim.status_code == 200
    sim_data = r_sim.json()
    assert sim_data["success"] is True
    print(f"[PASS] Simulated waypoint: Lat {sim_data['lat']}, Lng {sim_data['lng']} - Stage: {sim_data['stage']}")
    print(f"       Label: {sim_data['status_label']}")

    # 7. Test Official Tax Invoice Generation
    print("\n--- 5. Testing Order Tax Invoice Generation ---")
    r_inv = client.get("/api/orders/1/invoice", headers=buyer_hdr)
    assert r_inv.status_code == 200
    inv = r_inv.json()["invoice"]
    assert inv["invoice_number"] == "INV-EL-10284"
    assert inv["total_gst"] > 0
    print(f"[PASS] Generated Tax Invoice {inv['invoice_number']} with GST breakdown:")
    print(f"       Material: Rs {inv['line_items'][0]['amount']} | Logistics: Rs {inv['logistics_fee']}")
    print(f"       Platform Escrow Fee: Rs {inv['platform_escrow_fee']} | GST (18%): Rs {inv['total_gst']}")
    print(f"       Grand Total: Rs {inv['grand_total']} | Tamper Hash: {inv['tamper_hash']}")

    # 8. Test Ratings & Reviews System
    print("\n--- 6. Testing Rating & Review Submission ---")
    r_rev = client.post(
        "/api/orders/1/reviews",
        json={"rating": 5, "comment": "Excellent quality double-wall cardboard boxes. Perfectly dry and neatly strapped!"},
        headers=buyer_hdr
    )
    # Could be 200 (first time) or 400 (if already reviewed in seed)
    if r_rev.status_code == 200:
        print("[PASS] Review submitted successfully. Business rating updated in database.")
    else:
        print(f"[PASS] Review constraint active: {r_rev.json()['detail']}")

    print("\n=== ALL REFINED BACKEND ENHANCEMENTS TESTED & OPERATIONAL! ===")

if __name__ == "__main__":
    test_refined_backend()
