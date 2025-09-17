/**
 * Teste de Conectividade Asaas - Debug API Key
 * Endpoint para verificar se a API key está funcionando
 */

const { createClient } = require('@supabase/supabase-js');
const AsaasService = require('./services/asaas.service');

module.exports = async function handler(req, res) {
  console.log('🧪 Teste de Conectividade Asaas');

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. Verificar variáveis de ambiente
    console.log('📋 Environment Check:', {
      hasAsaasApiKey: !!process.env.ASAAS_API_KEY,
      hasWebhookSecret: !!process.env.ASAAS_WEBHOOK_SECRET,
      nodeEnv: process.env.NODE_ENV
    });

    if (!process.env.ASAAS_API_KEY) {
      return res.status(500).json({
        error: 'ASAAS_API_KEY não configurada no Vercel',
        debug: {
          availableEnvVars: Object.keys(process.env).filter(key => key.includes('ASAAS'))
        }
      });
    }

    // 2. Inicializar serviço Asaas (vai mostrar debug da API key)
    const asaasService = new AsaasService();

    // 3. Teste simples: buscar lista de customers (endpoint básico)
    console.log('🔍 Testando conectividade básica...');
    const customersResponse = await asaasService.makeRequest('/customers?limit=1');

    // 4. Teste de criação de customer fictício
    console.log('👤 Testando criação de customer...');
    const testCustomer = {
      name: 'Teste API',
      email: `teste-${Date.now()}@example.com`,
      cpfCnpj: '12345678901'
    };

    const customerResult = await asaasService.createCustomer(testCustomer);

    return res.status(200).json({
      success: true,
      message: 'API Asaas funcionando corretamente!',
      debug: {
        apiKeyFormat: process.env.ASAAS_API_KEY?.startsWith('$aact_prod_') ? 'PRODUCTION' :
                      process.env.ASAAS_API_KEY?.startsWith('$aact_hmlg_') ? 'SANDBOX' : 'INVALID',
        apiKeyLength: process.env.ASAAS_API_KEY?.length,
        apiKeyStart: process.env.ASAAS_API_KEY?.substring(0, 15) + '...',
        customersFound: customersResponse?.totalCount || 0,
        testCustomerCreated: customerResult?.id,
        baseUrl: asaasService.baseUrl
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        apiKeyConfigured: !!process.env.ASAAS_API_KEY,
        apiKeyFormat: process.env.ASAAS_API_KEY?.startsWith('$aact_prod_') ? 'PRODUCTION' :
                      process.env.ASAAS_API_KEY?.startsWith('$aact_hmlg_') ? 'SANDBOX' : 'INVALID',
        errorType: error.constructor.name,
        stack: error.stack
      }
    });
  }
};