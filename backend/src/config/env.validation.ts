import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Database
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  
  // OpenAI
  OPENAI_API_KEY: string;
  OPENAI_ORGANIZATION?: string;
  
  // Asaas Payment Gateway
  ASAAS_API_KEY: string;
  ASAAS_WEBHOOK_SECRET: string;
  
  // CORS
  CORS_ORIGIN?: string;
  
  // Redis (optional)
  REDIS_URL?: string;
  
  // JWT (optional, using Supabase auth)
  JWT_SECRET?: string;
}

class EnvironmentValidator {
  private config: Partial<EnvironmentConfig> = {};
  private errors: string[] = [];

  constructor() {
    this.validateEnvironment();
  }

  private validateEnvironment(): void {
    // Required variables
    this.validateRequired('NODE_ENV', ['development', 'production', 'test']);
    this.validateRequired('PORT', undefined, 'number');
    this.validateRequired('SUPABASE_URL', undefined, 'url');
    this.validateRequired('SUPABASE_SERVICE_KEY', undefined, 'string');
    this.validateRequired('OPENAI_API_KEY', undefined, 'string');
    this.validateRequired('ASAAS_API_KEY', undefined, 'string');
    this.validateRequired('ASAAS_WEBHOOK_SECRET', undefined, 'string');

    // Optional variables with defaults
    this.validateOptional('OPENAI_ORGANIZATION', undefined, 'string');
    this.validateOptional('CORS_ORIGIN', 'http://localhost:5173', 'string');
    this.validateOptional('REDIS_URL', undefined, 'string');
    this.validateOptional('JWT_SECRET', undefined, 'string');

    if (this.errors.length > 0) {
      console.error('\n🚨 Environment Configuration Errors:');
      this.errors.forEach((error, index) => {
        console.error(`   ${index + 1}. ${error}`);
      });
      console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
      process.exit(1);
    }

    console.log('✅ Environment variables validated successfully');
  }

  private validateRequired(
    key: keyof EnvironmentConfig,
    allowedValues?: string[],
    type: 'string' | 'number' | 'url' = 'string'
  ): void {
    const value = process.env[key];

    if (!value || value.trim() === '') {
      this.errors.push(`${key} is required but not set`);
      return;
    }

    // Type validation
    if (type === 'number') {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        this.errors.push(`${key} must be a valid number, got: ${value}`);
        return;
      }
      this.config[key] = numValue as any;
    } else if (type === 'url') {
      try {
        new URL(value);
        this.config[key] = value as any;
      } catch {
        this.errors.push(`${key} must be a valid URL, got: ${value}`);
        return;
      }
    } else {
      this.config[key] = value as any;
    }

    // Value validation
    if (allowedValues && !allowedValues.includes(value)) {
      this.errors.push(`${key} must be one of [${allowedValues.join(', ')}], got: ${value}`);
      return;
    }
  }

  private validateOptional(
    key: keyof EnvironmentConfig,
    defaultValue: any,
    type: 'string' | 'number' | 'url' = 'string'
  ): void {
    const value = process.env[key];

    if (!value || value.trim() === '') {
      if (defaultValue !== undefined) {
        this.config[key] = defaultValue;
      }
      return;
    }

    // Type validation for optional values
    if (type === 'number') {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        this.errors.push(`${key} must be a valid number, got: ${value}`);
        return;
      }
      this.config[key] = numValue as any;
    } else if (type === 'url') {
      try {
        new URL(value);
        this.config[key] = value as any;
      } catch {
        this.errors.push(`${key} must be a valid URL, got: ${value}`);
        return;
      }
    } else {
      this.config[key] = value as any;
    }
  }

  getConfig(): EnvironmentConfig {
    return this.config as EnvironmentConfig;
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }
}

// Create and export singleton instance
const environmentValidator = new EnvironmentValidator();
export const env = environmentValidator.getConfig();
export const isDevelopment = environmentValidator.isDevelopment();
export const isProduction = environmentValidator.isProduction();
export const isTest = environmentValidator.isTest();

// Export the validator for testing purposes
export { EnvironmentValidator };