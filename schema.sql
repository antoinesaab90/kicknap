-- kicknap Database Schema
-- PostgreSQL 15+
-- Designed by Learnix for kicknap marketplace
-- Last updated: August 2026

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS (fixed value types)
-- ============================================

CREATE TYPE user_role AS ENUM ('guest', 'host', 'both');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'removed');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'paid_out', 'refunded', 'disputed', 'failed');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'escalated', 'closed');
CREATE TYPE review_type AS ENUM ('guest_to_host', 'host_to_guest');
CREATE TYPE damage_report_status AS ENUM ('submitted', 'acknowledged', 'under_review', 'resolved', 'closed');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'message', 'review', 'damage', 'system', 'marketing');
CREATE TYPE photo_type AS ENUM ('listing', 'profile', 'document');
CREATE TYPE booking_mode AS ENUM ('instant', 'request');
CREATE TYPE gap_blocking AS ENUM ('auto', 'manual');
CREATE TYPE booking_request_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- ============================================
-- TABLE 1: users
-- The core table. One account, dual role (guest/host).
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   TEXT NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    bio             TEXT,
    role            user_role NOT NULL DEFAULT 'guest',
    
    -- Verification
    email_verified      BOOLEAN DEFAULT FALSE,
    phone_verified      BOOLEAN DEFAULT FALSE,
    id_verified         verification_status DEFAULT 'unverified',
    id_document_url     TEXT,          -- encrypted reference, not raw ID
    
    -- Location
    city            VARCHAR(100),
    country         VARCHAR(100) DEFAULT 'Netherlands',
    
    -- Stripe
    stripe_customer_id      VARCHAR(255),   -- for guests (payments)
    stripe_connect_account_id VARCHAR(255), -- for hosts (payouts)
    
    -- Metadata
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  -- soft delete
);

-- Indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_stripe_connect ON users(stripe_connect_account_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE 2: user_verifications
-- Audit trail for identity verification attempts.
-- ============================================
CREATE TABLE user_verifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    document_type   VARCHAR(50) NOT NULL,  -- passport, national_id, drivers_license
    document_url    TEXT NOT NULL,          -- encrypted reference
    selfie_url      TEXT,                   -- liveness check photo
    status          verification_status DEFAULT 'pending',
    rejection_reason TEXT,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verifications_user ON user_verifications(user_id);
CREATE INDEX idx_verifications_status ON user_verifications(status);

-- ============================================
-- TABLE 3: listings
-- A space listed by a host.
-- ============================================
CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id         UUID NOT NULL REFERENCES users(id),
    
    -- Basic info
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    space_type      VARCHAR(100) NOT NULL,  -- bedroom, office, studio, apartment, other
    
    -- Location
    address_line1   VARCHAR(255) NOT NULL,
    address_line2   VARCHAR(255),
    city            VARCHAR(100) NOT NULL DEFAULT 'Amsterdam',
    postal_code     VARCHAR(20),
    country         VARCHAR(100) NOT NULL DEFAULT 'Netherlands',
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    neighborhood    VARCHAR(100),           -- for search filtering
    
    -- Pricing
    price_per_hour  DECIMAL(10, 2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'EUR',
    min_hours       DECIMAL(3, 1) DEFAULT 1,    -- minimum booking duration
    max_hours       DECIMAL(3, 1) DEFAULT 24,   -- maximum booking duration
    
    -- Booking mode
    booking_mode    booking_mode NOT NULL DEFAULT 'instant',  -- instant or request
    response_window_minutes INTEGER DEFAULT 120,  -- for request mode: 2 hours to respond
    gap_blocking    gap_blocking NOT NULL DEFAULT 'auto',  -- auto-block gaps < 1 hour
    
    -- Capacity
    max_guests      INTEGER NOT NULL DEFAULT 1,
    
    -- Status
    status          listing_status NOT NULL DEFAULT 'draft',
    
    -- Compliance
    registration_number VARCHAR(100),  -- EU Regulation 2024/1028
    
    -- Stats (denormalized for performance)
    total_bookings  INTEGER DEFAULT 0,
    average_rating  DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews   INTEGER DEFAULT 0,
    
    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  -- soft delete
);

CREATE INDEX idx_listings_host ON listings(host_id);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price_per_hour);
CREATE INDEX idx_listings_space_type ON listings(space_type);
CREATE INDEX idx_listings_neighborhood ON listings(neighborhood);
CREATE INDEX idx_listings_location ON listings(latitude, longitude);
CREATE INDEX idx_listings_active ON listings(status, city) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE 4: listing_amenities
-- What the space offers (wifi, shower, parking, etc.)
-- ============================================
CREATE TABLE listing_amenities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    amenity         VARCHAR(100) NOT NULL,  -- wifi, shower, parking, kitchen, coffee, etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(listing_id, amenity)
);

CREATE INDEX idx_amenities_listing ON listing_amenities(listing_id);
CREATE INDEX idx_amenities_type ON listing_amenities(amenity);

-- ============================================
-- TABLE 5: listing_safety_declarations
-- Host-declared safety features. NOT verified by kicknap.
-- ============================================
CREATE TABLE listing_safety_declarations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    feature         VARCHAR(100) NOT NULL,  -- smoke_detector, fire_extinguisher, first_aid_kit, co_detector
    is_present      BOOLEAN NOT NULL DEFAULT FALSE,
    declared_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(listing_id, feature)
);

CREATE INDEX idx_safety_listing ON listing_safety_declarations(listing_id);

-- ============================================
-- TABLE 6: listing_photos
-- Photos for each listing.
-- ============================================
CREATE TABLE listing_photos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    alt_text        VARCHAR(255),
    sort_order      INTEGER DEFAULT 0,
    is_primary      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_listing ON listing_photos(listing_id);

-- ============================================
-- TABLE 7: listing_availability
-- When a listing is available for booking.
-- Supports recurring schedules AND specific date overrides.
-- ============================================
CREATE TABLE listing_availability (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- For recurring availability (e.g., Mon-Fri 8am-5pm)
    day_of_week     INTEGER,             -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time      TIME NOT NULL,        -- e.g., '08:00'
    end_time        TIME NOT NULL,        -- e.g., '17:00'
    
    -- For specific date overrides (block or open specific dates)
    specific_date   DATE,                -- NULL for recurring, set for date-specific
    
    -- Type
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = blocked/unavailable
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_availability_listing ON listing_availability(listing_id);
CREATE INDEX idx_availability_day ON listing_availability(listing_id, day_of_week);
CREATE INDEX idx_availability_date ON listing_availability(listing_id, specific_date);

-- ============================================
-- TABLE 7: booking_requests
-- For Request to Book mode. Guest sends request, host accepts/declines.
-- ============================================
CREATE TABLE booking_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id        UUID NOT NULL REFERENCES users(id),
    host_id         UUID NOT NULL REFERENCES users(id),
    listing_id      UUID NOT NULL REFERENCES listings(id),
    
    -- Requested time
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    duration_hours  DECIMAL(4, 1) NOT NULL,
    
    -- Pricing (locked at request time)
    price_per_hour  DECIMAL(10, 2) NOT NULL,
    total_price     DECIMAL(10, 2) NOT NULL,  -- what guest will pay if accepted
    
    -- Status
    status          booking_request_status NOT NULL DEFAULT 'pending',
    
    -- Response tracking
    responded_at    TIMESTAMPTZ,  -- when host accepted/declined
    expires_at      TIMESTAMPTZ NOT NULL,  -- auto-decline if no response by this time
    
    -- Guest message (optional)
    message         TEXT,
    
    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_requests_host ON booking_requests(host_id);
CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_expires ON booking_requests(expires_at) WHERE status = 'pending';

-- TABLE 8: bookings
-- A confirmed reservation. Core transaction table.
-- ============================================
CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id        UUID NOT NULL REFERENCES users(id),
    host_id         UUID NOT NULL REFERENCES users(id),
    listing_id      UUID NOT NULL REFERENCES listings(id),
    
    -- Timing
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    duration_hours  DECIMAL(4, 1) NOT NULL,  -- calculated: end_time - start_time
    
    -- Pricing
    price_per_hour  DECIMAL(10, 2) NOT NULL,  -- locked at booking time (not from listing)
    subtotal        DECIMAL(10, 2) NOT NULL,   -- price_per_hour * duration_hours
    guest_fee       DECIMAL(10, 2) NOT NULL,   -- kicknap guest service fee
    host_fee        DECIMAL(10, 2) NOT NULL,   -- kicknap host service fee (deducted from payout)
    total_price     DECIMAL(10, 2) NOT NULL,   -- subtotal + guest_fee (what guest pays)
    host_payout     DECIMAL(10, 2) NOT NULL,   -- subtotal - host_fee (what host receives)
    security_deposit DECIMAL(10, 2) NOT NULL,  -- pre-authorization amount
    currency        VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Status
    status          booking_status NOT NULL DEFAULT 'pending',
    
    -- Booking mode reference (optional — only for Request to Book)
    booking_request_id UUID REFERENCES booking_requests(id),
    
    -- Cancellation
    cancelled_by    UUID REFERENCES users(id),
    cancelled_at    TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Metadata
    guest_count     INTEGER DEFAULT 1,
    notes           TEXT,               -- guest notes to host
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_host ON bookings(host_id);
CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start ON bookings(start_time);
CREATE INDEX idx_bookings_dates ON bookings(start_time, end_time);
CREATE INDEX idx_bookings_active ON bookings(status) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE 9: payments
-- Tracks every financial transaction through Stripe.
-- ============================================
CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id              UUID NOT NULL REFERENCES bookings(id),
    
    -- Stripe references
    stripe_payment_intent_id    VARCHAR(255),   -- guest payment
    stripe_transfer_id          VARCHAR(255),   -- host payout
    stripe_charge_id            VARCHAR(255),
    stripe_refund_id            VARCHAR(255),
    
    -- Amounts
    amount                  DECIMAL(10, 2) NOT NULL,  -- total charged to guest
    currency                VARCHAR(3) NOT NULL DEFAULT 'EUR',
    host_payout_amount      DECIMAL(10, 2),           -- what host receives
    kicknap_fee             DECIMAL(10, 2),           -- what kicknap keeps
    
    -- Status
    status                  payment_status NOT NULL DEFAULT 'pending',
    
    -- Security deposit
    deposit_amount          DECIMAL(10, 2),
    deposit_status          VARCHAR(20),    -- authorized, captured, released
    deposit_released_at     TIMESTAMPTZ,
    
    -- Metadata
    paid_at                 TIMESTAMPTZ,
    refunded_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_transfer ON payments(stripe_transfer_id);

-- ============================================
-- TABLE 10: reviews
-- Double-blind reviews from both sides.
-- ============================================
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    reviewee_id     UUID NOT NULL REFERENCES users(id),
    listing_id      UUID NOT NULL REFERENCES listings(id),
    
    -- Content
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    type            review_type NOT NULL,   -- guest_to_host or host_to_guest
    
    -- Double-blind mechanics
    is_visible      BOOLEAN DEFAULT FALSE,  -- visible only after both submit or 14 days
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visible_at      TIMESTAMPTZ,
    
    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    
    UNIQUE(booking_id, reviewer_id)  -- one review per person per booking
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_visible ON reviews(listing_id, is_visible) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE 11: messages
-- In-platform messaging between guests and hosts.
-- ============================================
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id       UUID NOT NULL REFERENCES users(id),
    receiver_id     UUID NOT NULL REFERENCES users(id),
    booking_id      UUID REFERENCES bookings(id),  -- optional: message related to a booking
    
    content         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at);

-- ============================================
-- TABLE 12: notifications
-- System notifications for users.
-- ============================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            notification_type NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    link            TEXT,               -- deep link to relevant page
    
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    
    -- Reference to the related entity
    entity_type     VARCHAR(50),        -- 'booking', 'review', 'message', etc.
    entity_id       UUID,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================
-- TABLE 13: damage_reports
-- Filed through the Resolution Center.
-- ============================================
CREATE TABLE damage_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    filed_by_id     UUID NOT NULL REFERENCES users(id),   -- usually the host
    against_id      UUID NOT NULL REFERENCES users(id),   -- usually the guest
    
    -- Damage details
    description     TEXT NOT NULL,
    estimated_cost  DECIMAL(10, 2),
    currency        VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Status
    status          damage_report_status NOT NULL DEFAULT 'submitted',
    
    -- Resolution
    resolution      TEXT,
    resolved_at     TIMESTAMPTZ,
    
    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_damage_booking ON damage_reports(booking_id);
CREATE INDEX idx_damage_filed_by ON damage_reports(filed_by_id);
CREATE INDEX idx_damage_status ON damage_reports(status);

-- ============================================
-- TABLE 14: damage_report_photos
-- Evidence photos for damage reports.
-- ============================================
CREATE TABLE damage_report_photos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    damage_report_id UUID NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    caption         VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_damage_photos_report ON damage_report_photos(damage_report_id);

-- ============================================
-- TABLE 15: host_insurance
-- Insurance records for hosts.
-- ============================================
CREATE TABLE host_insurance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id         UUID NOT NULL REFERENCES users(id),
    
    provider        VARCHAR(200) NOT NULL,
    policy_number   VARCHAR(100),
    coverage_type   VARCHAR(100) NOT NULL,  -- property, liability, both
    coverage_amount DECIMAL(12, 2),
    currency        VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    valid_from      DATE NOT NULL,
    valid_until     DATE NOT NULL,
    document_url    TEXT,                   -- uploaded proof
    
    is_verified     BOOLEAN DEFAULT FALSE,  -- kicknap verified the document
    verified_at     TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insurance_host ON host_insurance(host_id);
CREATE INDEX idx_insurance_valid ON host_insurance(valid_until);

-- ============================================
-- TABLE 16: audit_log
-- Who changed what, when. Immutable append-only.
-- ============================================
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),  -- NULL for system actions
    action          VARCHAR(100) NOT NULL,       -- 'user.registered', 'booking.confirmed', etc.
    entity_type     VARCHAR(50) NOT NULL,        -- 'user', 'listing', 'booking', etc.
    entity_id       UUID NOT NULL,
    
    -- Change tracking
    old_values      JSONB,
    new_values      JSONB,
    
    -- Context
    ip_address      INET,
    user_agent      TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables that have it
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_damage_reports_updated_at BEFORE UPDATE ON damage_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_insurance_updated_at BEFORE UPDATE ON host_insurance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (useful query shortcuts)
-- ============================================

-- Active listings with host info (for search results)
CREATE VIEW v_active_listings AS
SELECT 
    l.id,
    l.host_id,
    u.first_name || ' ' || u.last_name AS host_name,
    u.avatar_url AS host_avatar,
    l.title,
    l.description,
    l.space_type,
    l.city,
    l.neighborhood,
    l.price_per_hour,
    l.currency,
    l.min_hours,
    l.max_hours,
    l.max_guests,
    l.average_rating,
    l.total_reviews,
    l.total_bookings,
    (SELECT url FROM listing_photos WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) AS primary_photo
FROM listings l
JOIN users u ON l.host_id = u.id
WHERE l.status = 'active' 
  AND l.deleted_at IS NULL
  AND u.is_active = TRUE;

-- Upcoming bookings (for dashboard)
CREATE VIEW v_upcoming_bookings AS
SELECT
    b.id,
    b.guest_id,
    b.host_id,
    b.listing_id,
    l.title AS listing_title,
    b.start_time,
    b.end_time,
    b.duration_hours,
    b.total_price,
    b.status,
    u_guest.first_name AS guest_name,
    u_host.first_name AS host_name
FROM bookings b
JOIN listings l ON b.listing_id = l.id
JOIN users u_guest ON b.guest_id = u_guest.id
JOIN users u_host ON b.host_id = u_host.id
WHERE b.status IN ('confirmed', 'pending')
  AND b.start_time > NOW()
  AND b.deleted_at IS NULL
ORDER BY b.start_time ASC;

-- Host earnings summary
CREATE VIEW v_host_earnings AS
SELECT
    b.host_id,
    COUNT(b.id) AS total_bookings,
    SUM(b.host_payout) AS total_earned,
    SUM(b.host_fee) AS total_fees,
    AVG(b.host_payout) AS average_payout
FROM bookings b
WHERE b.status = 'completed'
  AND b.deleted_at IS NULL
GROUP BY b.host_id;

-- ============================================
-- TABLE 17: notification_preferences
-- Per-user notification settings.
-- ============================================
CREATE TABLE notification_preferences (
    user_id                     UUID PRIMARY KEY REFERENCES users(id),
    
    -- Email notifications
    email_price_changes         BOOLEAN DEFAULT TRUE,
    email_new_bookings          BOOLEAN DEFAULT TRUE,
    email_booking_cancellations BOOLEAN DEFAULT TRUE,
    email_reviews               BOOLEAN DEFAULT TRUE,
    email_weekly_earnings_summary BOOLEAN DEFAULT TRUE,
    email_marketing             BOOLEAN DEFAULT FALSE,
    
    -- Push notifications
    push_new_bookings           BOOLEAN DEFAULT TRUE,
    push_messages               BOOLEAN DEFAULT TRUE,
    push_price_changes          BOOLEAN DEFAULT FALSE,
    
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADD suggested_price TO listings TABLE
-- ============================================
ALTER TABLE listings ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10, 2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS suggested_price_updated_at TIMESTAMPTZ;

-- ============================================
-- INDEXES FOR BOOKING VARIATIONS
-- ============================================
CREATE INDEX idx_listings_booking_mode ON listings(booking_mode);

-- ============================================
-- TABLE 18: service_health
-- Tracks health status of each service (bubble).
-- Updated by health check endpoints every 10 seconds.
-- ============================================
CREATE TABLE service_health (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name    VARCHAR(50) NOT NULL UNIQUE,  -- auth, listing, booking, payment, pricing, notification, search, review, admin
    status          VARCHAR(20) NOT NULL DEFAULT 'healthy',  -- healthy, degraded, down
    latency_ms      INTEGER,  -- average response time in milliseconds
    error_rate      DECIMAL(5, 4) DEFAULT 0.0000,  -- percentage of failed requests (0.0000 to 1.0000)
    last_check      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_failure    TIMESTAMPTZ,
    failure_count   INTEGER DEFAULT 0,  -- consecutive failures (resets on success)
    metadata        JSONB,  -- additional info (version, region, etc.)
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_health_status ON service_health(status);

-- ============================================
-- TABLE 19: deployment_log
-- Tracks deployments for rollback and audit.
-- ============================================
CREATE TABLE deployment_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version         VARCHAR(50) NOT NULL,  -- e.g., v1.2.0
    environment     VARCHAR(20) NOT NULL,  -- development, staging, production
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress',  -- in_progress, success, failed, rolled_back
    
    -- What changed
    commit_sha      VARCHAR(40),
    commit_message  TEXT,
    author          VARCHAR(100),
    
    -- Timing
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Rollback
    rolled_back_at  TIMESTAMPTZ,
    rollback_reason TEXT,
    
    -- Metadata
    metadata        JSONB  -- additional info (deployer, channel, etc.)
);

CREATE INDEX idx_deployment_log_environment ON deployment_log(environment);
CREATE INDEX idx_deployment_log_status ON deployment_log(status);

-- ============================================
-- SCHEMA COMPLETE
-- 21 tables, 11 enums, 7 views, 57+ indexes
-- ============================================
