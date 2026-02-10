// Tipos gerados do Supabase
// Baseado no schema de agendamento

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type UserRole = 'patient' | 'provider' | 'admin';
export type PatientType =
  | 'new' | 'wellness' | 'bhrt' | 'rejuvenation' | 'iv_therapy' | 'vip'
  // Legacy (kept for backward compat)
  | 'trt' | 'hormone' | 'general';
export type AppointmentType =
  // Active types
  | 'initial_consultation' | 'follow_up'
  | 'functional_medicine' | 'bhrt' | 'male_hypertrophy' | 'female_hypertrophy'
  | 'insulin_resistance' | 'chronic_inflammation' | 'thyroid_support'
  | 'morpheus8' | 'botulinum_toxin' | 'fillers' | 'skin_boosters'
  | 'iv_protocols' | 'customized_iv_nutrition' | 'nutrient_testing' | 'nad_therapy' | 'vitamin_injections'
  // Legacy (kept for backward compat)
  | 'hormone_check' | 'lab_review' | 'nutrition' | 'health_coaching' | 'therapy' | 'personal_training';
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

// Entidades
export type PreferredLanguage = 'pt' | 'en';
export type PreferredTheme = 'light' | 'dark';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  patient_type: PatientType | null;
  preferred_language: PreferredLanguage;
  preferred_theme: PreferredTheme;
  last_visit_at: string | null;
  labs_completed_at: string | null;
  no_show_count: number;
  created_at: string;
  updated_at: string;
  // Extended profile fields (migration 021)
  preferred_name: string | null;
  date_of_birth: string | null;
  sex_at_birth: string | null;
  gender_identity: string | null;
  pronoun: string | null;
  race: string | null;
  ethnicity: string | null;
  marital_status: string | null;
  occupation: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  alternative_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  referred_by: string | null;
  primary_care_physician: string | null;
  patient_notes: string | null;
}

export interface Provider {
  id: string;
  user_id: string;
  specialty: string;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface ProviderSchedule {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: string;
  duration: number;
  notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  price_at_booking: number | null;
  created_at: string;
  updated_at: string;
  provider?: Provider;
  patient?: Profile;
}

// Database type para Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          first_name: string;
          last_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          patient_type?: PatientType | null;
          preferred_language?: PreferredLanguage;
          preferred_theme?: PreferredTheme;
          last_visit_at?: string | null;
          labs_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          preferred_name?: string | null;
          date_of_birth?: string | null;
          sex_at_birth?: string | null;
          gender_identity?: string | null;
          pronoun?: string | null;
          race?: string | null;
          ethnicity?: string | null;
          marital_status?: string | null;
          occupation?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          alternative_phone?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          referred_by?: string | null;
          primary_care_physician?: string | null;
          patient_notes?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          patient_type?: PatientType | null;
          preferred_language?: PreferredLanguage;
          preferred_theme?: PreferredTheme;
          last_visit_at?: string | null;
          labs_completed_at?: string | null;
          updated_at?: string;
          preferred_name?: string | null;
          date_of_birth?: string | null;
          sex_at_birth?: string | null;
          gender_identity?: string | null;
          pronoun?: string | null;
          race?: string | null;
          ethnicity?: string | null;
          marital_status?: string | null;
          occupation?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          alternative_phone?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          referred_by?: string | null;
          primary_care_physician?: string | null;
          patient_notes?: string | null;
        };
        Relationships: [];
      };
      providers: {
        Row: Provider;
        Insert: {
          id?: string;
          user_id: string;
          specialty: string;
          bio?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          specialty?: string;
          bio?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      provider_schedules: {
        Row: ProviderSchedule;
        Insert: {
          id?: string;
          provider_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_duration?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          slot_duration?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: Appointment;
        Insert: {
          id?: string;
          patient_id: string;
          provider_id: string;
          type: AppointmentType;
          status?: AppointmentStatus;
          scheduled_at: string;
          duration?: number;
          notes?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          price_at_booking?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          patient_id?: string;
          provider_id?: string;
          type?: AppointmentType;
          status?: AppointmentStatus;
          scheduled_at?: string;
          duration?: number;
          notes?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          price_at_booking?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_patient_appointments: {
        Args: { p_patient_id: string };
        Returns: Appointment[];
      };
      get_available_slots: {
        Args: {
          p_provider_id: string;
          p_date: string;
          p_appointment_type: AppointmentType;
        };
        Returns: TimeSlot[];
      };
      check_patient_eligibility: {
        Args: {
          p_patient_id: string;
          p_appointment_type: AppointmentType;
        };
        Returns: EligibilityResult;
      };
      create_appointment: {
        Args: {
          p_patient_id: string;
          p_provider_id: string;
          p_type: AppointmentType;
          p_scheduled_at: string;
          p_notes?: string;
        };
        Returns: Appointment;
      };
    };
    Enums: {
      user_role: UserRole;
      patient_type: PatientType;
      appointment_type: AppointmentType;
      appointment_status: AppointmentStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// DTOs
export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  next_eligible_date: string | null;
  requirements: {
    labs_required: boolean;
    labs_completed: boolean;
    visit_required: boolean;
    last_visit_date: string | null;
  };
}

export interface ProviderBlock {
  id: string;
  provider_id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_via: 'panel' | 'whatsapp';
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentDTO {
  provider_id: string;
  type: AppointmentType;
  scheduled_at: string;
  notes?: string;
}
