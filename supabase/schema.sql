-- ==============================================================================
-- Fitness Planet Unisex Gym, Sikandrabad (Owner: Kapil Rajput)
-- "GymOS Cloud Edition" - PostgreSQL Production Database Schema
-- Supabase Project: zzsgutmvpprwaozecsje.supabase.co
-- ==============================================================================

-- 1. GYMS (Tenant Table)
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL DEFAULT 'fitness-planet-sikandrabad',
  name TEXT NOT NULL DEFAULT 'Fitness Planet Unisex Gym',
  owner_name TEXT NOT NULL DEFAULT 'Kapil Rajput',
  tagline TEXT DEFAULT 'Strong Is Universal • Gym & Health Club',
  address TEXT DEFAULT 'Sikandrabad',
  pincode TEXT DEFAULT '203205',
  city TEXT DEFAULT 'Sikandrabad',
  state TEXT DEFAULT 'Uttar Pradesh',
  phone TEXT DEFAULT '+91 9149183060',
  email TEXT DEFAULT 'fitnessplanet.sikandrabad@gmail.com',
  logo_url TEXT,
  opening_hours TEXT DEFAULT 'Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM',
  upi_primary_id TEXT DEFAULT '9149183060@paytm',
  upi_primary_name TEXT DEFAULT 'Fitness Planet Unisex Gym',
  upi_secondary_id TEXT DEFAULT 'kapilrajput@okaxis',
  upi_secondary_name TEXT DEFAULT 'Kapil Rajput (Owner)',
  default_upi_slot TEXT DEFAULT 'A' CHECK (default_upi_slot IN ('A', 'B')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 2. MEMBERSHIP PLANS (Pre-loaded with Fitness Planet Offers)
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  admission_fee NUMERIC DEFAULT 0 CHECK (admission_fee >= 0),
  description TEXT,
  perks JSONB DEFAULT '[]'::jsonb,
  badge_text TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 3. MEMBERS (Includes all Fitness Planet Entry Form fields)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_code TEXT NOT NULL, -- e.g., FP-91, FP-92, FP-93, FP-94
  full_name TEXT NOT NULL,
  father_name TEXT,
  dob DATE,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT DEFAULT 'Sikandrabad',
  pincode TEXT DEFAULT '203205',
  aadhar_number TEXT,
  photo_url TEXT,
  signature_url TEXT,
  plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'frozen', 'trial')),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  pending_dues NUMERIC DEFAULT 0 CHECK (pending_dues >= 0),
  total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
  has_medical_condition BOOLEAN DEFAULT false,
  medical_details TEXT,
  taking_medication BOOLEAN DEFAULT false,
  emergency_contact_name TEXT,
  emergency_contact_relation TEXT,
  emergency_contact_phone TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  CONSTRAINT members_gym_id_member_code_key UNIQUE (gym_id, member_code)
);

-- 4. PAYMENTS & RECEIPTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  receipt_no TEXT NOT NULL, -- e.g., RCP-2026-001
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER')),
  reference_id TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  CONSTRAINT payments_gym_id_receipt_no_key UNIQUE (gym_id, receipt_no)
);

-- 5. FLOOR ATTENDANCE LOGS
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  check_out_at TIMESTAMPTZ, -- null means currently on floor
  method TEXT CHECK (method IN ('QR_SCAN', 'FRONT_DESK')) DEFAULT 'FRONT_DESK',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 6. PUBLIC ADMISSIONS QUEUE
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  father_name TEXT,
  phone TEXT NOT NULL,
  gender TEXT,
  address TEXT,
  selected_plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 7. LEADS PIPELINE
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  stage TEXT DEFAULT 'new_inquiry' CHECK (stage IN ('new_inquiry', 'contacted', 'trial_booked', 'follow_up', 'converted', 'lost')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 8. STAFF ROLES (Owner, Manager, Reception)
CREATE TABLE IF NOT EXISTS public.gym_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'reception' CHECK (role IN ('owner', 'manager', 'reception')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 9. IMMUTABLE AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  performed_by_email TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 10. ADMIN LOGIN CREDENTIALS (Protected by RLS + SECURITY DEFINER RPCs)
CREATE TABLE IF NOT EXISTS public.gym_auth_credentials (
  gym_id UUID PRIMARY KEY REFERENCES public.gyms(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  session_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- PERFORMANCE & HIGH-SPEED QUERY INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_gyms_owner_id ON public.gyms(owner_id);
CREATE INDEX IF NOT EXISTS idx_gyms_slug ON public.gyms(slug);
CREATE INDEX IF NOT EXISTS idx_membership_plans_gym_id ON public.membership_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON public.members(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_code ON public.members(gym_id, member_code);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON public.members(gym_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON public.payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(gym_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_active ON public.attendance_logs(gym_id) WHERE check_out_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_logs_recent ON public.attendance_logs(gym_id, check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_gym_staff_gym_id ON public.gym_staff(gym_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_gym_id ON public.audit_logs(gym_id, created_at DESC);

-- Enable Supabase Realtime publications across gym tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'gyms',
    'membership_plans',
    'members',
    'payments',
    'attendance_logs',
    'leads',
    'admissions',
    'gym_staff',
    'audit_logs'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
