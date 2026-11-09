import sqlite3
import os
import json
from datetime import datetime

from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "ecoloop.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 10000")
    conn.execute("PRAGMA synchronous = NORMAL")
    return conn

@contextmanager
def db_session():
    """Thread-safe context manager with automatic commit on success and rollback on error."""
    conn = get_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()

    # Create tables
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'buyer', -- buyer, seller, buyer_seller, logistics, admin
        active_role TEXT NOT NULL DEFAULT 'buyer',
        is_verified INTEGER DEFAULT 0,
        two_factor_enabled INTEGER DEFAULT 0,
        failed_logins INTEGER DEFAULT 0,
        is_suspended INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS businesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        business_name TEXT NOT NULL,
        business_type TEXT NOT NULL,
        registration_no TEXT,
        gstin TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'India',
        description TEXT,
        logo_url TEXT,
        is_verified INTEGER DEFAULT 0,
        verification_date TIMESTAMP,
        rating REAL DEFAULT 5.0,
        total_reviews INTEGER DEFAULT 0,
        materials_sold_kg REAL DEFAULT 0,
        materials_purchased_kg REAL DEFAULT 0,
        transactions_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS business_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        document_number TEXT NOT NULL,
        document_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
        reviewer_notes TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS privacy_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        show_city_publicly INTEGER DEFAULT 1,
        show_approx_area INTEGER DEFAULT 1,
        reveal_exact_after_confirmation INTEGER DEFAULT 1,
        share_exact_with_logistics INTEGER DEFAULT 1,
        phone_visibility TEXT DEFAULT 'masked', -- masked, private, verified_only
        email_visibility TEXT DEFAULT 'masked',
        profile_visibility TEXT DEFAULT 'public',
        order_visibility TEXT DEFAULT 'parties_only',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        co2_factor_per_kg REAL DEFAULT 1.5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        resource_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL DEFAULT 'kg',
        condition TEXT NOT NULL, -- New, Excellent, Good, Used, Damaged, Recyclable, Processing required
        price_per_unit REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        is_free INTEGER DEFAULT 0,
        minimum_order REAL DEFAULT 1,
        availability_status TEXT DEFAULT 'available', -- available, reserved, sold, expired
        available_from TEXT,
        available_until TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        approx_latitude REAL NOT NULL,
        approx_longitude REAL NOT NULL,
        exact_address TEXT NOT NULL,
        exact_latitude REAL NOT NULL,
        exact_longitude REAL NOT NULL,
        pickup_available INTEGER DEFAULT 1,
        delivery_available INTEGER DEFAULT 1,
        ecoloop_logistics_available INTEGER DEFAULT 1,
        description TEXT,
        specifications TEXT, -- JSON string
        views_count INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active', -- active, draft, archived, under_review
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS listing_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchase_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id INTEGER NOT NULL,
        buyer_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        requested_quantity REAL NOT NULL,
        unit TEXT NOT NULL DEFAULT 'kg',
        offer_price REAL NOT NULL,
        total_material_offer REAL NOT NULL,
        message TEXT,
        delivery_preference TEXT NOT NULL DEFAULT 'ecoloop_logistics', -- buyer_pickup, seller_delivery, ecoloop_logistics
        required_date TEXT,
        status TEXT NOT NULL DEFAULT 'pending', -- pending, negotiating, accepted, declined, cancelled, converted_to_order
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_request_id INTEGER,
        buyer_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_blocked INTEGER DEFAULT 0,
        blocked_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE SET NULL,
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        message_type TEXT NOT NULL DEFAULT 'text', -- text, offer, counter_offer, acceptance, rejection, system
        content TEXT NOT NULL,
        metadata_json TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_request_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        offered_quantity REAL NOT NULL,
        offered_price REAL NOT NULL,
        delivery_method TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, countered, rejected
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL, -- e.g. EL-10284
        purchase_request_id INTEGER,
        listing_id INTEGER NOT NULL,
        buyer_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        unit_price REAL NOT NULL,
        material_amount REAL NOT NULL,
        platform_fee REAL NOT NULL,
        logistics_fee REAL NOT NULL,
        total_amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        delivery_method TEXT NOT NULL, -- buyer_pickup, seller_delivery, ecoloop_logistics
        payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed, refunded
        order_status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, processing, in_transit, delivered, completed, disputed, cancelled
        pickup_otp TEXT NOT NULL,
        delivery_otp TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE SET NULL,
        FOREIGN KEY (listing_id) REFERENCES listings(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        transaction_reference TEXT UNIQUE NOT NULL,
        payment_method TEXT NOT NULL, -- upi, card, netbanking, bank_transfer
        amount REAL NOT NULL,
        fee REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'paid', -- pending, processing, paid, failed, refunded
        gateway_response_json TEXT,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logistics_partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        license_number TEXT NOT NULL,
        vehicle_fleet_count INTEGER DEFAULT 10,
        rating REAL DEFAULT 4.9,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partner_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        masked_phone TEXT NOT NULL,
        vehicle_model TEXT NOT NULL,
        license_plate TEXT NOT NULL,
        current_lat REAL NOT NULL,
        current_lng REAL NOT NULL,
        is_on_duty INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES logistics_partners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logistics_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER UNIQUE NOT NULL,
        tracking_id TEXT UNIQUE NOT NULL, -- e.g. EL-10284
        partner_id INTEGER,
        driver_id INTEGER,
        pickup_contact_name TEXT,
        pickup_city TEXT NOT NULL,
        pickup_approx_area TEXT NOT NULL,
        pickup_exact_address TEXT NOT NULL,
        pickup_lat REAL NOT NULL,
        pickup_lng REAL NOT NULL,
        delivery_city TEXT NOT NULL,
        delivery_approx_area TEXT NOT NULL,
        delivery_exact_address TEXT NOT NULL,
        delivery_lat REAL NOT NULL,
        delivery_lng REAL NOT NULL,
        stage TEXT NOT NULL DEFAULT 'order_confirmed', -- order_confirmed, logistics_assigned, pickup_scheduled, driver_arriving, picked_up, in_transit, near_destination, out_for_delivery, delivered, delivery_confirmed
        estimated_distance_km REAL NOT NULL,
        estimated_duration_mins INTEGER NOT NULL,
        estimated_cost REAL NOT NULL,
        pickup_scheduled_at TIMESTAMP,
        pickup_actual_at TIMESTAMP,
        delivery_actual_at TIMESTAMP,
        is_tracking_active INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (partner_id) REFERENCES logistics_partners(id),
        FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS tracking_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        logistics_order_id INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        FOREIGN KEY (logistics_order_id) REFERENCES logistics_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS location_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        logistics_order_id INTEGER NOT NULL,
        current_lat REAL NOT NULL,
        current_lng REAL NOT NULL,
        heading REAL DEFAULT 0,
        speed_kmh REAL DEFAULT 35.0,
        status_label TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (logistics_order_id) REFERENCES logistics_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS delivery_proofs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER UNIQUE NOT NULL,
        logistics_order_id INTEGER NOT NULL,
        pickup_otp_verified INTEGER DEFAULT 0,
        delivery_otp_verified INTEGER DEFAULT 0,
        signature_svg_or_base64 TEXT,
        photo_url TEXT,
        verified_gps_lat REAL,
        verified_gps_lng REAL,
        driver_name TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (logistics_order_id) REFERENCES logistics_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL, -- request, offer, payment, logistics, security, alert
        link_url TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        reviewee_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        role TEXT NOT NULL, -- buyer_to_seller, seller_to_buyer
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id),
        FOREIGN KEY (reviewee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS disputes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        raised_by_id INTEGER NOT NULL,
        against_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence_urls TEXT,
        status TEXT NOT NULL DEFAULT 'open', -- open, under_review, evidence_requested, resolved, rejected
        resolution_notes TEXT,
        resolved_by_admin_id INTEGER,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (raised_by_id) REFERENCES users(id),
        FOREIGN KEY (against_id) REFERENCES users(id),
        FOREIGN KEY (resolved_by_admin_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reported_by_id INTEGER NOT NULL,
        reported_entity_type TEXT NOT NULL, -- user, listing, conversation
        entity_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, dismissed, action_taken
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reported_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS environmental_impacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        business_id INTEGER NOT NULL,
        material_type TEXT NOT NULL,
        category_id INTEGER,
        weight_kg REAL NOT NULL,
        waste_diverted_tonnes REAL NOT NULL,
        co2_avoided_kg REAL NOT NULL,
        water_saved_liters REAL NOT NULL,
        energy_saved_kwh REAL NOT NULL,
        trees_equivalent REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_type TEXT NOT NULL, -- login_failed, login_success, password_changed, role_switched, suspicious_attempt, 2fa_toggled
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        severity TEXT DEFAULT 'low', -- low, medium, high
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        active_role TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        expires_at REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        original_filename TEXT NOT NULL,
        stored_filename TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        purpose TEXT DEFAULT 'listing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Create Indexes for fast querying
    CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
    CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_logistics_tracking ON logistics_orders(tracking_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
