// Re-export shared types to maintain compatibility
export * from '../../shared/types';

// Frontend-specific types that extend shared types
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { 
  AuthContextType as SharedAuthContextType, 
  ProfileUpdateData as SharedProfileUpdateData,
  UserSubscription as SharedUserSubscription,
  UserPackage as SharedUserPackage,
  Conversation as SharedConversation
} from '../../shared/types';

// Extend types with frontend-specific properties
export interface UserSubscription extends SharedUserSubscription {
  assistant?: Assistant;
}

export interface UserPackage extends SharedUserPackage {
  user_subscriptions?: UserSubscription[];
}

export interface Conversation extends SharedConversation {
  assistant?: Assistant;
}

// Extend AuthContextType to work with Supabase User
export interface AuthContextType extends Omit<SharedAuthContextType, 'user'> {
  user: SupabaseUser | null;
}

// Extend ProfileUpdateData with additional fields
export interface ProfileUpdateData extends SharedProfileUpdateData {
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

// Import shared Assistant type to ensure consistency
import type { Assistant } from '../../shared/types';