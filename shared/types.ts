// Shared types between frontend and backend

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

// Assistant types
export interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  openai_assistant_id?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  user_metadata?: {
    name?: string;
    profession?: string;
    role?: string;
  };
}

// Subscription types
export interface Subscription {
  id: string;
  user_id: string;
  assistant_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  subscription_type: 'monthly' | 'semester';
  package_type?: string;
  package_id?: string;
  amount: number;
  asaas_subscription_id?: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
}

// Conversation types
export interface Conversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Package types
export interface Package {
  id: string;
  user_id: string;
  package_type: 'package_3' | 'package_6';
  subscription_type: 'monthly' | 'semester';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  selected_assistants: string[];
  amount: number;
  expires_at: string;
  created_at: string;
  updated_at?: string;
}

export default {
  ApiResponse,
  LoadingState,
  FormState,
  Assistant,
  User,
  Subscription,
  Conversation,
  Message,
  Package
};