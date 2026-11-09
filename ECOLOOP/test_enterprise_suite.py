import os
import sys

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from starlette.testclient import TestClient
from app import app

client = TestClient(app)

def test_enterprise_suite():
    print("=== TESTING ENTERPRISE MODULES & REFINED ENDPOINTS ===")

    # 1. Login as Seller
    r_seller = client.post("/api/auth/demo-switch", json={"demo_role": "seller"})
    assert r_seller.status_code == 200
    seller_data = r_seller.json()
    seller_token = seller_data["token"]
    seller_hdr = {"Authorization": f"Bearer {seller_token}"}
    print(f"[PASS] Demo Seller authenticated: {seller_data['user']['business']['business_name']}")

    # 2. Test Business Profile & KYC Verification Submission
    print("\n--- 1. Testing Business Profile & KYC Submission ---")
    r_prof = client.get("/api/auth/profile", headers=seller_hdr)
    assert r_prof.status_code == 200
    p = r_prof.json()["profile"]
    assert "business_name" in p
    assert "rating" in p
    print(f"[PASS] Retrieved Business Profile: {p['business_name']} (Rating: {p['rating']}, Diverted: {p['materials_sold_kg']} kg)")

    # Submit verification document
    r_verif = client.post("/api/auth/verify-business", json={
        "document_type": "gstin",
        "document_number": "18AAACG9999F1Z9",
        "document_url": "/static/uploads/gst_cert.pdf"
    }, headers=seller_hdr)
    assert r_verif.status_code == 200
    assert r_verif.json()["success"] is True
    print(f"[PASS] Submitted KYC verification: ID #{r_verif.json()['verification_id']} status={r_verif.json()['status']}")

    # 3. Test Security Center & 2FA Toggle
    print("\n--- 2. Testing Security Center & 2FA Toggle ---")
    r_2fa = client.post("/api/auth/toggle-2fa", headers=seller_hdr)
    assert r_2fa.status_code == 200
    assert "two_factor_enabled" in r_2fa.json()
    print(f"[PASS] Toggled 2FA: Enabled={r_2fa.json()['two_factor_enabled']}")

    r_sess = client.get("/api/auth/security-sessions", headers=seller_hdr)
    assert r_sess.status_code == 200
    assert len(r_sess.json()["active_sessions"]) >= 1
    print(f"[PASS] Security sessions retrieved: {len(r_sess.json()['active_sessions'])} active session tokens.")

    # 4. Test User Conversations / Messages Inbox
    print("\n--- 3. Testing Messages & Conversations Inbox ---")
    r_convs = client.get("/api/requests/user/conversations", headers=seller_hdr)
    assert r_convs.status_code == 200
    convs = r_convs.json()["conversations"]
    print(f"[PASS] Retrieved {len(convs)} active negotiation threads for user.")
    if len(convs) > 0:
        c0 = convs[0]
        print(f"       Thread #{c0['id']} with {c0['other_party_name']} regarding '{c0['listing_title']}'")

    # 5. Test Disputes & Payment Methods
    print("\n--- 4. Testing Dispute Center & Payment Methods ---")
    r_disp = client.get("/api/orders/disputes/my", headers=seller_hdr)
    assert r_disp.status_code == 200
    print(f"[PASS] Retrieved disputes list: {len(r_disp.json()['disputes'])} cases.")

    r_pm = client.get("/api/orders/payment/methods", headers=seller_hdr)
    assert r_pm.status_code == 200
    pms = r_pm.json()["methods"]
    assert len(pms) >= 1
    print(f"[PASS] Retrieved {len(pms)} registered escrow payment/payout instruments.")

    print("\n=== ALL NEW ENTERPRISE ENDPOINTS VERIFIED & OPERATIONAL! ===")

if __name__ == "__main__":
    test_enterprise_suite()
