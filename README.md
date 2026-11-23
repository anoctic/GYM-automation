# GymOS Cloud Edition — Fitness Planet Unisex Gym, Sikandrabad

A production-ready, full-stack multi-tenant Gym Management SaaS platform built with **Next.js (App Router, React 19, TypeScript, Tailwind CSS)** and **Supabase (PostgreSQL + Auth + Storage)**.

Custom-tailored and pre-configured for:
- **Gym Name:** Fitness Planet Unisex Gym
- **Owner:** Kapil Rajput
- **Location:** Sikandrabad, Uttar Pradesh (Pincode: 203205)
- **Contact:** +91 9149183060
- **Email:** fitnessplanet.sikandrabad@gmail.com
- **Operating Hours:** Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM
- **Dual UPI Gateways:** Primary (`9149183060@paytm` - Fitness Planet Unisex Gym) & Secondary (`kapilrajput@okaxis` - Kapil Rajput)
- **Kiosk Slug:** `fitness-planet-sikandrabad`
- **GitHub Repository:** [https://github.com/anoctic/GYM-automation.git](https://github.com/anoctic/GYM-automation.git)
- **Supabase Project:** `zzsgutmvpprwaozecsje` (`https://zzsgutmvpprwaozecsje.supabase.co`)

---

## 🏛️ 1. Multi-Tenant Architecture & Auth

### Strict Row-Level Security (RLS)
- Every database table includes `gym_id` (`UUID REFERENCES public.gyms(id) ON DELETE CASCADE`).
- All 9 tables enforce strict Supabase PostgreSQL RLS policies through the security-definer helper `public.is_gym_owner(target_gym_id)`.
- A gym owner/staff can **only access and modify data belonging to their own gym**.

### Live Demo Mode Bypass
- A zero-friction "Live Demo Mode" toggle (`gymos_demo_mode=true` cookie) provides a full sandbox experience with Fitness Planet Unisex Gym pre-loaded data without requiring authentication.
- Demo mode resolves to tenant `00000000-0000-0000-0000-000000000001` ("Fitness Planet Unisex Gym, Sikandrabad").
- Seamlessly switch between Authenticated Owner Mode and Live Demo Mode from the navigation bar.

---

## 📊 2. PostgreSQL Database Schema (`supabase/`)

### Tables Overview
1. **`gyms`**: Tenant root table storing gym branding, owner name (`Kapil Rajput`), slug (`fitness-planet-sikandrabad`), address, operating hours, and Dual UPI configurations.
2. **`membership_plans`**: Pre-loaded with official Fitness Planet offers:
   - *Monthly General Fitness* (₹1,000 / 30 Days)
   - *Quarterly Muscle Pro* (₹2,500 / 90 Days)
   - *Half-Yearly Shred & Tone* (₹4,500 / 180 Days)
   - *Annual Transformation VIP* (₹8,000 / 365 Days)
   - *Unisex Couple / Duo Package* (₹4,500 / 90 Days)
3. **`members`**: Complete member profile with Fitness Planet entry form fields:
   - `member_code` (e.g., `FP-91`, `FP-92`, `FP-93`, `FP-94`)
   - `full_name`, `father_name`, `dob`, `age`, `gender` ('Male' | 'Female' | 'Other')
   - `phone`, `email`, `address`, `pincode`, `aadhar_number`, `photo_url`, `signature_url`
   - `plan_id`, `status` ('active' | 'expired' | 'frozen' | 'trial'), `join_date`, `expiry_date`
   - `pending_dues`, `total_sessions`, `deleted_at` (soft-delete & recovery)
   - `has_medical_condition`, `medical_details`, `taking_medication`
   - `emergency_contact_name`, `emergency_contact_relation`, `emergency_contact_phone`
4. **`payments`**: Payment receipts (`receipt_no` format `RCP-2026-001`), amount, payment method (`UPI`, `CASH`, `BANK_TRANSFER`), transaction reference, notes, and timestamps.
5. **`attendance_logs`**: Floor check-in/out (`check_out_at IS NULL` represents members currently working out on the gym floor), method (`QR_SCAN`, `FRONT_DESK`).
6. **`admissions`**: Public walk-in admission queue (`applicant_name`, `father_name`, `phone`, `gender`, `address`, `selected_plan_id`, `status`: 'pending' | 'approved' | 'rejected').
7. **`leads`**: CRM pipeline for local inquiries (`new_inquiry`, `contacted`, `trial_booked`, `follow_up`, `converted`, `lost`).
8. **`gym_staff`**: Staff RBAC (`owner`, `manager`, `reception`) enforcing role permissions (reception cannot delete members or edit financial UPI routing).
9. **`audit_logs`**: Engine-level immutable security log (`SELECT` and `INSERT` only; no `UPDATE` or `DELETE` allowed).

---

## ⚡ 3. Core Server Actions & Routes

| Module | Route / File | Key Capabilities |
| :--- | :--- | :--- |
| **Public Kiosk** | `/checkin/fitness-planet-sikandrabad` | Self check-in/check-out keypad, auto-detects `FP-` prefix, live floor counter, audio-visual feedback, and 4-second auto-reset. |
| **Walk-in Admission** | `/join/[gym_id]` | Public membership enrollment form with plan selection, father's name, gender, and address. |
| **Members Directory** | `/members` | Member lifecycle: enroll, renew, freeze/unfreeze, collect dues, soft-delete, and trash restore. |
| **Floor Monitoring** | `/floor` | Live floor occupancy counter, single check-out, and bulk checkout all floor sessions. |
| **Membership Plans** | `/plans` | Create, edit, toggle active/inactive plans and perks. |
| **Reports & Export** | `/api/reports/xlsx` | 9-Sheet Excel report generator with formula-injection sanitization (`=`, `+`, `-`, `@` escaping). |
| **Settings & Security** | `/settings` | Dual UPI slot toggle (Slot A / B), Staff management, 2FA (TOTP), and live immutable audit trail. |

---

## 🚀 4. Setup & Running Locally

### 1. Environment Variables (`.env.local`)
Create `.env.local` using `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zzsgutmvpprwaozecsje.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

NEXT_PUBLIC_DEMO_GYM_ID=00000000-0000-0000-0000-000000000001
NEXT_PUBLIC_APP_NAME="Fitness Planet Unisex Gym - GymOS"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Run Database Migrations in Supabase
Run the following files in order in your Supabase SQL Editor:
1. `supabase/schema.sql` — Creates all 9 tables, indexes, and constraints.
2. `supabase/rls.sql` — Sets up Row-Level Security policies and helper functions.
3. `supabase/seed.sql` — Pre-loads Fitness Planet Unisex Gym, plans, members, payments, and staff.

### 3. Install & Start Development Server
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.
- Public Kiosk: [http://localhost:3000/checkin/fitness-planet-sikandrabad](http://localhost:3000/checkin/fitness-planet-sikandrabad)
- Walk-in Admission Form: [http://localhost:3000/join/00000000-0000-0000-0000-000000000001](http://localhost:3000/join/00000000-0000-0000-0000-000000000001)

---

## 📦 5. GitHub Repository
Pushed to `main` branch of [https://github.com/anoctic/GYM-automation.git](https://github.com/anoctic/GYM-automation.git).
