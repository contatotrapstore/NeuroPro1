/**
 * Pricing Configuration - NeuroIA Lab
 * Centralized pricing rules and calculations
 * All prices should be managed from this single source of truth
 */

// Default base pricing for individual assistants (fallback values)
export const DEFAULT_INDIVIDUAL_PRICING = {
  monthly: 39.90,
  semester: 199.00,
} as const;

// Package pricing with discounts
export const PACKAGE_PRICING = {
  3: {
    monthly: 99.90,
    semester: 499.00,
    discount: {
      monthly: 0.17, // ~17% discount from 3 * 39.90
      semester: 0.16, // ~16% discount from 3 * 199.00
    }
  },
  6: {
    monthly: 179.90,
    semester: 899.00,
    discount: {
      monthly: 0.25, // ~25% discount from 6 * 39.90
      semester: 0.25, // ~25% discount from 6 * 199.00
    }
  }
} as const;

// Subscription types
export type SubscriptionType = 'monthly' | 'semester';
export type PackageSize = 3 | 6;

/**
 * Calculate package discount percentage
 */
export const calculatePackageDiscount = (
  packageSize: PackageSize, 
  subscriptionType: SubscriptionType
): number => {
  if (!(packageSize in PACKAGE_PRICING)) {
    throw new Error(`Invalid package size: ${packageSize}`);
  }
  
  return PACKAGE_PRICING[packageSize].discount[subscriptionType];
};

/**
 * Get individual assistant price (with dynamic pricing support)
 */
export const getIndividualPrice = (
  subscriptionType: SubscriptionType,
  dynamicPricing?: { monthly_price?: number; semester_price?: number }
): number => {
  if (dynamicPricing) {
    const price = subscriptionType === 'monthly'
      ? dynamicPricing.monthly_price
      : dynamicPricing.semester_price;

    if (price && price > 0) {
      return price;
    }
  }

  return DEFAULT_INDIVIDUAL_PRICING[subscriptionType];
};

/**
 * Get package price
 */
export const getPackagePrice = (
  packageSize: PackageSize, 
  subscriptionType: SubscriptionType
): number => {
  if (!(packageSize in PACKAGE_PRICING)) {
    throw new Error(`Invalid package size: ${packageSize}`);
  }
  
  return PACKAGE_PRICING[packageSize][subscriptionType];
};

/**
 * Calculate savings from package vs individual subscriptions
 */
export const calculatePackageSavings = (
  packageSize: PackageSize,
  subscriptionType: SubscriptionType
): {
  individualTotal: number;
  packagePrice: number;
  savings: number;
  discountPercentage: number;
} => {
  const individualPrice = getIndividualPrice(subscriptionType);
  const packagePrice = getPackagePrice(packageSize, subscriptionType);
  const individualTotal = individualPrice * packageSize;
  const savings = individualTotal - packagePrice;
  const discountPercentage = (savings / individualTotal) * 100;

  return {
    individualTotal,
    packagePrice,
    savings,
    discountPercentage: Math.round(discountPercentage)
  };
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return `R$ ${price.toFixed(2)}`;
};

/**
 * Format subscription label
 */
export const formatSubscriptionLabel = (subscriptionType: SubscriptionType): string => {
  return subscriptionType === 'monthly' ? '/mês' : '/semestre';
};

/**
 * Get complete pricing info for an assistant (with dynamic pricing support)
 */
export const getAssistantPricingInfo = (assistant?: {
  monthly_price?: number;
  semester_price?: number;
}) => {
  const monthlyPrice = getIndividualPrice('monthly', assistant);
  const semesterPrice = getIndividualPrice('semester', assistant);

  return {
    monthly: {
      price: monthlyPrice,
      formatted: `${formatPrice(monthlyPrice)}/mês`,
    },
    semester: {
      price: semesterPrice,
      formatted: `${formatPrice(semesterPrice)}/semestre`,
    }
  };
};

/**
 * Get complete pricing info for packages
 */
export const getPackagePricingInfo = (packageSize: PackageSize) => {
  const monthlyInfo = calculatePackageSavings(packageSize, 'monthly');
  const semesterInfo = calculatePackageSavings(packageSize, 'semester');

  return {
    size: packageSize,
    monthly: {
      price: PACKAGE_PRICING[packageSize].monthly,
      formatted: `${formatPrice(PACKAGE_PRICING[packageSize].monthly)}/mês`,
      savings: monthlyInfo.savings,
      discount: monthlyInfo.discountPercentage,
    },
    semester: {
      price: PACKAGE_PRICING[packageSize].semester,
      formatted: `${formatPrice(PACKAGE_PRICING[packageSize].semester)}/semestre`,
      savings: semesterInfo.savings,
      discount: semesterInfo.discountPercentage,
    }
  };
};

// Export all pricing constants for direct access if needed
export const PRICING_CONFIG = {
  DEFAULT_INDIVIDUAL_PRICING,
  PACKAGE_PRICING,
} as const;