// Local types instead of shared types for now
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  full_description?: string;
  icon: string;
  icon_url?: string;
  icon_type?: 'svg' | 'image' | 'emoji';
  color_theme: string;
  area: 'Psicologia' | 'Psicopedagogia' | 'Fonoaudiologia' | 'Neuromodulação' | 'Terapia Ocupacional';
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  openai_assistant_id?: string;
  specialization?: string;
  features?: string[];
  order_index?: number;
  subscription_count?: number;
  total_conversations?: number;
  last_used_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Frontend-specific types  
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Base types for the application
export interface UserSubscription {
  id: string;
  user_id: string;
  assistant_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  subscription_type: 'monthly' | 'semester';
  assistant?: Assistant;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_type: 'package_3' | 'package_6';
  status: 'active' | 'cancelled' | 'expired';
  user_subscriptions?: UserSubscription[];
}

export interface Conversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  assistant?: Assistant;
}

// Auth context type
export interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean } | void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ error?: any }>;
  updatePassword: (newPassword: string) => Promise<{ error?: any }>;
}

// Profile update data
export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  profession?: string;
  crp?: string;
  specialties?: string[];
}

// Frontend-specific types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SubscriptionPlan {
  type: 'individual' | 'package_3' | 'package_6';
  price_monthly: number;
  price_semester: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface PackageSelection {
  package_type: 'package_3' | 'package_6';
  selected_assistants: string[];
  total_price: number;
  subscription_type: 'monthly' | 'semester';
}

// Assistant type is defined above