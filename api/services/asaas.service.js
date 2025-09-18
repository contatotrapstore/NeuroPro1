/**
 * Asaas Payment Gateway Integration Service
 * Handles all Asaas API interactions for NeuroIA Lab
 */

const crypto = require('crypto');

class AsaasService {
  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY;
    this.baseUrl = 'https://api.asaas.com/v3';
    this.webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;

    console.log('🔑 Asaas API Key Debug:', {
      hasApiKey: !!this.apiKey,
      keyLength: this.apiKey?.length,
      keyStart: this.apiKey?.substring(0, 15) + '...',
      keyFormat: this.apiKey?.startsWith('$aact_prod_') ? 'PRODUCTION' :
                  this.apiKey?.startsWith('$aact_hmlg_') ? 'SANDBOX' : 'UNKNOWN'
    });

    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY not configured');
    }

    if (!this.apiKey.startsWith('$aact_')) {
      throw new Error('ASAAS_API_KEY format is invalid. Must start with $aact_prod_ or $aact_hmlg_');
    }
  }

  /**
   * Make HTTP request to Asaas API
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'NeuroIA-Lab/1.0'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      // Use dynamic import for node-fetch in serverless environment
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        console.error('🚨 Asaas API Error:', {
          status: response.status,
          url,
          method,
          data,
          error: result,
          apiKeyFormat: this.apiKey?.startsWith('$aact_prod_') ? 'PRODUCTION' :
                        this.apiKey?.startsWith('$aact_hmlg_') ? 'SANDBOX' : 'INVALID',
          headers: options.headers
        });

        // 🚨 ENHANCED ERROR LOGGING for Credit Card Issues
        if (response.status === 400 && result.errors) {
          console.error('🔴 CREDIT CARD VALIDATION ERROR:', {
            errors: result.errors,
            errorCode: result.errors?.[0]?.code,
            errorDescription: result.errors?.[0]?.description,
            apiEnvironment: this.apiKey?.startsWith('$aact_prod_') ? 'PRODUCTION' : 'SANDBOX',
            requestData: data
          });

          // Special handling for credit card errors
          if (result.errors?.[0]?.code === 'invalid_creditCard') {
            const environment = this.apiKey?.startsWith('$aact_prod_') ? 'PRODUCTION' : 'SANDBOX';
            throw new Error(
              `Transação não autorizada (${environment}). ` +
              `${environment === 'PRODUCTION' ?
                'Use um cartão real válido em produção.' :
                'Use um cartão de teste em sandbox: 5162306219378829'} ` +
              `Detalhes: ${result.errors?.[0]?.description}`
            );
          }
        }

        if (response.status === 401) {
          throw new Error(`API Key inválida ou expirada. Verifique: 1) Se está configurada no Vercel, 2) Se tem o formato correto ($aact_prod_ ou $aact_hmlg_), 3) Se não expirou no painel Asaas`);
        }

        throw new Error(result.errors?.[0]?.description || result.message || 'Erro na API do Asaas');
      }

      return result;
    } catch (error) {
      console.error('Asaas Request Error:', error);
      throw error;
    }
  }

  /**
   * Create or update customer in Asaas
   */
  async createCustomer(customerData) {
    const payload = {
      name: customerData.name,
      email: customerData.email,
      cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''), // Remove non-digits
      phone: customerData.phone?.replace(/\D/g, ''),
      mobilePhone: customerData.mobilePhone?.replace(/\D/g, ''),
      postalCode: customerData.postalCode?.replace(/\D/g, ''),
      address: customerData.address,
      addressNumber: customerData.addressNumber,
      complement: customerData.complement,
      province: customerData.province,
      city: customerData.city,
      state: customerData.state,
      externalReference: customerData.externalReference || customerData.email
    };

    console.log('Creating Asaas customer:', { email: payload.email, cpfCnpj: payload.cpfCnpj });

    // Try to find existing customer first
    try {
      const existingCustomer = await this.findCustomerByEmail(customerData.email);
      if (existingCustomer) {
        console.log('Customer already exists, updating:', existingCustomer.id);
        return await this.updateCustomer(existingCustomer.id, payload);
      }
    } catch (error) {
      console.log('Customer not found, creating new one');
    }

    return await this.makeRequest('/customers', 'POST', payload);
  }

  /**
   * Find customer by email
   */
  async findCustomerByEmail(email) {
    const response = await this.makeRequest(`/customers?email=${encodeURIComponent(email)}`);
    return response.data?.[0] || null;
  }

  /**
   * Update existing customer
   */
  async updateCustomer(customerId, customerData) {
    return await this.makeRequest(`/customers/${customerId}`, 'POST', customerData);
  }

  /**
   * Create payment charge
   */
  async createPayment(paymentData) {
    const payload = {
      customer: paymentData.customerId,
      billingType: paymentData.billingType, // CREDIT_CARD, PIX, BOLETO
      value: paymentData.value,
      dueDate: paymentData.dueDate || new Date().toISOString().split('T')[0],
      description: paymentData.description,
      externalReference: paymentData.externalReference,
      discount: paymentData.discount,
      interest: paymentData.interest,
      fine: paymentData.fine,
      postalService: false
    };

    // Add credit card data if applicable
    if (paymentData.billingType === 'CREDIT_CARD' && paymentData.creditCard) {
      // 🔥 CRITICAL: remoteIp is REQUIRED for credit card processing in Asaas!
      if (!paymentData.remoteIp) {
        throw new Error('remoteIp is required for credit card payments');
      }

      payload.remoteIp = paymentData.remoteIp;
      payload.creditCard = {
        holderName: paymentData.creditCard.holderName,
        number: paymentData.creditCard.number.replace(/\s/g, ''),
        expiryMonth: paymentData.creditCard.expiryMonth,
        expiryYear: paymentData.creditCard.expiryYear,
        ccv: paymentData.creditCard.ccv
      };
      payload.creditCardHolderInfo = {
        name: paymentData.creditCard.holderName,
        email: paymentData.customerEmail,
        cpfCnpj: paymentData.customerCpfCnpj,
        postalCode: paymentData.customerPostalCode,
        addressNumber: paymentData.customerAddressNumber,
        phone: paymentData.customerPhone
      };

      console.log('💳 CREDIT CARD PAYMENT PAYLOAD:', {
        hasRemoteIp: !!payload.remoteIp,
        remoteIp: payload.remoteIp,
        hasCreditCard: !!payload.creditCard,
        hasHolderInfo: !!payload.creditCardHolderInfo
      });
    }

    console.log('Creating Asaas payment:', {
      customerId: payload.customer,
      billingType: payload.billingType,
      value: payload.value,
      description: payload.description
    });

    return await this.makeRequest('/payments', 'POST', payload);
  }

  /**
   * Create subscription (recurring payment)
   */
  async createSubscription(subscriptionData) {
    const payload = {
      customer: subscriptionData.customerId,
      billingType: subscriptionData.billingType,
      value: subscriptionData.value,
      nextDueDate: subscriptionData.nextDueDate || new Date().toISOString().split('T')[0],
      cycle: subscriptionData.cycle, // WEEKLY, BIWEEKLY, MONTHLY, BIMONTHLY, QUARTERLY, SEMIANNUALLY, YEARLY
      description: subscriptionData.description,
      externalReference: subscriptionData.externalReference,
      discount: subscriptionData.discount,
      interest: subscriptionData.interest,
      fine: subscriptionData.fine
    };

    // Add credit card data if applicable
    if (subscriptionData.billingType === 'CREDIT_CARD' && subscriptionData.creditCard) {
      // 🔥 CRITICAL: remoteIp is REQUIRED for credit card processing in Asaas!
      if (!subscriptionData.remoteIp) {
        throw new Error('remoteIp is required for credit card payments');
      }

      payload.remoteIp = subscriptionData.remoteIp;
      payload.creditCard = {
        holderName: subscriptionData.creditCard.holderName,
        number: subscriptionData.creditCard.number.replace(/\s/g, ''),
        expiryMonth: subscriptionData.creditCard.expiryMonth,
        expiryYear: subscriptionData.creditCard.expiryYear,
        ccv: subscriptionData.creditCard.ccv
      };
      payload.creditCardHolderInfo = {
        name: subscriptionData.creditCard.holderName,
        email: subscriptionData.customerEmail,
        cpfCnpj: subscriptionData.customerCpfCnpj,
        postalCode: subscriptionData.customerPostalCode,
        addressNumber: subscriptionData.customerAddressNumber,
        phone: subscriptionData.customerPhone
      };

      console.log('💳 CREDIT CARD SUBSCRIPTION PAYLOAD:', {
        hasRemoteIp: !!payload.remoteIp,
        remoteIp: payload.remoteIp,
        hasCreditCard: !!payload.creditCard,
        hasHolderInfo: !!payload.creditCardHolderInfo,
        customerId: payload.customer,
        value: payload.value
      });
    }

    console.log('Creating Asaas subscription:', {
      customerId: payload.customer,
      billingType: payload.billingType,
      cycle: payload.cycle,
      value: payload.value
    });

    return await this.makeRequest('/subscriptions', 'POST', payload);
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId) {
    return await this.makeRequest(`/payments/${paymentId}`);
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    return await this.makeRequest(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Get payments from a subscription
   */
  async getSubscriptionPayments(subscriptionId) {
    console.log('🔍 Fetching payments for subscription:', subscriptionId);
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}/payments`);
    console.log('📋 Subscription payments found:', {
      count: response.data?.length || 0,
      payments: response.data?.map(p => ({
        id: p.id,
        status: p.status,
        billingType: p.billingType,
        value: p.value,
        dueDate: p.dueDate
      })) || []
    });
    return response;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    return await this.makeRequest(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  /**
   * Generate PIX QR Code
   */
  async generatePixQrCode(paymentId) {
    console.log('🎯 Generating PIX QR Code for payment ID:', paymentId);

    // First, let's check the payment status to ensure it supports PIX
    try {
      const payment = await this.getPayment(paymentId);
      console.log('💳 Payment details before PIX generation:', {
        id: payment.id,
        status: payment.status,
        billingType: payment.billingType,
        value: payment.value,
        dueDate: payment.dueDate,
        customer: payment.customer,
        object: payment.object
      });

      if (payment.billingType !== 'PIX') {
        throw new Error(`Payment billing type is ${payment.billingType}, not PIX`);
      }

      if (!['PENDING', 'AWAITING_PAYMENT'].includes(payment.status)) {
        console.warn('⚠️ Payment status is not pending:', payment.status);
      }

      // Check if this is a subscription payment (which might affect PIX generation)
      if (payment.subscription) {
        console.log('📋 This is a subscription payment:', payment.subscription);
      }

    } catch (paymentError) {
      console.error('❌ Error checking payment before PIX generation:', paymentError);
      throw new Error(`Error validating payment: ${paymentError.message}`);
    }

    // Now generate the PIX QR Code with enhanced error handling
    try {
      console.log('🌐 Making PIX QR Code request to Asaas API...');
      const pixResult = await this.makeRequestWithRawResponse(`/payments/${paymentId}/pixQrCode`);

      console.log('✅ PIX QR Code generated successfully:', {
        hasEncodedImage: !!pixResult.encodedImage,
        hasPayload: !!pixResult.payload,
        hasExpirationDate: !!pixResult.expirationDate,
        payloadLength: pixResult.payload?.length || 0,
        encodedImageSize: pixResult.encodedImage?.length || 0,
        expirationDate: pixResult.expirationDate
      });

      // Validate the PIX data before returning
      if (!pixResult.payload || !pixResult.encodedImage) {
        throw new Error('PIX QR Code response missing required fields (payload or encodedImage)');
      }

      return pixResult;
    } catch (pixError) {
      console.error('❌ Error generating PIX QR Code:', {
        error: pixError.message,
        stack: pixError.stack,
        paymentId,
        apiKey: this.apiKey?.substring(0, 15) + '...',
        baseUrl: this.baseUrl
      });
      throw new Error(`Failed to generate PIX QR Code: ${pixError.message}`);
    }
  }

  /**
   * Make HTTP request with raw response handling for debugging
   */
  async makeRequestWithRawResponse(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'NeuroIA-Lab/1.0'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(url, options);

      console.log('🌐 Raw API Response:', {
        status: response.status,
        statusText: response.statusText,
        url,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Get raw text first
      const rawText = await response.text();
      console.log('📄 Raw response text:', {
        length: rawText.length,
        isEmpty: rawText.length === 0,
        firstChars: rawText.substring(0, 100),
        isHtml: rawText.toLowerCase().includes('<html')
      });

      if (!response.ok) {
        console.error('🚨 API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          rawText: rawText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!rawText || rawText.length === 0) {
        throw new Error('Empty response from API');
      }

      if (rawText.toLowerCase().includes('<html')) {
        throw new Error('Received HTML instead of JSON response');
      }

      // Try to parse JSON
      try {
        const result = JSON.parse(rawText);
        return result;
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', {
          parseError: parseError.message,
          rawText: rawText.substring(0, 500)
        });
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

    } catch (error) {
      console.error('❌ Request Error:', error);
      throw error;
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      console.warn('ASAAS_WEBHOOK_SECRET not configured, skipping signature validation');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Map subscription type to Asaas cycle
   */
  mapSubscriptionCycle(subscriptionType) {
    const cycleMap = {
      'monthly': 'MONTHLY',
      'semester': 'SEMIANNUALLY'
    };
    return cycleMap[subscriptionType] || 'MONTHLY';
  }

  /**
   * Calculate next due date based on subscription type
   */
  calculateNextDueDate(subscriptionType) {
    const today = new Date();
    const nextDate = new Date(today);

    if (subscriptionType === 'monthly') {
      nextDate.setMonth(today.getMonth() + 1);
    } else if (subscriptionType === 'semester') {
      nextDate.setMonth(today.getMonth() + 6);
    }

    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Format currency value for Asaas (expects decimal)
   */
  formatCurrencyValue(value) {
    return parseFloat(value.toFixed(2));
  }

  /**
   * Get payment methods available
   */
  getAvailablePaymentMethods() {
    return [
      {
        type: 'CREDIT_CARD',
        name: 'Cartão de Crédito',
        description: 'Pagamento imediato',
        processing_time: 'Imediato'
      },
      {
        type: 'PIX',
        name: 'PIX',
        description: 'Pagamento instantâneo',
        processing_time: 'Instantâneo'
      },
      {
        type: 'BOLETO',
        name: 'Boleto Bancário',
        description: 'Pagamento em até 3 dias úteis',
        processing_time: '1-3 dias úteis'
      }
    ];
  }
}

module.exports = AsaasService;