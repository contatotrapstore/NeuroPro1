import axios, { AxiosInstance } from 'axios';
import { getIndividualPrice, getPackagePrice, type SubscriptionType, type PackageSize } from '../../../shared/config/pricing';

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
}

interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'BIANNUAL';
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED';
}

interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

interface CreateSubscriptionRequest {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'BIANNUAL';
  description: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
}

export class AsaasService {
  private client: AxiosInstance;
  private readonly baseURL = 'https://www.asaas.com/api/v3';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'access_token': process.env.ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      console.log(`Asaas API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Asaas API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  async createCustomer(customerData: CreateCustomerRequest): Promise<AsaasCustomer> {
    try {
      const response = await this.client.post('/customers', customerData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating Asaas customer:', error.response?.data || error.message);
      throw new Error('Falha ao criar cliente no Asaas');
    }
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Asaas customer:', error.response?.data || error.message);
      throw new Error('Falha ao buscar cliente no Asaas');
    }
  }

  async createSubscription(subscriptionData: CreateSubscriptionRequest): Promise<AsaasSubscription> {
    try {
      const response = await this.client.post('/subscriptions', subscriptionData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating Asaas subscription:', error.response?.data || error.message);
      throw new Error('Falha ao criar assinatura no Asaas');
    }
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    try {
      const response = await this.client.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Asaas subscription:', error.response?.data || error.message);
      throw new Error('Falha ao buscar assinatura no Asaas');
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    try {
      const response = await this.client.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling Asaas subscription:', error.response?.data || error.message);
      throw new Error('Falha ao cancelar assinatura no Asaas');
    }
  }

  async listSubscriptions(customerId?: string): Promise<{
    object: string;
    hasMore: boolean;
    totalCount: number;
    limit: number;
    offset: number;
    data: AsaasSubscription[];
  }> {
    try {
      const params = customerId ? { customer: customerId } : {};
      const response = await this.client.get('/subscriptions', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error listing Asaas subscriptions:', error.response?.data || error.message);
      throw new Error('Falha ao listar assinaturas no Asaas');
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const crypto = require('crypto');
      const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error('ASAAS_WEBHOOK_SECRET not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      
      // Ensure both buffers have the same length to prevent timing attacks
      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  calculateNextDueDate(subscriptionType: 'monthly' | 'semester'): string {
    const now = new Date();
    
    if (subscriptionType === 'monthly') {
      now.setMonth(now.getMonth() + 1);
    } else {
      now.setMonth(now.getMonth() + 6);
    }

    return now.toISOString().split('T')[0];
  }

  mapSubscriptionType(type: 'monthly' | 'semester'): 'MONTHLY' | 'BIANNUAL' {
    return type === 'monthly' ? 'MONTHLY' : 'BIANNUAL';
  }

  getSubscriptionValue(subscriptionType: SubscriptionType, packageType: 'individual' | 'package_3' | 'package_6'): number {
    if (packageType === 'individual') {
      return getIndividualPrice(subscriptionType);
    }
    
    if (packageType === 'package_3') {
      return getPackagePrice(3, subscriptionType);
    }
    
    if (packageType === 'package_6') {
      return getPackagePrice(6, subscriptionType);
    }

    throw new Error('Tipo de pacote inválido');
  }
}

export const asaasService = new AsaasService();