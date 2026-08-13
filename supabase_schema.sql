-- =====================================================================
-- KaizerStays PMS — Complete Supabase PostgreSQL Production Schema & Seed Data
-- Hotel Property: Hotel Shemron, Neemrana (Property ID: 62a25484e5)
-- Live Account: ninaad.khera19@gmail.com
-- Physical Inventory: 32 Rooms (28 Deluxe Rooms, 2 Twin Rooms, 2 Suite Rooms)
-- =====================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Types & Enums
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
    CREATE TYPE request_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Organizations / Property Metadata
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Hotel Shemron, Neemrana',
    property_id VARCHAR(100) DEFAULT '62a25484e5',
    address TEXT DEFAULT 'NH-48, Shahjahanpur, Neemrana, Rajasthan 301706',
    phone VARCHAR(50) DEFAULT '+91 99994 90100',
    email VARCHAR(255) DEFAULT 'ninaad.khera19@gmail.com',
    gstin VARCHAR(50) DEFAULT '08AABCT1332L1ZR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure property_id column exists on pre-existing organizations table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS property_id VARCHAR(100) DEFAULT '62a25484e5';

-- 4. Staff & Owner Users
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

-- 5. Room Categories (Room Types)
CREATE TABLE IF NOT EXISTS public.room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    base_rate NUMERIC(10, 2) NOT NULL,
    total_count INT DEFAULT 2,
    max_occupancy INT DEFAULT 2,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS total_count INT DEFAULT 28;

-- 6. Physical Rooms (32 Rooms: 28 Deluxe, 2 Twin, 2 Suite)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(20) UNIQUE NOT NULL,
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL,
    room_type_code VARCHAR(50) DEFAULT 'deluxe-room',
    floor INT DEFAULT 1,
    status room_status DEFAULT 'AVAILABLE',
    is_clean BOOLEAN DEFAULT TRUE,
    housekeeping_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS room_type_code VARCHAR(50) DEFAULT 'deluxe-room';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS housekeeping_notes TEXT;

-- 7. Guests CRM Ledger
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100) DEFAULT 'New Delhi',
    country VARCHAR(100) DEFAULT 'India',
    is_vip BOOLEAN DEFAULT FALSE,
    total_stays INT DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    total_nights INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS total_nights INT DEFAULT 0;

-- 8. Reservations Ledger
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confirmation_number VARCHAR(100) UNIQUE NOT NULL,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    room_number VARCHAR(20),
    room_type VARCHAR(100) NOT NULL,
    status reservation_status DEFAULT 'CONFIRMED',
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INT DEFAULT 1,
    adults INT DEFAULT 2,
    children INT DEFAULT 0,
    booking_source VARCHAR(100) DEFAULT 'AIOSELL_CHANNEL_MANAGER',
    room_rate NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    balance_amount NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Folio Charges
CREATE TABLE IF NOT EXISTS public.folio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'ROOM_CHARGE',
    amount NUMERIC(10, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Payments Ledger
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    guest_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(50) DEFAULT 'UPI',
    status VARCHAR(50) DEFAULT 'COMPLETED',
    reference VARCHAR(255),
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. GST Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    guest_gstin VARCHAR(50),
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PAID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Housekeeping Tasks
CREATE TABLE IF NOT EXISTS public.housekeeping_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(20) NOT NULL,
    room_type VARCHAR(100),
    task_type VARCHAR(100) DEFAULT 'FULL_CLEAN',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'PENDING',
    assigned_to VARCHAR(100),
    floor INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Front Desk & Guest Requests (QR Code / Phone Call)
CREATE TABLE IF NOT EXISTS public.guest_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(20) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    request_type VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INT DEFAULT 1,
    status request_status DEFAULT 'PENDING',
    priority request_priority DEFAULT 'MEDIUM',
    source VARCHAR(50) DEFAULT 'FRONT_DESK_CALL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Financial Expenses Ledger
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Night Audits Log
CREATE TABLE IF NOT EXISTS public.night_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    rooms_charged INT NOT NULL,
    revenue_posted NUMERIC(12, 2) NOT NULL,
    tax_collected NUMERIC(12, 2) NOT NULL,
    open_folios INT DEFAULT 0,
    run_by VARCHAR(255) DEFAULT 'System',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. System Audit & Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    user_name VARCHAR(255) DEFAULT 'System Engine',
    detail TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'CheckCircle',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Aiosell API Audit Trail Logs
CREATE TABLE IF NOT EXISTS public.aiosell_api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(10) NOT NULL,
    endpoint TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    http_code INT NOT NULL,
    summary TEXT NOT NULL,
    payload JSONB
);

-- =====================================================================
-- PRE-SEEDED PROD DATA FOR HOTEL SHEMRON NEEMRANA (32 ROOMS)
-- =====================================================================

-- 1. Seed Organization
INSERT INTO public.organizations (id, name, property_id, address, email, gstin)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Hotel Shemron, Neemrana',
    '62a25484e5',
    'NH-48, Shahjahanpur, Neemrana, Rajasthan 301706',
    'ninaad.khera19@gmail.com',
    '08AABCT1332L1ZR'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    property_id = EXCLUDED.property_id,
    address = EXCLUDED.address,
    email = EXCLUDED.email;

-- 2. Seed Owner Account (Ninaad Khera / ninaad.khera19@gmail.com / Passcode: 12345)
INSERT INTO public.staff_users (staff_id, organization_id, first_name, last_name, email, phone, role, password_hash)
VALUES (
    'OWNER-001',
    'a0000000-0000-0000-0000-000000000001',
    'Ninaad',
    'Khera',
    'ninaad.khera19@gmail.com',
    '+91 99994 90100',
    'OWNER',
) ON CONFLICT (staff_id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash;

-- 3. Seed Room Categories (Deluxe ₹2,800, Twin ₹2,800, Suite ₹5,500)
INSERT INTO public.room_types (id, name, code, base_rate, total_count, max_occupancy, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'Deluxe Room', 'deluxe-room', 2800.00, 28, 2, 'Spacious king-bed deluxe room with high-speed WiFi, work desk, and ensuite bath.'),
('b0000000-0000-0000-0000-000000000002', 'Twin Room', 'twin-room', 2800.00, 2, 2, 'Comfortable room with two individual twin beds, premium linens, LED TV, and modern amenities.'),
('b0000000-0000-0000-0000-000000000003', 'Suite Room', 'suite-room', 5500.00, 2, 2, 'Premium luxury suite with separate living area, plush bedding, balcony view, and luxury toiletries.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    base_rate = EXCLUDED.base_rate,
    total_count = EXCLUDED.total_count;

-- 4. Seed 32 Physical Rooms for Hotel Shemron (Neemrana)
-- Floor 1 Deluxe Rooms (14 rooms: 101 to 114)
INSERT INTO public.rooms (room_number, room_type_id, room_type_code, floor, status, is_clean) VALUES
('101', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('102', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('103', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('104', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('105', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('106', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('107', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('108', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('109', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('110', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('111', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('112', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('113', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),
('114', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 1, 'AVAILABLE', TRUE),

-- Floor 3 Deluxe Rooms (14 rooms: 301 to 315, skipping 313)
('301', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('302', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('303', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('304', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('305', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('306', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('307', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('308', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('309', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('310', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('311', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('312', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('314', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),
('315', 'b0000000-0000-0000-0000-000000000001', 'deluxe-room', 3, 'AVAILABLE', TRUE),

-- Floor 3 Twin Rooms (2 rooms: 316 to 317)
('316', 'b0000000-0000-0000-0000-000000000002', 'twin-room', 3, 'AVAILABLE', TRUE),
('317', 'b0000000-0000-0000-0000-000000000002', 'twin-room', 3, 'AVAILABLE', TRUE),

-- Floor 3 Suite Rooms (2 rooms: 318 to 319)
('318', 'b0000000-0000-0000-0000-000000000003', 'suite-room', 3, 'AVAILABLE', TRUE),
('319', 'b0000000-0000-0000-0000-000000000003', 'suite-room', 3, 'AVAILABLE', TRUE)
ON CONFLICT (room_number) DO UPDATE SET
    room_type_id = EXCLUDED.room_type_id,
    room_type_code = EXCLUDED.room_type_code;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- =====================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.night_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aiosell_api_logs ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon/Authenticated Access Policies across all tables
DROP POLICY IF EXISTS "Allow all on organizations" ON public.organizations;
CREATE POLICY "Allow all on organizations" ON public.organizations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on staff_users" ON public.staff_users;
CREATE POLICY "Allow all on staff_users" ON public.staff_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on room_types" ON public.room_types;
CREATE POLICY "Allow all on room_types" ON public.room_types FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on rooms" ON public.rooms;
CREATE POLICY "Allow all on rooms" ON public.rooms FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on reservations" ON public.reservations;
CREATE POLICY "Allow all on reservations" ON public.reservations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on guests" ON public.guests;
CREATE POLICY "Allow all on guests" ON public.guests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on folio_items" ON public.folio_items;
CREATE POLICY "Allow all on folio_items" ON public.folio_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on payments" ON public.payments;
CREATE POLICY "Allow all on payments" ON public.payments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on invoices" ON public.invoices;
CREATE POLICY "Allow all on invoices" ON public.invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on housekeeping_tasks" ON public.housekeeping_tasks;
CREATE POLICY "Allow all on housekeeping_tasks" ON public.housekeeping_tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on guest_requests" ON public.guest_requests;
CREATE POLICY "Allow all on guest_requests" ON public.guest_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on expenses" ON public.expenses;
CREATE POLICY "Allow all on expenses" ON public.expenses FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on night_audits" ON public.night_audits;
CREATE POLICY "Allow all on night_audits" ON public.night_audits FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow all on activity_logs" ON public.activity_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on aiosell_api_logs" ON public.aiosell_api_logs;
CREATE POLICY "Allow all on aiosell_api_logs" ON public.aiosell_api_logs FOR ALL USING (true);

-- Schema Complete & Ready for Production Deployment!
