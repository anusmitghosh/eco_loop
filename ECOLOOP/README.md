# ECOLOOP
## "Turning Leftovers Into Leverages"
### Production-Ready B2B Circular Economy Marketplace

EcoLoop connects industrial and commercial enterprises across India to list unused waste, recyclable materials, by-products, packaging materials, and surplus assets, while enabling other businesses to discover, negotiate, procure, and reuse those resources with AI compatibility scoring, escrow payments, and verified EV green logistics.

---

## 🌟 Key Architectural Pillars

1. **Circular Economy Resource Categories**:
   - Paper & Corrugated Cardboard
   - Plastics & Polymers (HDPE, PET, LDPE, PP)
   - Ferrous & Non-Ferrous Scrap Metals (Aluminum, Copper, Mild Steel)
   - Wood Pallets & Timber Offcuts
   - Spent Arabica Coffee Grounds & Organic Food Waste
   - Industrial Scrap & Rubber Trims
   - Office Furniture & Workstation Pods
   - Commercial Equipment & Storage Shelving
   - Packaging Films & Air Cushion Buffers
   - Textiles & Garment Trims

2. **Unified Enterprise Personas (with Seamless 1-Click Role Switching)**:
   - **Seller Persona**: *GreenLeaf Restaurant & Hospitality (Guwahati, Assam)*
   - **Buyer Persona**: *PackRight Sustainable Packaging Ltd (Kolkata & Guwahati Hub)*
   - **Dual Buyer + Seller Persona**: *EcoBiz Solutions Northeast (Guwahati, Assam)*
   - **Logistics Fleet Persona**: *EcoLoop Green Fleet Logistics (Tata Ace EV & 3W Cargo)*
   - **Platform Admin Persona**: *EcoLoop Governance & Trust Security Operations*

3. **Privacy-by-Default Location Architecture**:
   - Public marketplace cards only display municipality and approximate area (e.g., Guwahati, Assam ~5 km radius).
   - Exact warehouse dock coordinates remain encrypted in SQLite and are unlocked exclusively to authorized logistics drivers after escrow payment confirmation.
   - Live GPS tracking automatically terminates immediately upon delivery verification.

4. **Multi-Factor AI Matching Engine**:
   - Calculates real-time enterprise compatibility (e.g. 98% Match) using material grade, quantity thresholds, condition suitability, Haversine geographic distance, freight feasibility, and verified seller trust indices.
   - Provides transparent, explainable bullet-point justifications for every score.

5. **Integrated Green Logistics & Live Radar Tracking**:
   - Unique tracking numbers (e.g. `#EL-10284`).
   - 10 distinct milestone stages: `order_confirmed` → `logistics_assigned` → `pickup_scheduled` → `driver_arriving` → `picked_up` → `in_transit` → `near_destination` → `out_for_delivery` → `delivered` → `delivery_confirmed`.
   - Interactive Leaflet map with animated driver vehicle, route polyline, pulsating radar status, and telemetry updates.
   - Dual OTP Verification: Seller Pickup OTP + Buyer Delivery OTP with digital signature capture.

6. **Environmental Impact Tracker & Certificate Generator**:
   - Calculates diverted waste (tonnes), avoided CO2 emissions (kg CO2e), conserved process water (liters), and equivalent tree absorption using EPA WARM v15 and WRAP circular conversion metrics.
   - Generates verifiable circular economy impact certificates.

---

## 🚀 Running the Application

### 1. Start the Server
```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
or run:
```bash
python app.py
```

### 2. Access the Application
Open your web browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 🔑 Default Credentials & 1-Click Demo Personas

You can use the **"Demo Persona"** dropdown in the top navigation bar to switch personas with 1 click, or sign in manually:

| Persona | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **GreenLeaf Restaurant (Seller)** | `seller@greenleaf.in` | `ecoloop123` | Seller |
| **PackRight Packaging (Buyer)** | `buyer@packright.com` | `ecoloop123` | Buyer |
| **EcoBiz Solutions (Dual Mode)** | `both@ecobiz.in` | `ecoloop123` | Buyer + Seller |
| **EcoLoop Express (Logistics)** | `logistics@ecoloop.in` | `ecoloop123` | Logistics Partner |
| **EcoLoop Chief Administrator** | `admin@ecoloop.in` | `admin123` | Platform Admin |

---

## 🧪 Automated Integration Tests

Run the comprehensive integration test suites:
```bash
# General API & privacy test suite
python test_app.py

# End-to-end multi-party circular transaction lifecycle test
python test_flows.py

# Advanced backend inventory, invoice & rating test
python test_refined_backend.py

# Enterprise profile, KYC, 2FA, disputes & payment accounts test
python test_enterprise_suite.py
```

---

## 📂 Project Structure

```
ECOLOOP/
├── app.py                     # FastAPI application setup, middleware, security headers & SPA mount
├── test_app.py                # Integration test suite for APIs and privacy masking
├── test_flows.py              # End-to-end multi-step transaction and logistics lifecycle test
├── test_refined_backend.py    # Refined backend inventory, invoice & review tests
├── test_enterprise_suite.py   # Business profile, KYC, 2FA, conversations & disputes test
├── data/
│   └── ecoloop.db             # Relational SQLite database with 27+ tables and seed data
├── backend/
│   ├── database.py            # SQLite schema initialization and connection manager
│   ├── auth.py                # PBKDF2 hashing, session tokens, audit logging & rate limiting
│   ├── matching_engine.py     # AI multi-factor compatibility scoring & Haversine distance
│   ├── seed_data.py           # Realistic B2B seed data (listings, orders, telemetry, impact)
│   └── routes/
│       ├── auth_routes.py     # Login, registration, profile, KYC verification, 2FA, session
│       ├── listings_routes.py # Marketplace search, filtering, privacy masking, create listing
│       ├── requests_routes.py # Purchase requests, negotiation room, counter-offers, messages
│       ├── orders_routes.py   # Order generation, fee breakdown, payment capture, disputes, invoices
│       ├── logistics_routes.py# Live tracking, driver jobs, dual OTP verification, delivery proofs
│       ├── privacy_routes.py  # Location privacy toggles, location access audit logs, data export
│       ├── impact_routes.py   # Environmental metrics, category breakdown, impact certificates
│       ├── admin_routes.py    # KYC review, dispute arbitration, platform metrics, audit logs
│       ├── notifications_routes.py # In-app notification alerts
│       └── upload_routes.py   # Secure document & image upload with magic-byte validation
└── frontend/
    ├── templates/
    │   └── index.html         # Application shell with Tailwind CSS & Leaflet map engine
    └── static/
        ├── css/
        │   └── style.css      # EcoLoop design system, radar pulse animation, glassmorphism
        └── js/
            ├── api.js         # REST API client wrapper with token handling
            ├── state.js       # Global reactive state and toast notification manager
            ├── app.js         # Master hash-based router and navigation shell
            └── views/
                ├── landing.js          # Hero, stats, how it works, sellable items, FAQ
                ├── marketplace.js      # Live search, category tabs, filter drawer, cards
                ├── material_detail.js  # Photo gallery, specs, AI match breakdown, request modal
                ├── list_waste.js       # Listing wizard with instant AI preview & privacy toggle
                ├── negotiation.js      # In-app negotiation room, counter-offers, masked chat
                ├── checkout.js         # Order summary, fees, UPI/Card/NetBanking checkout
                ├── orders.js           # My Orders with status tabs, OTP display, dispute triggers
                ├── tracking.js         # Interactive Leaflet live map, driver telemetry, OTP inputs
                ├── logistics_dashboard.js # Partner manifest, dock coordinates, digital signature
                ├── seller_dashboard.js # Inbound requests, active inventory, sales revenue
                ├── buyer_dashboard.js  # Active orders, AI recommendations, procurement stats
                ├── impact.js           # Environmental dashboard & verifiable certificate modal
                ├── privacy_center.js   # Location privacy toggles, 2FA, sessions, audit logs
                ├── admin.js            # Operations command, KYC approval, dispute resolution
                ├── auth_view.js        # Sign in, business registration, 1-click demo personas
                ├── business_profile.js # Business profile, metrics, KYC compliance submission
                ├── messages_inbox.js   # In-platform communications, requests & offer threads
                ├── dispute_center.js   # Escrow dispute claims, evidence attachment, arbiter rulings
                ├── notifications_view.js # Multi-channel live telemetry & alert feed
                ├── help_support.js     # Enterprise FAQ, SLA guidelines, support ticket generator
                └── payment_methods_view.js # Escrow payout bank accounts, business UPI handles
```

---

## 🔒 Security & Privacy Implementation Details

- **PBKDF2 Password Hashing**: Passwords stored using 100,000 rounds of HMAC-SHA256 with unique 16-byte random salts.
- **Role-Based Access Control (RBAC)**: Enforced server-side on every protected endpoint.
- **Masked Communications**: Phone numbers and personal emails are never exposed directly on public listings or negotiation threads.
- **Audit Logging**: Every sensitive action (login, coordinate retrieval, OTP entry, escrow payment, admin dispute decision) is committed to `audit_logs` with timestamps and IP addresses.
- **Automatic GPS Stream Decommissioning**: Real-time driver coordinate broadcasts cease immediately upon delivery confirmation.
