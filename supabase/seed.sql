-- ==============================================================================
-- Fitness Planet Unisex Gym, Sikandrabad (Owner: Kapil Rajput)
-- "GymOS Cloud Edition" - Production Demo Seed Data
-- ==============================================================================

DO $$
DECLARE
  v_gym_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_plan_monthly UUID := '10000000-0000-0000-0000-000000000001'::uuid;
  v_plan_quarterly UUID := '10000000-0000-0000-0000-000000000002'::uuid;
  v_plan_halfyearly UUID := '10000000-0000-0000-0000-000000000003'::uuid;
  v_plan_annual UUID := '10000000-0000-0000-0000-000000000004'::uuid;
  v_plan_couple UUID := '10000000-0000-0000-0000-000000000005'::uuid;
  v_member_1 UUID := '20000000-0000-0000-0000-000000000091'::uuid;
  v_member_2 UUID := '20000000-0000-0000-0000-000000000092'::uuid;
  v_member_3 UUID := '20000000-0000-0000-0000-000000000093'::uuid;
  v_member_4 UUID := '20000000-0000-0000-0000-000000000094'::uuid;
  v_member_5 UUID := '20000000-0000-0000-0000-000000000095'::uuid;
  v_member_6 UUID := '20000000-0000-0000-0000-000000000096'::uuid;
BEGIN
  -- 1. GYM PROFILE (Fitness Planet Unisex Gym, Sikandrabad)
  INSERT INTO public.gyms (
    id, slug, name, owner_name, tagline, address, pincode, city, state, phone, email,
    opening_hours, upi_primary_id, upi_primary_name, upi_secondary_id, upi_secondary_name, default_upi_slot
  )
  VALUES (
    v_gym_id,
    'fitness-planet-sikandrabad',
    'Fitness Planet Unisex Gym',
    'Kapil Rajput',
    'Strong Is Universal • Gym & Health Club',
    'Near GT Road, Sikandrabad',
    '203205',
    'Sikandrabad',
    'Uttar Pradesh',
    '+91 9149183060',
    'fitnessplanet.sikandrabad@gmail.com',
    'Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM',
    '9149183060@paytm',
    'Fitness Planet Unisex Gym',
    'kapilrajput@okaxis',
    'Kapil Rajput (Owner)',
    'A'
  )
  ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    owner_name = EXCLUDED.owner_name,
    tagline = EXCLUDED.tagline,
    phone = EXCLUDED.phone,
    opening_hours = EXCLUDED.opening_hours,
    upi_primary_id = EXCLUDED.upi_primary_id,
    upi_primary_name = EXCLUDED.upi_primary_name,
    upi_secondary_id = EXCLUDED.upi_secondary_id,
    upi_secondary_name = EXCLUDED.upi_secondary_name;

  -- 2. PRE-LOADED FITNESS PLANET MEMBERSHIP OFFERS
  INSERT INTO public.membership_plans (
    id, gym_id, name, duration_days, price, admission_fee, description, perks, badge_text, is_active
  )
  VALUES 
    (
      v_plan_monthly, v_gym_id, 'Monthly General Fitness', 30, 1000.00, 200.00,
      'Standard 1-month full gym access for cardio & strength zones.',
      '["Cardio Zone Access", "Heavy Strength Equipment", "Locker Facility", "General Workout Chart"]'::jsonb,
      'Starter', true
    ),
    (
      v_plan_quarterly, v_gym_id, 'Quarterly Muscle Pro (3 Months)', 90, 2500.00, 0.00,
      'Popular 3-month strength & endurance package with free admission.',
      '["Full Equipment Access", "Customized Diet Chart", "Steam Bath Access", "Dedicated Locker"]'::jsonb,
      'Popular', true
    ),
    (
      v_plan_halfyearly, v_gym_id, 'Half-Yearly Shred & Tone (6 Months)', 180, 4500.00, 0.00,
      '6-month comprehensive fitness with certified trainer support.',
      '["Unlimited 2-Slot Access", "2 Free PT Sessions", "Personalized Nutrition Guide", "Guest Pass (1/mo)"]'::jsonb,
      'Best Value', true
    ),
    (
      v_plan_annual, v_gym_id, 'Annual Transformation VIP (12 Months)', 365, 8000.00, 0.00,
      'Full year premium membership with personal body composition analysis.',
      '["VIP Locker & Lounge", "Unlimited Steam & Sauna", "Monthly Body Fat Analysis", "Free Gym Shaker & T-Shirt"]'::jsonb,
      'VIP Champion', true
    ),
    (
      v_plan_couple, v_gym_id, 'Unisex Couple / Duo Package (3 Months)', 90, 4500.00, 0.00,
      'Special discounted 3-month package for couples and training partners.',
      '["Dual Access for 2 Members", "Cardio & Cross-Training", "Diet Consultation", "Shared Locker"]'::jsonb,
      'Couple Offer', true
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    duration_days = EXCLUDED.duration_days,
    perks = EXCLUDED.perks,
    badge_text = EXCLUDED.badge_text;

  -- 3. MEMBERS (Fitness Planet Entry Records e.g., FP-91 to FP-96)
  INSERT INTO public.members (
    id, gym_id, member_code, full_name, father_name, dob, age, gender, phone, email,
    address, pincode, plan_id, status, join_date, expiry_date, pending_dues, total_sessions,
    has_medical_condition, medical_details, taking_medication, emergency_contact_name, emergency_contact_phone
  )
  VALUES
    (
      v_member_1, v_gym_id, 'FP-91', 'Aman Sharma', 'Ramesh Sharma', '2001-04-12', 24, 'Male', '+91 9149100091', 'aman.sharma@example.com',
      'Mohalla Khatriyan, Sikandrabad', '203205', v_plan_annual, 'active', CURRENT_DATE - 60, CURRENT_DATE + 305, 0.00, 64,
      false, NULL, false, 'Ramesh Sharma', '+91 9897000001'
    ),
    (
      v_member_2, v_gym_id, 'FP-92', 'Pooja Rajput', 'Kapil Rajput', '2003-08-20', 22, 'Female', '+91 9149100092', 'pooja.rajput@example.com',
      'GT Road, Sikandrabad', '203205', v_plan_quarterly, 'active', CURRENT_DATE - 30, CURRENT_DATE + 60, 0.00, 32,
      false, NULL, false, 'Kapil Rajput', '+91 9149183060'
    ),
    (
      v_member_3, v_gym_id, 'FP-93', 'Kapil Bhati', 'Mahender Bhati', '1999-11-05', 26, 'Male', '+91 9149100093', 'kapil.bhati@example.com',
      'Near Bus Stand, Sikandrabad', '203205', v_plan_monthly, 'active', CURRENT_DATE - 15, CURRENT_DATE + 15, 0.00, 18,
      false, NULL, false, 'Mahender Bhati', '+91 9897000003'
    ),
    (
      v_member_4, v_gym_id, 'FP-94', 'Rohit Verma', 'Satish Verma', '1997-02-14', 28, 'Male', '+91 9149100094', 'rohit.verma@example.com',
      'Bara Bazaar, Sikandrabad', '203205', v_plan_monthly, 'expired', CURRENT_DATE - 45, CURRENT_DATE - 15, 500.00, 22,
      false, NULL, false, 'Satish Verma', '+91 9897000004'
    ),
    (
      v_member_5, v_gym_id, 'FP-95', 'Simran Kaur', 'Harpreet Singh', '2002-06-30', 23, 'Female', '+91 9149100095', 'simran.kaur@example.com',
      'Railway Road, Sikandrabad', '203205', v_plan_halfyearly, 'frozen', CURRENT_DATE - 40, CURRENT_DATE + 140, 0.00, 41,
      false, NULL, false, 'Harpreet Singh', '+91 9897000005'
    ),
    (
      v_member_6, v_gym_id, 'FP-96', 'Deepak Choudhary', 'Jagdish Choudhary', '2005-09-18', 20, 'Male', '+91 9149100096', 'deepak.c@example.com',
      'Gulaothi Road, Sikandrabad', '203205', v_plan_monthly, 'trial', CURRENT_DATE - 2, CURRENT_DATE + 5, 1000.00, 3,
      false, NULL, false, 'Jagdish Choudhary', '+91 9897000006'
    )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    member_code = EXCLUDED.member_code,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    expiry_date = EXCLUDED.expiry_date,
    pending_dues = EXCLUDED.pending_dues;

  -- 4. PAYMENTS & RECEIPTS
  INSERT INTO public.payments (
    id, gym_id, member_id, receipt_no, amount, payment_method, reference_id, notes, paid_at
  )
  VALUES
    (
      '30000000-0000-0000-0000-000000000091'::uuid, v_gym_id, v_member_1, 'RCP-2026-001',
      8000.00, 'UPI', 'UPI-FP-892104', 'Annual Transformation VIP paid in full to 9149183060@paytm', timezone('utc', now()) - interval '60 days'
    ),
    (
      '30000000-0000-0000-0000-000000000092'::uuid, v_gym_id, v_member_2, 'RCP-2026-002',
      2500.00, 'UPI', 'UPI-FP-892105', 'Quarterly Muscle Pro 3 months paid via Paytm UPI', timezone('utc', now()) - interval '30 days'
    ),
    (
      '30000000-0000-0000-0000-000000000093'::uuid, v_gym_id, v_member_3, 'RCP-2026-003',
      1200.00, 'CASH', 'CASH-REC-093', 'Monthly General fee (₹1000) + Admission (₹200) cash at reception', timezone('utc', now()) - interval '15 days'
    ),
    (
      '30000000-0000-0000-0000-000000000094'::uuid, v_gym_id, v_member_4, 'RCP-2026-004',
      500.00, 'UPI', 'UPI-FP-892106', 'Partial renewal payment (₹500 pending)', timezone('utc', now()) - interval '45 days'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 5. FLOOR ATTENDANCE LOGS (Active Morning/Evening Floor Sessions)
  INSERT INTO public.attendance_logs (
    id, gym_id, member_id, check_in_at, check_out_at, method
  )
  VALUES
    (
      '40000000-0000-0000-0000-000000000091'::uuid, v_gym_id, v_member_1,
      timezone('utc', now()) - interval '45 minutes', NULL, 'QR_SCAN'
    ),
    (
      '40000000-0000-0000-0000-000000000092'::uuid, v_gym_id, v_member_2,
      timezone('utc', now()) - interval '25 minutes', NULL, 'FRONT_DESK'
    ),
    (
      '40000000-0000-0000-0000-000000000093'::uuid, v_gym_id, v_member_3,
      timezone('utc', now()) - interval '10 minutes', NULL, 'QR_SCAN'
    ),
    (
      '40000000-0000-0000-0000-000000000094'::uuid, v_gym_id, v_member_4,
      timezone('utc', now()) - interval '1 day 2 hours', timezone('utc', now()) - interval '1 day 45 minutes', 'FRONT_DESK'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 6. LEADS PIPELINE (Local Sikandrabad Inquiries)
  INSERT INTO public.leads (
    id, gym_id, name, phone, stage, notes
  )
  VALUES
    (
      '50000000-0000-0000-0000-000000000091'::uuid, v_gym_id, 'Rahul Nagar', '+91 9149111111',
      'trial_booked', 'Inquired about evening weight training batch. Trial session booked for today 6 PM.'
    ),
    (
      '50000000-0000-0000-0000-000000000092'::uuid, v_gym_id, 'Anjali Tyagi', '+91 9149122222',
      'new_inquiry', 'Interested in unisex morning cardio and weight loss guidance.'
    ),
    (
      '50000000-0000-0000-0000-000000000093'::uuid, v_gym_id, 'Sandeep Bhati', '+91 9149133333',
      'follow_up', 'Visited gym yesterday. Interested in Unisex Couple / Duo Package for 3 months.'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 7. PUBLIC ADMISSIONS QUEUE (Walk-in Online Registrations)
  INSERT INTO public.admissions (
    id, gym_id, applicant_name, father_name, phone, gender, address, selected_plan_id, status, submitted_at
  )
  VALUES
    (
      '60000000-0000-0000-0000-000000000091'::uuid, v_gym_id, 'Neha Sharma', 'Rakesh Sharma', '+91 9149144444',
      'Female', 'Mohalla Sarai, Sikandrabad', v_plan_quarterly, 'pending', timezone('utc', now()) - interval '2 hours'
    ),
    (
      '60000000-0000-0000-0000-000000000092'::uuid, v_gym_id, 'Arjun Nagar', 'Devender Nagar', '+91 9149155555',
      'Male', 'Dankaur Road, Sikandrabad', v_plan_annual, 'pending', timezone('utc', now()) - interval '45 minutes'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 8. GYM STAFF (Roles: Owner, Manager, Reception)
  INSERT INTO public.gym_staff (
    id, gym_id, full_name, email, phone, role, status
  )
  VALUES
    (
      '70000000-0000-0000-0000-000000000091'::uuid, v_gym_id,
      'Kapil Rajput', 'kapilrajput.fp@gmail.com', '+91 9149183060', 'owner', 'active'
    ),
    (
      '70000000-0000-0000-0000-000000000092'::uuid, v_gym_id,
      'Sachin Kumar', 'sachin.fp@gmail.com', '+91 9149183061', 'manager', 'active'
    ),
    (
      '70000000-0000-0000-0000-000000000093'::uuid, v_gym_id,
      'Priya Chauhan', 'priya.fp@gmail.com', '+91 9149183062', 'reception', 'active'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 9. IMMUTABLE AUDIT TRAIL
  INSERT INTO public.audit_logs (
    gym_id, action, entity_type, entity_id, performed_by_email, details, created_at
  )
  VALUES
    (
      v_gym_id, 'SYSTEM_INIT', 'GYM', v_gym_id::text, 'system@gymos.cloud',
      'GymOS Cloud instance initialized for Fitness Planet Unisex Gym, Sikandrabad',
      timezone('utc', now()) - interval '60 days'
    ),
    (
      v_gym_id, 'OFFER_PUBLISHED', 'SETTINGS', v_plan_annual::text, 'kapilrajput.fp@gmail.com',
      'Annual Transformation VIP offer (₹8,000) activated for Sikandrabad branch',
      timezone('utc', now()) - interval '59 days'
    ),
    (
      v_gym_id, 'MEMBER_ENROLLED', 'MEMBER', v_member_1::text, 'sachin.fp@gmail.com',
      'Aman Sharma enrolled with code FP-91 on Annual Transformation VIP plan',
      timezone('utc', now()) - interval '60 days'
    ),
    (
      v_gym_id, 'PAYMENT_RECEIVED', 'PAYMENT_REQUEST', '30000000-0000-0000-0000-000000000091', 'sachin.fp@gmail.com',
      'Payment RCP-2026-001 (₹8000) received via UPI for Aman Sharma',
      timezone('utc', now()) - interval '60 days'
    );

END $$;
