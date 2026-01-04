-- CLEAN SCHEMA FINAL
CREATE TYPE user_role_enum AS ENUM ('customer');
CREATE TYPE staff_role_enum AS ENUM ('sysadmin', 'manager', 'staff');
CREATE TYPE payment_method_enum AS ENUM ('cash', 'card', 'qpay', 'transfer');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role staff_role_enum NOT NULL DEFAULT 'staff',
    organization_id INTEGER REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'customer',
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    address TEXT,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    "priceRange" VARCHAR(10),
    rating DECIMAL(3,2) DEFAULT 0,
    "totalReviews" INTEGER DEFAULT 0,
    amenities JSONB,
    "openingHours" JSONB,
    images JSONB,
    "featuredImage" TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    "isBookingEnabled" BOOLEAN DEFAULT true,
    "bookingWindowStart" TIME,
    "bookingWindowEnd" TIME,
    "advanceBookingDays" INTEGER DEFAULT 7,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    "venueId" INTEGER REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    capacity INTEGER,
    "hourlyRate" DECIMAL(10,2),
    "isVIP" BOOLEAN DEFAULT false,
    condition VARCHAR(50),
    amenities JSONB,
    features JSONB,
    images JSONB,
    specs JSONB,
    "partySupport" JSONB,
    "view360Url" TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    "venueId" INTEGER REFERENCES venues(id),
    "roomId" INTEGER REFERENCES rooms(id),
    "userId" INTEGER REFERENCES users(id),
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP NOT NULL,
    "totalPrice" DECIMAL(10,2),
    status booking_status_enum DEFAULT 'pending',
    "customerName" VARCHAR(100),
    "customerPhone" VARCHAR(20),
    "specialRequests" TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    "bookingId" INTEGER REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    method payment_method_enum,
    status VARCHAR(50),
    "transactionId" VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    "venueId" INTEGER REFERENCES venues(id),
    "userId" INTEGER REFERENCES users(id),
    "userName" VARCHAR(100),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    "userId" INTEGER,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    "resourceId" VARCHAR(100),
    details JSONB,
    "ipAddress" VARCHAR(50),
    "userAgent" TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_staff_org ON staff(organization_id);
CREATE INDEX idx_venues_org ON venues(organization_id);
CREATE INDEX idx_rooms_org ON rooms(organization_id);
CREATE INDEX idx_bookings_org ON bookings(organization_id);
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
