-- =====================================================================
-- StaySphere OS — Complete Supabase PostgreSQL Schema & Seed Data
-- Hotel Name: Hotel Shemron, Neemrana
-- Primary Owner: Ninaad Khera (Ninaad.khera@gmail.com / Passcode: 12345)
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Custom Types / Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'GENERAL_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'CHEF', 'FINANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE room_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'DIRTY', 'OUT_OF_SERVICE', 'INSPECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kot_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) DEFAULT 'StaySphere OS',
    address TEXT DEFAULT 'NH-48, Delhi-Jaipur Highway, Neemrana, Rajasthan 301705',
    phone VARCHAR(50) DEFAULT '+91 1494 228 800',
    email VARCHAR(255) DEFAULT 'frontdesk@hotelshemron.com',
    gstin VARCHAR(50) DEFAULT '08AABCT1332L1ZR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Staff & Owner Users Table
CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(100) DEFAULT 'FRONT_DESK',
    department VARCHAR(100) DEFAULT 'Operations',
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Room Categories Table
CREATE TABLE IF NOT EXISTS public.room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    base_rate NUMERIC(10, 2) NOT NULL,
    max_occupancy INT DEFAULT 2,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(20) UNIQUE NOT NULL,
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL,
    floor INT DEFAULT 1,
    status room_status DEFAULT 'AVAILABLE',
    is_clean BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Guests CRM Table
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    city VARCHAR(100) DEFAULT 'New Delhi',
    country VARCHAR(100) DEFAULT 'India',
    is_vip BOOLEAN DEFAULT FALSE,
    total_stays INT DEFAULT 1,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Reservations Table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confirmation_number VARCHAR(100) UNIQUE NOT NULL,
    guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    status reservation_status DEFAULT 'CONFIRMED',
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INT DEFAULT 1,
    adults INT DEFAULT 2,
    children INT DEFAULT 0,
    booking_source VARCHAR(50) DEFAULT 'DIRECT',
    room_rate NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    balance_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create Folio Items Table
CREATE TABLE IF NOT EXISTS public.folio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'ROOM_CHARGE',
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create Kitchen Orders (POS) Table
CREATE TABLE IF NOT EXISTS public.kitchen_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kot_number VARCHAR(50) NOT NULL,
    table_number INT NOT NULL,
    room_number VARCHAR(20),
    status kot_status DEFAULT 'PENDING',
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    charged_to_room BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create Night Audits Log Table
CREATE TABLE IF NOT EXISTS public.night_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    rooms_charged INT NOT NULL,
    revenue_posted NUMERIC(12, 2) NOT NULL,
    tax_collected NUMERIC(12, 2) NOT NULL,
    open_folios INT DEFAULT 0,
    run_by VARCHAR(255) DEFAULT 'Ninaad Khera',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Create Activity Audit Trail Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    user_name VARCHAR(255) DEFAULT 'Ninaad Khera',
    detail TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- PRE-SEEDED DATA FOR HOTEL SHEMRON NEEMRANA (Hotel ID: 62a25484e5)
-- =====================================================================

-- Seed Organization
INSERT INTO public.organizations (id, name, address, email, gstin)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Hotel Shemron, Neemrana',
    'NH-8, Shahjahanpur, Neemrana, Rajasthan 301706',
    'ninaad.khera19@gmail.com',
    '08AABCT1332L1ZR'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    email = EXCLUDED.email;

-- Seed Owner Credentials (Ninaad Khera / Ninaad.khera@gmail.com / Passcode: 12345)
INSERT INTO public.staff_users (staff_id, organization_id, first_name, last_name, email, phone, role, password_hash)
VALUES (
    'OWNER-001',
    'a0000000-0000-0000-0000-000000000001',
    'Ninaad',
    'Khera',
    'Ninaad.khera@gmail.com',
    '+91 99994 90100',
    'OWNER',
    crypt('12345', gen_salt('bf'))
) ON CONFLICT (email) DO NOTHING;

-- Seed Room Categories (Hotel Shemron: 26 Deluxe, 2 Twin, 2 Suite)
INSERT INTO public.room_types (id, name, code, base_rate, max_occupancy, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'Deluxe Room', 'DELUXE', 2800.00, 2, 'Spacious king-bed deluxe room with high-speed WiFi, work desk, and ensuite bath.'),
('b0000000-0000-0000-0000-000000000002', 'Twin Room', 'TWIN', 2800.00, 2, 'Comfortable room with two individual twin beds, premium linens, LED TV, and modern amenities.'),
('b0000000-0000-0000-0000-000000000003', 'Suite Room', 'SUITE', 5500.00, 2, 'Premium luxury suite with separate living area, plush bedding, balcony view, and luxury toiletries.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    base_rate = EXCLUDED.base_rate;

-- Seed 32 Physical Rooms for Hotel Shemron (Neemrana)
-- Floor 1 Deluxe Rooms (14 rooms: 101 to 114)
INSERT INTO public.rooms (room_number, room_type_id, floor, status, is_clean) VALUES
('101', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('102', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('103', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('104', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('105', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('106', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('107', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('108', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('109', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('110', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('111', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('112', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('113', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
('114', 'b0000000-0000-0000-0000-000000000001', 1, 'AVAILABLE', TRUE),
-- Floor 3 Deluxe Rooms (14 rooms: 301 to 315, skipping 313)
('301', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('302', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('303', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('304', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('305', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('306', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('307', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('308', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('309', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('310', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('311', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('312', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('314', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
('315', 'b0000000-0000-0000-0000-000000000001', 3, 'AVAILABLE', TRUE),
-- Floor 3 Twin Rooms (2 rooms: 316 to 317)
('316', 'b0000000-0000-0000-0000-000000000002', 3, 'AVAILABLE', TRUE),
('317', 'b0000000-0000-0000-0000-000000000002', 3, 'AVAILABLE', TRUE),
-- Floor 3 Suite Rooms (2 rooms: 318 to 319)
('318', 'b0000000-0000-0000-0000-000000000003', 3, 'AVAILABLE', TRUE),
('319', 'b0000000-0000-0000-0000-000000000003', 3, 'AVAILABLE', TRUE)
ON CONFLICT (room_number) DO NOTHING;

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Allow Public/Authenticated Access Policies (Idempotent)
DROP POLICY IF EXISTS "Allow public read access on organizations" ON public.organizations;
CREATE POLICY "Allow public read access on organizations" ON public.organizations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on staff_users" ON public.staff_users;
CREATE POLICY "Allow public read access on staff_users" ON public.staff_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public all on rooms" ON public.rooms;
CREATE POLICY "Allow public all on rooms" ON public.rooms FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public all on reservations" ON public.reservations;
CREATE POLICY "Allow public all on reservations" ON public.reservations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public all on guests" ON public.guests;
CREATE POLICY "Allow public all on guests" ON public.guests FOR ALL USING (true);

-- Done!
