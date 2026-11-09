import os
import sys

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from starlette.testclient import TestClient
from app import app

client = TestClient(app)

def test_suite():
    print("--- 1. Testing Root SPA Route ---")
    r = client.get("/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert "EcoLoop" in r.text or "ECOLOOP" in r.text
    print("[PASS] Root index.html served successfully.")

    print("\n--- 2. Testing Public Marketplace & Location Masking ---")
    r = client.get("/api/listings")
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert len(data["listings"]) >= 8
    first = data["listings"][0]
    print(f"[PASS] Found {len(data['listings'])} listings.")
    print(f"[PASS] Sample: '{first['title']}' - AI Match: {first['ai_match']}% - Distance: {first['distance_km']} km")
    # Verify exact address is NOT in public listing card
    assert "exact_address" not in first or first.get("exact_address") is None
    print("[PASS] Privacy Verified: Exact address is not leaked in public marketplace cards.")

    print("\n--- 3. Testing 1-Click Demo Switcher ---")
    r = client.post("/api/auth/demo-switch", json={"demo_role": "seller"})
    assert r.status_code == 200
    seller_data = r.json()
    assert seller_data["success"] is True
    seller_token = seller_data["token"]
    print(f"[PASS] Logged in as Demo Seller: {seller_data['user']['business']['business_name']}")

    r = client.post("/api/auth/demo-switch", json={"demo_role": "buyer"})
    assert r.status_code == 200
    buyer_data = r.json()
    buyer_token = buyer_data["token"]
    print(f"[PASS] Logged in as Demo Buyer: {buyer_data['user']['business']['business_name']}")

    print("\n--- 4. Testing Live Shipment Tracking & Telemetry ---")
    # Tracking Order #EL-10284
    r = client.get("/api/logistics/track/EL-10284", headers={"Authorization": f"Bearer {buyer_token}"})
    assert r.status_code == 200
    trk_data = r.json()
    assert trk_data["success"] is True
    shipment = trk_data["shipment"]
    print(f"[PASS] Tracking ID: {shipment['tracking_id']} - Stage: {shipment['stage']}")
    print(f"[PASS] Driver: {shipment['driver_name']} - Vehicle: {shipment['vehicle_model']}")
    print(f"[PASS] Delivery OTP: {shipment.get('my_otp')}")

    print("\n--- 5. Testing Environmental Impact API ---")
    r = client.get("/api/impact/summary", headers={"Authorization": f"Bearer {buyer_token}"})
    assert r.status_code == 200
    imp_data = r.json()
    assert imp_data["success"] is True
    totals = imp_data["platform_impact"]
    print(f"[PASS] Total Landfill Diverted: {totals['total_tonnes_diverted']} tonnes")
    print(f"[PASS] Total CO2 Avoided: {totals['total_co2_avoided']} kg CO2e")
    print(f"[PASS] Trees Eqv: {totals['total_trees_equivalent']}")

    print("\n--- 6. Testing Location Privacy Controls & Audit Logs ---")
    r = client.get("/api/privacy/settings", headers={"Authorization": f"Bearer {seller_token}"})
    assert r.status_code == 200
    priv = r.json()["settings"]
    print(f"[PASS] Seller Privacy: show_city_publicly={priv['show_city_publicly']}, reveal_exact_after_confirmation={priv['reveal_exact_after_confirmation']}")

    r = client.get("/api/privacy/audit-history", headers={"Authorization": f"Bearer {seller_token}"})
    assert r.status_code == 200
    audits = r.json()["audit_events"]
    print(f"[PASS] Audit history returned {len(audits)} location/telemetry security events.")

    print("\n--- 7. Testing Admin Governance Console ---")
    r = client.post("/api/auth/demo-switch", json={"demo_role": "admin"})
    admin_token = r.json()["token"]

    r = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    metrics = r.json()["metrics"]
    print(f"[PASS] Admin Metrics: Users={metrics['total_users']}, Verified Businesses={metrics['verified_businesses']}, Active Logistics={metrics['active_logistics']}")

    print("\n=== ALL BACKEND & INTEGRATION TESTS PASSED PERFECTLY! ===")

if __name__ == "__main__":
    test_suite()
