// Backend Types for NeuroIA Lab

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  assistant_id: string;
  subscription_type: 'monthly' | 'semester';
  package_type: 'individual' | 'package_3' | 'package_6';
  package_id: string | null;
  amount: number;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  asaas_subscription_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_type: 'package_3' | 'package_6';
  subscription_type: 'monthly' | 'semester';
  total_amount: number;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  asaas_subscription_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface CreateSubscriptionRequest {
  user_id: string;
  assistant_id: string;
  subscription_type: 'monthly' | 'semester';
  payment_method: string;
}

export interface CreatePackageRequest {
  user_id: string;
  package_type: 'package_3' | 'package_6';
  assistant_ids: string[];
  subscription_type: 'monthly' | 'semester';
  payment_method: string;
}

export interface ValidatePackageRequest {
  package_type: 'package_3' | 'package_6';
  assistant_ids: string[];
}

export interface ChatMessageRequest {
  message: string;
  conversation_id?: string;
}

export interface AsaasWebhookPayload {
  event: string;
  payment: {
    id: string;
    status: string;
    customer: string;
    value: number;
    description: string;
  };
}