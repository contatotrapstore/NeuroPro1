// Shared Types - NeuroIA Lab
// Tipos compartilhados entre frontend e backend para eliminar duplicação

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
  openai_assistant_id: string;
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
  assistant_ids: string[];
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
  thread_id: string;
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

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  timestamp?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
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

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ error: any }>;
}

// UI State Types
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface FormState extends LoadingState {
  values: Record<string, any>;
  errors: Record<string, string>;
}

// Pricing Configuration
export interface PricingConfig {
  individual: {
    monthly: number;
    semester: number;
  };
  packages: {
    package_3: {
      monthly: number;
      semester: number;
      assistantCount: number;
      discount: number;
    };
    package_6: {
      monthly: number;
      semester: number;
      assistantCount: number;
      discount: number;
    };
  };
}

// Chat Types
export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}

// Component Props Types
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

// Webhook Types
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

// Error Types
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Cache Types
export interface CacheOptions {
  ttl?: number;
  namespace?: string;
}

// Constants
export const SUBSCRIPTION_TYPES = ['monthly', 'semester'] as const;
export const PACKAGE_TYPES = ['package_3', 'package_6'] as const;
export const SUBSCRIPTION_STATUS = ['pending', 'active', 'cancelled', 'expired'] as const;
export const MESSAGE_ROLES = ['user', 'assistant'] as const;

// Type Guards
export const isValidSubscriptionType = (type: string): type is 'monthly' | 'semester' => {
  return SUBSCRIPTION_TYPES.includes(type as any);
};

export const isValidPackageType = (type: string): type is 'package_3' | 'package_6' => {
  return PACKAGE_TYPES.includes(type as any);
};

export const isValidStatus = (status: string): status is 'pending' | 'active' | 'cancelled' | 'expired' => {
  return SUBSCRIPTION_STATUS.includes(status as any);
};