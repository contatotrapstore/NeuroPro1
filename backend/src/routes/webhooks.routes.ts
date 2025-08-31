import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { asaasService } from '../services/asaas.service';
import { ApiResponse } from '../types';

const router = express.Router();

// Webhook do Asaas para receber notificações de pagamento
router.post('/asaas', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['asaas-access-token'] as string;
    const payload = JSON.stringify(req.body);

    // Verificar assinatura do webhook
    if (!asaasService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { event, payment, subscription } = req.body;

    console.log('Asaas webhook received:', { event, payment: payment?.id, subscription: subscription?.id });

    // Processar eventos de pagamento
    if (event.startsWith('PAYMENT_')) {
      await handlePaymentWebhook(event, payment);
    }

    // Processar eventos de assinatura
    if (event.startsWith('SUBSCRIPTION_')) {
      await handleSubscriptionWebhook(event, subscription);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Webhook processed successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing Asaas webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Processar webhooks de pagamento
async function handlePaymentWebhook(event: string, payment: any) {
  try {
    switch (event) {
      case 'PAYMENT_CREATED':
        console.log('Payment created:', payment.id);
        break;

      case 'PAYMENT_AWAITING_PAYMENT':
        console.log('Payment awaiting payment:', payment.id);
        break;

      case 'PAYMENT_RECEIVED':
        console.log('Payment received:', payment.id);
        await activateSubscriptionByPayment(payment);
        break;

      case 'PAYMENT_CONFIRMED':
        console.log('Payment confirmed:', payment.id);
        await activateSubscriptionByPayment(payment);
        break;

      case 'PAYMENT_OVERDUE':
        console.log('Payment overdue:', payment.id);
        await handleOverduePayment(payment);
        break;

      case 'PAYMENT_DELETED':
        console.log('Payment deleted:', payment.id);
        break;

      case 'PAYMENT_RESTORED':
        console.log('Payment restored:', payment.id);
        break;

      case 'PAYMENT_REFUNDED':
        console.log('Payment refunded:', payment.id);
        break;

      default:
        console.log('Unknown payment event:', event);
    }
  } catch (error) {
    console.error('Error handling payment webhook:', error);
  }
}

// Processar webhooks de assinatura
async function handleSubscriptionWebhook(event: string, subscription: any) {
  try {
    switch (event) {
      case 'SUBSCRIPTION_CREATED':
        console.log('Subscription created:', subscription.id);
        break;

      case 'SUBSCRIPTION_UPDATED':
        console.log('Subscription updated:', subscription.id);
        await updateSubscriptionStatus(subscription);
        break;

      case 'SUBSCRIPTION_DELETED':
        console.log('Subscription deleted:', subscription.id);
        await cancelSubscriptionByAsaasId(subscription.id);
        break;

      case 'SUBSCRIPTION_CYCLE_CREATED':
        console.log('Subscription cycle created:', subscription.id);
        break;

      default:
        console.log('Unknown subscription event:', event);
    }
  } catch (error) {
    console.error('Error handling subscription webhook:', error);
  }
}

// Ativar assinatura quando pagamento é confirmado
async function activateSubscriptionByPayment(payment: any) {
  try {
    // Buscar assinatura no Asaas para obter o subscription ID
    if (payment.subscription) {
      await activateSubscriptionByAsaasId(payment.subscription);
    }
  } catch (error) {
    console.error('Error activating subscription by payment:', error);
  }
}

// Ativar assinatura por ID do Asaas
async function activateSubscriptionByAsaasId(asaasSubscriptionId: string) {
  try {
    // Atualizar assinaturas individuais
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', asaasSubscriptionId);

    if (subscriptionError) {
      console.error('Error updating user_subscriptions:', subscriptionError);
    } else {
      console.log('User subscriptions activated for Asaas ID:', asaasSubscriptionId);
    }

    // Atualizar pacotes
    const { error: packageError } = await supabase
      .from('user_packages')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', asaasSubscriptionId);

    if (packageError) {
      console.error('Error updating user_packages:', packageError);
    } else {
      console.log('User packages activated for Asaas ID:', asaasSubscriptionId);
    }
  } catch (error) {
    console.error('Error activating subscription:', error);
  }
}

// Cancelar assinatura por ID do Asaas
async function cancelSubscriptionByAsaasId(asaasSubscriptionId: string) {
  try {
    // Cancelar assinaturas individuais
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', asaasSubscriptionId);

    if (subscriptionError) {
      console.error('Error cancelling user_subscriptions:', subscriptionError);
    } else {
      console.log('User subscriptions cancelled for Asaas ID:', asaasSubscriptionId);
    }

    // Cancelar pacotes
    const { error: packageError } = await supabase
      .from('user_packages')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', asaasSubscriptionId);

    if (packageError) {
      console.error('Error cancelling user_packages:', packageError);
    } else {
      console.log('User packages cancelled for Asaas ID:', asaasSubscriptionId);
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
  }
}

// Atualizar status da assinatura
async function updateSubscriptionStatus(subscription: any) {
  try {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'active',
      'INACTIVE': 'cancelled',
      'EXPIRED': 'expired'
    };

    const newStatus = statusMap[subscription.status] || 'pending';

    // Atualizar assinaturas individuais
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id);

    if (subscriptionError) {
      console.error('Error updating subscription status:', subscriptionError);
    }

    // Atualizar pacotes
    const { error: packageError } = await supabase
      .from('user_packages')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id);

    if (packageError) {
      console.error('Error updating package status:', packageError);
    }

    console.log(`Status updated to ${newStatus} for Asaas ID:`, subscription.id);
  } catch (error) {
    console.error('Error updating subscription status:', error);
  }
}

// Tratar pagamento em atraso
async function handleOverduePayment(payment: any) {
  try {
    if (payment.subscription) {
      // Buscar e suspender temporariamente a assinatura
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'expired', // ou 'suspended' se você tiver esse status
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', payment.subscription);

      if (subscriptionError) {
        console.error('Error handling overdue payment for subscriptions:', subscriptionError);
      }

      // Suspender pacotes
      const { error: packageError } = await supabase
        .from('user_packages')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', payment.subscription);

      if (packageError) {
        console.error('Error handling overdue payment for packages:', packageError);
      }

      console.log('Subscription marked as overdue for Asaas ID:', payment.subscription);
    }
  } catch (error) {
    console.error('Error handling overdue payment:', error);
  }
}

export default router;