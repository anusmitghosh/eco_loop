import sqlite3
import json
from datetime import datetime, timedelta
from database import get_db, init_db
from auth import hash_password

def seed_all():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT count(*) as cnt FROM users")
    if cursor.fetchone()["cnt"] > 0:
        print("Database already contains data, skipping seed.")
        conn.close()
        return

    print("Seeding EcoLoop database with realistic production-ready data...")

    # 1. Categories
    categories = [
        ("Paper/Cardboard", "cardboard", "Corrugated boxes, office paper, pulp boards, Kraft rolls", "newspaper", 1.4),
        ("Plastic", "plastic", "HDPE, LDPE, PET flakes, PP containers, shrink wraps", "recycle", 2.2),
        ("Metal", "metal", "Aluminum offcuts, copper wire, brass, mild steel, cast iron scrap", "shield", 4.5),
        ("Glass", "glass", "Bottles, cullet, float glass offcuts, amber glass jars", "wine", 0.8),
        ("Wood", "wood", "Pallets, crates, timber offcuts, sawdust, plywood offcuts", "tree-pine", 1.8),
        ("Food Waste", "food-waste", "Coffee grounds, fruit pulp, brewery spent grains, bakery excess", "utensils", 2.5),
        ("Textile", "textile", "Cotton garment cuttings, denim scrap, yarn waste, synthetic rolls", "shirt", 3.6),
        ("Construction Material", "construction", "Surplus bricks, granite offcuts, gypsum boards, sand, tiles", "hammer", 0.9),
        ("Industrial Scrap", "industrial-scrap", "Rubber trims, conveyor belting, polymer pellets, CNC turnings", "factory", 3.8),
        ("Office Furniture", "furniture", "Workstations, ergonomic chairs, conference tables, file cabinets", "armchair", 2.1),
        ("Equipment", "equipment", "Commercial refrigerators, shop counters, display units, LED panels", "cpu", 5.2),
        ("Packaging Materials", "packaging", "Air cushions, bubble wrap, thermocol, edge protectors, pallets", "package", 1.6),
    ]

    for name, slug, desc, icon, co2 in categories:
        cursor.execute("""
            INSERT INTO categories (name, slug, description, icon, co2_factor_per_kg)
            VALUES (?, ?, ?, ?, ?)
        """, (name, slug, desc, icon, co2))

    # Helper map of category slug -> id
    cursor.execute("SELECT id, slug FROM categories")
    cat_map = {row["slug"]: row["id"] for row in cursor.fetchall()}

    # 2. Users
    pwd_hash, salt = hash_password("ecoloop123")
    admin_pwd_hash, admin_salt = hash_password("admin123")

    users_data = [
        # (email, phone, pwd_hash, salt, full_name, role, active_role, is_verified)
        ("seller@greenleaf.in", "+919864012345", pwd_hash, salt, "Arup Borah", "seller", "seller", 1),
        ("buyer@packright.com", "+919830067890", pwd_hash, salt, "Vikram Sen", "buyer", "buyer", 1),
        ("both@ecobiz.in", "+919706054321", pwd_hash, salt, "Priya Sharma", "buyer_seller", "seller", 1),
        ("logistics@ecoloop.in", "+919864999888", pwd_hash, salt, "Rajesh Logistics Partner", "logistics", "logistics", 1),
        ("admin@ecoloop.in", "+919999900000", admin_pwd_hash, admin_salt, "EcoLoop Chief Admin", "admin", "admin", 1),
        ("seller@assambio.com", "+919864234567", pwd_hash, salt, "Niloy Kalita", "seller", "seller", 1),
        ("seller@easternmetal.in", "+919864345678", pwd_hash, salt, "Sanjay Agarwal", "seller", "seller", 1),
        ("seller@urbanliquidation.com", "+919864456789", pwd_hash, salt, "Manish Das", "seller", "seller", 1),
    ]

    user_ids = {}
    for email, phone, p_hash, s, name, role, a_role, verified in users_data:
        cursor.execute("""
            INSERT INTO users (email, phone, password_hash, salt, full_name, role, active_role, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (email, phone, p_hash, s, name, role, a_role, verified))
        user_ids[email] = cursor.lastrowid

    # 3. Privacy Settings for all users
    for email, uid in user_ids.items():
        cursor.execute("""
            INSERT INTO privacy_settings (user_id, show_city_publicly, show_approx_area, reveal_exact_after_confirmation, share_exact_with_logistics)
            VALUES (?, 1, 1, 1, 1)
        """, (uid,))

    # 4. Businesses
    businesses_data = [
        (user_ids["seller@greenleaf.in"], "GreenLeaf Restaurant & Hospitality", "Food & Hospitality", "REG-AS-2021-9981", "18AABCG1234H1Z5", "Guwahati", "Assam", "Organic bistro and catering operation generating clean packaging, spent coffee and kitchen organic streams.", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop", 1, 4.9, 38, 1420.0, 50.0, 42),
        (user_ids["buyer@packright.com"], "PackRight Sustainable Packaging Ltd", "Manufacturing", "REG-WB-2019-3321", "19AAACP5678P1Z3", "Kolkata", "West Bengal", "Pioneer in biodegradable packaging, corrugated secondary liners and recycled pulp molded buffers.", "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop", 1, 4.8, 45, 0.0, 3850.0, 56),
        (user_ids["both@ecobiz.in"], "EcoBiz Solutions Northeast", "Trading & Recycling", "REG-AS-2022-7712", "18AABCE8821R1Z9", "Guwahati", "Assam", "Aggregator and upcycler of industrial scraps, shop furnishings, and surplus packaging inventory.", "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=200&h=200&fit=crop", 1, 4.9, 19, 980.0, 640.0, 28),
        (user_ids["seller@assambio.com"], "Assam BioPlastics & Composites", "Polymer Recycling", "REG-AS-2020-4491", "18AABCA4412K1Z4", "Guwahati", "Assam", "Industrial recycler processing HDPE drum regrinds, post-consumer PET flakes, and PP crates.", "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=200&h=200&fit=crop", 1, 4.7, 24, 4200.0, 120.0, 31),
        (user_ids["seller@easternmetal.in"], "Eastern Metal Reclaim & Engineering", "Industrial Scrap", "REG-AS-2018-8812", "18AABCE3390L1Z7", "Guwahati", "Assam", "Specialized foundry and ferrous/non-ferrous industrial metal reclaiming works.", "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=200&h=200&fit=crop", 1, 5.0, 15, 6800.0, 0.0, 22),
        (user_ids["seller@urbanliquidation.com"], "Urban Office Asset Recovery", "Asset Liquidation", "REG-AS-2023-1123", "18AABCU1188M1Z1", "Guwahati", "Assam", "Corporate asset re-use platform facilitating decommissioned office furniture and retail fixtures.", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop", 1, 4.8, 12, 1250.0, 0.0, 18),
    ]

    biz_ids = {}
    for uid, name, btype, regno, gstin, city, state, desc, logo, verified, rating, reviews, sold_kg, pur_kg, tx_count in businesses_data:
        cursor.execute("""
            INSERT INTO businesses (user_id, business_name, business_type, registration_no, gstin, city, state, description, logo_url, is_verified, rating, total_reviews, materials_sold_kg, materials_purchased_kg, transactions_completed, verification_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (uid, name, btype, regno, gstin, city, state, desc, logo, verified, rating, reviews, sold_kg, pur_kg, tx_count))
        biz_ids[name] = cursor.lastrowid

    # 5. Logistics Partner & Drivers
    cursor.execute("""
        INSERT INTO logistics_partners (user_id, company_name, license_number, vehicle_fleet_count, rating, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    """, (user_ids["logistics@ecoloop.in"], "EcoLoop Green Fleet Logistics", "LOG-IN-2024-8891", 18, 4.9))
    partner_id = cursor.lastrowid

    drivers_data = [
        (partner_id, "Rajesh Sharma", "+919864112233", "EcoLoop Tata Ace EV Van", "AS-01-EV-4029", 26.1550, 91.7580),
        (partner_id, "Amitav Barua", "+919864223344", "EcoLoop 3W Cargo Electric", "AS-01-EC-9102", 26.1720, 91.7710),
        (partner_id, "Bikram Roy", "+919864334455", "EcoLoop Eicher Pro 1-Ton", "AS-01-ET-5511", 26.1400, 91.7300),
    ]

    driver_ids = []
    for pid, dname, mphone, vmodel, lplate, lat, lng in drivers_data:
        cursor.execute("""
            INSERT INTO drivers (partner_id, name, masked_phone, vehicle_model, license_plate, current_lat, current_lng, is_on_duty)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (pid, dname, mphone, vmodel, lplate, lat, lng))
        driver_ids.append(cursor.lastrowid)

    # 6. Listings
    # Notice: approx_lat/lng are neighborhood centers; exact_lat/lng and exact_address are protected
    listings_data = [
        # (biz_name, title, cat_slug, resource_type, qty, unit, condition, price, min_order, city, state, approx_lat, approx_lng, exact_addr, exact_lat, exact_lng, desc, img_urls)
        (
            "GreenLeaf Restaurant & Hospitality",
            "Clean Corrugated Cardboard Boxes",
            "cardboard",
            "Double-wall brown corrugated shipper cartons",
            80.0,
            "kg",
            "Clean & Dry",
            12.0,
            20.0,
            "Guwahati",
            "Assam",
            26.1445,
            91.7362,
            "Plot 42, GS Road, Christian Basti, Guwahati, Assam 781005",
            26.1462,
            91.7378,
            "Uniformly bundled, flattened clean cardboard shipping boxes from daily organic food and vegetable shipments. Free of oil stains, tapes removed, 100% dry and stacked on pallets.",
            [
                "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop"
            ]
        ),
        (
            "GreenLeaf Restaurant & Hospitality",
            "Spent Arabica Coffee Grounds (Organic)",
            "food-waste",
            "Espresso cake & filter ground compostable substrate",
            120.0,
            "kg",
            "Excellent",
            4.0,
            30.0,
            "Guwahati",
            "Assam",
            26.1445,
            91.7362,
            "Plot 42, GS Road, Christian Basti, Guwahati, Assam 781005",
            26.1462,
            91.7378,
            "Daily collection of pure organic espresso cake grounds. High nitrogen content, sterile extraction, ideal for mushroom cultivation, organic fertilizer, or bio-fuel briquetting.",
            [
                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop"
            ]
        ),
        (
            "Assam BioPlastics & Composites",
            "HDPE Blue Drum Regrind Flakes (Washed)",
            "plastic",
            "High Density Polyethylene 8mm regrind flakes",
            250.0,
            "kg",
            "Recyclable",
            38.0,
            50.0,
            "Guwahati",
            "Assam",
            26.1850,
            91.7700,
            "Industrial Estate Shed 14, Bamunimaidam, Guwahati, Assam 781021",
            26.1865,
            91.7725,
            "High quality washed industrial blue drum regrind. Melt flow index tested (0.05-0.10 g/10min), ideal for blow moulding, drainage pipes, and heavy-duty pallets.",
            [
                "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop"
            ]
        ),
        (
            "Eastern Metal Reclaim & Engineering",
            "Clean Aluminum 6063 Extrusion Offcuts",
            "metal",
            "Structural architectural offcuts & punching trims",
            110.0,
            "kg",
            "Excellent",
            140.0,
            25.0,
            "Guwahati",
            "Assam",
            26.1200,
            91.7100,
            "Fatasil Ambari Industrial Area, Sector 3, Guwahati 781025",
            26.1215,
            91.7118,
            "Pristine aluminum 6063 profile end pieces from window and solar panel frame fabrication. Anodized mill finish, magnetic test negative, zero iron inclusion.",
            [
                "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop"
            ]
        ),
        (
            "Urban Office Asset Recovery",
            "Modular Ergonomic Office Workstation Pods (Set of 4)",
            "furniture",
            "Pre-owned acoustic partition workstation cluster",
            8.0,
            "units",
            "Good",
            3200.0,
            1.0,
            "Guwahati",
            "Assam",
            26.1600,
            91.7450,
            "Commerce Tower Level 2, Zoo Road, Guwahati 781024",
            26.1610,
            91.7460,
            "Complete modular corporate desks with built-in cable trays, acoustic grey fabric divider screens, and raceways. Very solid steel frames and birch laminate tops.",
            [
                "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop"
            ]
        ),
        (
            "Urban Office Asset Recovery",
            "Heavy-Duty Industrial Slotted Angle Steel Racks",
            "furniture",
            "Adjustable warehouse storage shelves 7ft x 3ft",
            6.0,
            "units",
            "Excellent",
            2200.0,
            2.0,
            "Guwahati",
            "Assam",
            26.1600,
            91.7450,
            "Commerce Tower Level 2, Zoo Road, Guwahati 781024",
            26.1610,
            91.7460,
            "Industrial powder-coated grey storage shelving racks. 5 shelves per unit, rated for 150 kg per shelf. Disassembled for easy vehicle transport.",
            [
                "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop"
            ]
        ),
        (
            "EcoBiz Solutions Northeast",
            "Heat-Treated Pine Wood Shipping Pallets (Euro Standard)",
            "wood",
            "1200x800mm ISPM-15 certified pallets",
            45.0,
            "units",
            "Good",
            280.0,
            10.0,
            "Guwahati",
            "Assam",
            26.1300,
            91.7600,
            "Lokhra Logistics Hub, NH-27 Bypass, Guwahati 781034",
            26.1315,
            91.7610,
            "Uniform ISPM-15 heat-treated 4-way forklift entry pine pallets. Stored under roof, moisture content < 18%. Excellent for warehouse stacking or furniture crafting.",
            [
                "https://images.unsplash.com/photo-1595079672139-bf8885cb5b69?w=800&auto=format&fit=crop"
            ]
        ),
        (
            "EcoBiz Solutions Northeast",
            "Heavy-Duty Air Cushion Bubble Film Rolls (Surplus)",
            "packaging",
            "Recyclable LDPE air buffer packaging wrap",
            30.0,
            "rolls",
            "New",
            450.0,
            5.0,
            "Guwahati",
            "Assam",
            26.1300,
            91.7600,
            "Lokhra Logistics Hub, NH-27 Bypass, Guwahati 781034",
            26.1315,
            91.7610,
            "Surplus factory sealed rolls from pharmaceutical packaging batch. 500 meters per roll, perforated every 20cm, durable 40-micron barrier layer.",
            [
                "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop"
            ]
        )
    ]

    listing_ids = []
    for bname, title, cslug, rtype, qty, unit, cond, price, min_ord, city, state, alat, alng, eaddr, elat, elng, desc, imgs in listings_data:
        bid = biz_ids[bname]
        cid = cat_map[cslug]
        cursor.execute("""
            INSERT INTO listings (
                business_id, title, category_id, resource_type, quantity, unit, condition,
                price_per_unit, minimum_order, city, state, approx_latitude, approx_longitude,
                exact_address, exact_latitude, exact_longitude, description, views_count, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 124, 'active')
        """, (bid, title, cid, rtype, qty, unit, cond, price, min_ord, city, state, alat, alng, eaddr, elat, elng, desc))
        lid = cursor.lastrowid
        listing_ids.append(lid)

        for idx, img in enumerate(imgs):
            cursor.execute("""
                INSERT INTO listing_images (listing_id, image_url, is_primary)
                VALUES (?, ?, ?)
            """, (lid, img, 1 if idx == 0 else 0))

    # 7. Seed Active Purchase Request & Order #EL-10284
    # GreenLeaf (Seller) -> PackRight (Buyer)
    greenleaf_user_id = user_ids["seller@greenleaf.in"]
    packright_user_id = user_ids["buyer@packright.com"]
    cardboard_listing_id = listing_ids[0]

    cursor.execute("""
        INSERT INTO purchase_requests (
            listing_id, buyer_id, seller_id, requested_quantity, unit, offer_price,
            total_material_offer, message, delivery_preference, required_date, status
        ) VALUES (?, ?, ?, 50.0, 'kg', 12.0, 600.0,
            'We require 50 kg clean cardboard for corrugated secondary pulp molding at our Guwahati regional branch.',
            'ecoloop_logistics', '2026-09-28', 'converted_to_order')
    """, (cardboard_listing_id, packright_user_id, greenleaf_user_id))
    req_id = cursor.lastrowid

    # Conversation and negotiation messages
    cursor.execute("""
        INSERT INTO conversations (purchase_request_id, buyer_id, seller_id)
        VALUES (?, ?, ?)
    """, (req_id, packright_user_id, greenleaf_user_id))
    conv_id = cursor.lastrowid

    messages = [
        (packright_user_id, "text", "Hello GreenLeaf team! We are interested in 50 kg of your clean cardboard boxes. Can you ensure they remain protected from rain?"),
        (greenleaf_user_id, "text", "Hi PackRight! Yes, absolutely. All boxes are shrink-wrapped and stored on wooden pallets in our covered dispatch dock."),
        (packright_user_id, "offer", "Formal Offer: 50 kg @ ₹12/kg with EcoLoop Green Fleet Logistics.", json.dumps({"quantity": 50, "price": 12, "delivery": "ecoloop_logistics"})),
        (greenleaf_user_id, "acceptance", "Offer accepted! We have confirmed the pickup slot for today.", json.dumps({"status": "accepted"})),
    ]

    for sender, mtype, content, *meta in messages:
        mjson = meta[0] if meta else None
        cursor.execute("""
            INSERT INTO messages (conversation_id, sender_id, message_type, content, metadata_json, is_read)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (conv_id, sender, mtype, content, mjson))

    # Order #EL-10284
    cursor.execute("""
        INSERT INTO orders (
            order_number, purchase_request_id, listing_id, buyer_id, seller_id,
            quantity, unit, unit_price, material_amount, platform_fee, logistics_fee,
            total_amount, delivery_method, payment_status, order_status, pickup_otp, delivery_otp
        ) VALUES (?, ?, ?, ?, ?, 50.0, 'kg', 12.0, 600.0, 30.0, 80.0, 710.0, 'ecoloop_logistics', 'paid', 'in_transit', '482910', '739104')
    """, ("EL-10284", req_id, cardboard_listing_id, packright_user_id, greenleaf_user_id))
    order_id = cursor.lastrowid

    # Payment Record
    cursor.execute("""
        INSERT INTO payments (
            order_id, transaction_reference, payment_method, amount, fee, status, gateway_response_json
        ) VALUES (?, 'PAY-EL-99482', 'upi', 710.0, 30.0, 'paid', '{"provider": "UPI-Razorpay-Sim", "vpa": "packright@okhdfcbank", "status": "captured"}')
    """, (order_id,))

    # Logistics Order & Live Tracking
    # Driver Rajesh Sharma in Tata Ace EV
    cursor.execute("""
        INSERT INTO logistics_orders (
            order_id, tracking_id, partner_id, driver_id, pickup_contact_name,
            pickup_city, pickup_approx_area, pickup_exact_address, pickup_lat, pickup_lng,
            delivery_city, delivery_approx_area, delivery_exact_address, delivery_lat, delivery_lng,
            stage, estimated_distance_km, estimated_duration_mins, estimated_cost, is_tracking_active,
            pickup_actual_at
        ) VALUES (
            ?, 'EL-10284', ?, ?, 'Arup Borah (GreenLeaf Store Manager)',
            'Guwahati', 'GS Road, Christian Basti', 'Plot 42, GS Road, Christian Basti, Guwahati, Assam 781005', 26.1462, 91.7378,
            'Guwahati', 'Beltola Industrial Hub', 'Warehouse 12, Beltola-Basistha Link Rd, Guwahati, Assam 781028', 26.1150, 91.7920,
            'in_transit', 6.8, 18, 80.0, 1, CURRENT_TIMESTAMP
        )
    """, (order_id, partner_id, driver_ids[0]))
    log_order_id = cursor.lastrowid

    # Tracking Session & Waypoint breadcrumbs for Live Radar
    cursor.execute("""
        INSERT INTO tracking_sessions (logistics_order_id, is_active)
        VALUES (?, 1)
    """, (log_order_id,))

    # Driver current position between pickup and delivery
    driver_current_lat = 26.1320
    driver_current_lng = 26.1320, 91.7650
    cursor.execute("""
        INSERT INTO location_events (logistics_order_id, current_lat, current_lng, heading, speed_kmh, status_label)
        VALUES (?, 26.1320, 91.7650, 135.0, 32.5, 'Moving along GS Road towards Beltola Hub')
    """, (log_order_id,))

    # 8. Notifications
    notifs = [
        (packright_user_id, "Shipment In Transit", "Driver Rajesh Sharma is on the way with your 50 kg Cardboard order #EL-10284. ETA: 18 mins.", "logistics", "#tracking/EL-10284"),
        (greenleaf_user_id, "Pickup Confirmed", "Material for order #EL-10284 was picked up successfully by EcoLoop Green Fleet.", "logistics", "#orders/EL-10284"),
        (greenleaf_user_id, "Payment Credited", "₹600 has been credited to your EcoLoop wallet for order #EL-10284.", "payment", "#seller-dashboard"),
        (packright_user_id, "New AI Material Match", "High-compatibility match (94%) discovered: 80 kg Clean Cardboard in Guwahati.", "request", "#material/" + str(cardboard_listing_id)),
    ]
    for uid, title, msg, ntype, link in notifs:
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, link_url, is_read)
            VALUES (?, ?, ?, ?, ?, 0)
        """, (uid, title, msg, ntype, link))

    # 9. Environmental Impact Records
    cursor.execute("""
        INSERT INTO environmental_impacts (
            order_id, business_id, material_type, category_id, weight_kg,
            waste_diverted_tonnes, co2_avoided_kg, water_saved_liters, energy_saved_kwh, trees_equivalent
        ) VALUES (
            ?, ?, 'Clean Corrugated Cardboard', ?, 50.0,
            0.050, 70.0, 1300.0, 205.0, 3.33
        )
    """, (order_id, biz_ids["GreenLeaf Restaurant & Hospitality"], cat_map["cardboard"]))

    # 10. Audit Logs
    audit_events = [
        (user_ids["admin@ecoloop.in"], "SYSTEM_INIT", "system", "0", "EcoLoop Platform v2.0 initialized with secure RBAC and location masking.", "127.0.0.1"),
        (user_ids["seller@greenleaf.in"], "LISTING_PUBLISHED", "listing", str(cardboard_listing_id), "Published listing 'Clean Corrugated Cardboard Boxes' with approximate location.", "103.21.124.12"),
        (user_ids["buyer@packright.com"], "ORDER_CREATED", "order", "EL-10284", "Created order #EL-10284 with EcoLoop Logistics.", "103.45.67.89"),
        (user_ids["buyer@packright.com"], "PAYMENT_COMPLETED", "payment", "PAY-EL-99482", "Processed ₹710.0 via UPI escrow gateway.", "103.45.67.89"),
        (user_ids["logistics@ecoloop.in"], "LOCATION_ACCESS_AUTHORIZED", "logistics_order", str(log_order_id), "Driver Rajesh Sharma unlocked exact pickup coordinates via OTP verification.", "103.88.99.10"),
    ]
    for uid, action, rtype, rid, details, ip in audit_events:
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (uid, action, rtype, rid, details, ip))

    # 11. Security Events
    sec_events = [
        (user_ids["seller@greenleaf.in"], "login_success", "103.21.124.12", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Session initiated via 2FA-secured credential exchange.", "low"),
        (user_ids["buyer@packright.com"], "login_success", "103.45.67.89", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "Session initiated with role 'buyer'.", "low"),
        (None, "suspicious_attempt", "45.132.88.19", "curl/7.68.0", "Unauthenticated endpoint probe blocked by EcoLoop firewall.", "medium"),
    ]
    for uid, etype, ip, ua, details, sev in sec_events:
        cursor.execute("""
            INSERT INTO security_events (user_id, event_type, ip_address, user_agent, details, severity)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (uid, etype, ip, ua, details, sev))

    conn.commit()
    conn.close()
    print("Seed data successfully inserted.")

if __name__ == "__main__":
    seed_all()
