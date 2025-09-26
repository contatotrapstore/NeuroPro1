/**
 * Vercel Serverless Function for Institution Subscription Activation
 * Endpoint: /api/activate-institution-subscription
 * Called by Asaas webhook when payment is confirmed
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🎯 Institution Subscription Activation API - Build:', Date.now());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
    'http://localhost:5173',
    'http://localhost:3000',
    // Asaas webhook IPs (if needed)
    'https://webhook.asaas.com'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Asaas-Webhook-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ Subscription activation preflight handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Use POST.'
    });
  }

  try {
    // Initialize Supabase with service role key for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      const missing = [];
      if (!supabaseUrl) missing.push('SUPABASE_URL');
      if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

      console.error('❌ Missing environment variables:', missing.join(', '));
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta. Variáveis faltando: ' + missing.join(', ')
      });
    }

    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body (can be from Asaas webhook or manual activation)
    const {
      subscription_id,
      payment_id,
      payment_status,
      payment_method,
      amount,
      // Asaas webhook specific fields
      event,
      payment: asaasPayment
    } = req.body;

    console.log('🎯 Subscription activation request:', {
      subscription_id,
      payment_id,
      payment_status,
      event,
      has_asaas_payment: !!asaasPayment
    });

    // Determine if this is an Asaas webhook or manual activation
    const isAsaasWebhook = event && asaasPayment;

    let finalSubscriptionId = subscription_id;
    let finalPaymentId = payment_id;
    let finalPaymentStatus = payment_status;

    if (isAsaasWebhook) {
      console.log('📡 Processing Asaas webhook:', event);

      // Extract data from Asaas webhook
      finalPaymentId = asaasPayment.id;
      finalPaymentStatus = asaasPayment.status;

      // Only process RECEIVED payments
      if (finalPaymentStatus !== 'RECEIVED') {
        console.log('⏳ Payment not yet received, ignoring webhook');
        return res.status(200).json({
          success: true,
          message: 'Webhook recebido, aguardando confirmação de pagamento'
        });
      }

      // Find subscription by payment_id
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('institution_user_subscriptions')
        .select('id, status, user_id, institution_id')
        .eq('payment_id', finalPaymentId)
        .eq('status', 'pending')
        .single();

      if (subscriptionError || !subscriptionData) {
        console.error('❌ Subscription not found for payment:', finalPaymentId);
        return res.status(404).json({
          success: false,
          error: 'Assinatura não encontrada para este pagamento'
        });
      }

      finalSubscriptionId = subscriptionData.id;
    }

    // Validate required parameters
    if (!finalSubscriptionId || !finalPaymentId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: subscription_id, payment_id'
      });
    }

    console.log('🔄 Activating subscription:', {
      subscription_id: finalSubscriptionId,
      payment_id: finalPaymentId,
      is_webhook: isAsaasWebhook
    });

    // Use RPC function to activate subscription
    const { data: result, error: rpcError } = await supabase
      .rpc('activate_institution_subscription', {
        p_subscription_id: finalSubscriptionId,
        p_payment_id: finalPaymentId
      });

    if (rpcError) {
      console.error('❌ RPC error activating subscription:', rpcError);
      return res.status(400).json({
        success: false,
        error: 'Erro ao ativar assinatura: ' + rpcError.message,
        error_code: rpcError.code
      });
    }

    console.log('✅ Subscription activation result:', result);

    // Check if activation was successful
    if (result && result.success) {
      console.log('🎉 Subscription activated successfully!');

      return res.status(200).json({
        success: true,
        message: 'Assinatura ativada com sucesso!',
        data: {
          subscription_id: finalSubscriptionId,
          payment_id: finalPaymentId,
          activated_at: new Date().toISOString(),
          webhook_processed: isAsaasWebhook
        }
      });
    } else {
      console.error('❌ Subscription activation failed:', result);
      return res.status(400).json({
        success: false,
        error: result?.error || 'Falha na ativação da assinatura',
        details: result
      });
    }

  } catch (error) {
    console.error('❌ Subscription activation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor: ' + (error.message || 'Erro desconhecido')
    });
  }
};