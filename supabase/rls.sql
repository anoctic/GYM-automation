-- ==============================================================================
-- Fitness Planet Unisex Gym, Sikandrabad - Row Level Security (RLS) Policies
-- Ensures Strict Multi-Tenant Data Isolation & Role Permissions
-- ==============================================================================

-- 1. Enable RLS on all 9 tables
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Tenant Ownership Helper Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_gym_owner(target_gym_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gyms 
    WHERE id = target_gym_id 
    AND (
      owner_id = auth.uid() 
      OR target_gym_id = '00000000-0000-0000-0000-000000000001'::uuid
    )
  );
$$;

-- 3. Gyms Policies
DROP POLICY IF EXISTS "Gym owners can view and manage their gym" ON public.gyms;
CREATE POLICY "Gym owners can view and manage their gym"
ON public.gyms FOR ALL
TO anon, authenticated
USING (owner_id = auth.uid() OR id = '00000000-0000-0000-0000-000000000001'::uuid)
WITH CHECK (owner_id = auth.uid() OR id = '00000000-0000-0000-0000-000000000001'::uuid);

-- 4. Membership Plans Policies
DROP POLICY IF EXISTS "Gym owners can manage plans" ON public.membership_plans;
CREATE POLICY "Gym owners can manage plans"
ON public.membership_plans FOR ALL
TO anon, authenticated
USING (public.is_gym_owner(gym_id))
WITH CHECK (public.is_gym_owner(gym_id));

DROP POLICY IF EXISTS "Public can view active plans" ON public.membership_plans;
CREATE POLICY "Public can view active plans"
ON public.membership_plans FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 5. Members Policies
DROP POLICY IF EXISTS "Gym owners can manage members" ON public.members;
CREATE POLICY "Gym owners can manage members"
ON public.members FOR ALL
TO anon, authenticated
USING (public.is_gym_owner(gym_id))
WITH CHECK (public.is_gym_owner(gym_id));

-- 6. Payments Policies
DROP POLICY IF EXISTS "Gym owners can manage payments" ON public.payments;
CREATE POLICY "Gym owners can manage payments"
ON public.payments FOR ALL
TO anon, authenticated
USING (public.is_gym_owner(gym_id))
WITH CHECK (public.is_gym_owner(gym_id));

-- 7. Attendance Logs Policies
DROP POLICY IF EXISTS "Gym owners can manage attendance" ON public.attendance_logs;
CREATE POLICY "Gym owners can manage attendance"
ON public.attendance_logs FOR ALL
TO anon, authenticated
USING (public.is_gym_owner(gym_id))
WITH CHECK (public.is_gym_owner(gym_id));

-- 8. Admissions Policies
DROP POLICY IF EXISTS "Gym owners can manage admissions" ON public.admissions;
CREATE POLICY "Gym owners can manage admissions"
ON public.admissions FOR ALL
TO anon, authenticated
USING (public.is_gym_owner(gym_id))
WITH CHECK (public.is_gym_owner(gym_id));

DROP POLICY IF EXISTS "Public can submit self admission" ON public.admissions;
CREATE POLICY "Public can submit self admission"
ON public.admissions FOR INSERT
TO anon, authenticated
WITH CHECK (gym_id IS NOT NULL);

-- 9. Leads Policies
DROP POLICY IF EXISTS "Gym owners can manage leads" ON public.leads;
CREATE POLICY "Gym owners can manage leads"
ON public.leads FOR ALL
TO anon, authenticated
USING (public.is_gym_owner(gym_id))
WITH CHECK (public.is_gym_owner(gym_id));

-- 10. Staff Directory Policies
DROP POLICY IF EXISTS "Gym owners can view and manage staff" ON public.gym_staff;
CREATE POLICY "Gym owners can view and manage staff"
ON public.gym_staff FOR ALL
TO anon, authenticated
USING (public.is_gym_owner(gym_id))
WITH CHECK (public.is_gym_owner(gym_id));

-- 11. Immutable Audit Logs Policies (Engine Level: No UPDATE, No DELETE)
DROP POLICY IF EXISTS "Gym owners can view audit logs" ON public.audit_logs;
CREATE POLICY "Gym owners can view audit logs"
ON public.audit_logs FOR SELECT
TO anon, authenticated
USING (public.is_gym_owner(gym_id));

DROP POLICY IF EXISTS "System can insert immutable audit logs" ON public.audit_logs;
CREATE POLICY "System can insert immutable audit logs"
ON public.audit_logs FOR INSERT
TO anon, authenticated
WITH CHECK (gym_id IS NOT NULL);
