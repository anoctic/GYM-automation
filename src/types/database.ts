export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UpiSlot = 'A' | 'B';
export type MemberStatus = 'active' | 'expired' | 'frozen' | 'trial';
export type PaymentMethod = 'UPI' | 'CASH' | 'BANK_TRANSFER';
export type AttendanceMethod = 'QR_SCAN' | 'FRONT_DESK';
export type AdmissionStatus = 'pending' | 'approved' | 'rejected';
export type LeadStage =
  | 'new_inquiry'
  | 'contacted'
  | 'trial_booked'
  | 'follow_up'
  | 'converted'
  | 'lost';

export type StaffRole = 'owner' | 'manager' | 'reception';
export type StaffStatus = 'active' | 'inactive';

export type AuditEntityType =
  | 'MEMBER'
  | 'PAYMENT_REQUEST'
  | 'ADMISSION'
  | 'ATTENDANCE'
  | 'GYM'
  | 'STAFF'
  | 'SETTINGS';

export interface Gym {
  id: string;
  owner_id: string | null;
  name: string;
  owner_name?: string;
  slug: string | null;
  tagline: string | null;
  address: string | null;
  pincode: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  opening_hours: string | null;
  upi_primary_id: string | null;
  upi_primary_name: string | null;
  upi_secondary_id: string | null;
  upi_secondary_name: string | null;
  default_upi_slot: UpiSlot;
  created_at: string;
  updated_at: string;
}

export interface MembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  duration_days: number;
  price: number;
  admission_fee: number;
  description: string | null;
  perks: string[];
  badge_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  member_code: string;
  full_name: string;
  father_name?: string | null;
  dob?: string | null;
  age?: number | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  phone: string;
  email: string | null;
  address?: string | null;
  pincode?: string | null;
  aadhar_number?: string | null;
  photo_url?: string | null;
  signature_url?: string | null;
  plan_id: string | null;
  status: MemberStatus;
  join_date: string;
  expiry_date: string;
  pending_dues: number;
  total_sessions: number;
  has_medical_condition?: boolean;
  medical_details?: string | null;
  taking_medication?: boolean;
  emergency_contact_name?: string | null;
  emergency_contact_relation?: string | null;
  emergency_contact_phone?: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  membership_plans?: MembershipPlan | null;
  last_check_in_at?: string | null;
  days_since_checkin?: number | null;
  is_inactive_3d?: boolean;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  receipt_no: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_id: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
  members?: {
    full_name: string;
    member_code: string;
    phone: string;
  } | null;
}

export interface AttendanceLog {
  id: string;
  gym_id: string;
  member_id: string;
  check_in_at: string;
  check_out_at: string | null;
  method: AttendanceMethod;
  created_at: string;
  members?: {
    id: string;
    full_name: string;
    member_code: string;
    phone: string;
    status: MemberStatus;
    pending_dues: number;
  } | null;
}

export interface Admission {
  id: string;
  gym_id: string;
  applicant_name: string;
  father_name?: string | null;
  phone: string;
  email: string | null;
  gender?: string | null;
  address?: string | null;
  selected_plan_id: string | null;
  status: AdmissionStatus;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  membership_plans?: MembershipPlan | null;
}

export interface Lead {
  id: string;
  gym_id: string;
  name: string;
  phone: string;
  stage: LeadStage;
  notes: string | null;
  updated_at: string;
  created_at: string;
}

export interface GymStaff {
  id: string;
  gym_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  status: StaffStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  gym_id: string;
  action: string;
  entity_type: AuditEntityType;
  entity_id: string | null;
  performed_by_email: string | null;
  details: Record<string, any>;
  created_at: string;
}

export type Database = any;

