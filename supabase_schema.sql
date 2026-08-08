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
-- PRE-SEEDED DATA FOR HOTEL SHEMRON NEEMRANA
-- =====================================================================

-- Seed Organization
INSERT INTO public.organizations (id, name, address, email, gstin)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Hotel Shemron, Neemrana',
    'NH-48, Delhi-Jaipur Highway, Neemrana, Rajasthan 301705',
    'frontdesk@hotelshemron.com',
    '08AABCT1332L1ZR'
) ON CONFLICT (id) DO NOTHING;

-- Seed Owner Credentials (Ninaad Khera / Ninaad.khera@gmail.com / Passcode: 12345)
INSERT INTO public.staff_users (staff_id, organization_id, first_name, last_name, email, phone, role, password_hash)
VALUES (
    'OWNER-001',
    'a0000000-0000-0000-0000-000000000001',
    'Ninaad',
    'Khera',
    'Ninaad.khera@gmail.com',
    '+91 98100 12345',
    'OWNER',
    crypt('12345', gen_salt('bf'))
) ON CONFLICT (email) DO NOTHING;

-- Seed Room Categories
INSERT INTO public.room_types (name, code, base_rate, max_occupancy) VALUES
('Standard Room', 'STD', 3500.00, 2),
('Deluxe Room', 'DLX', 5500.00, 2),
('Premium Suite', 'STE', 8500.00, 3),
('Royal Heritage Suite', 'RYL', 14500.00, 4)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Allow Public/Authenticated Access Policies
CREATE POLICY "Allow public read access on organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow public read access on staff_users" ON public.staff_users FOR SELECT USING (true);
CREATE POLICY "Allow public all on rooms" ON public.rooms FOR ALL USING (true);
CREATE POLICY "Allow public all on reservations" ON public.reservations FOR ALL USING (true);
CREATE POLICY "Allow public all on guests" ON public.guests FOR ALL USING (true);

-- Done!
