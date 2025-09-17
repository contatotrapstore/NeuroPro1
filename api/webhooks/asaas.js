/**
 * Asaas Webhook Handler - NeuroIA Lab
 * Processes payment notifications from Asaas
 */

const { createClient } = require('@supabase/supabase-js');
const AsaasService = require('../services/asaas.service');

module.exports = async function handler(req, res) {
  console.log('🔔 Asaas Webhook received');

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    // Initialize services
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return res.status(500).json({
        error: 'Server configuration error'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const asaasService = new AsaasService();

    // Get raw body for signature validation
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['asaas-signature'] || req.headers['x-asaas-signature'];

    // Validate webhook signature if configured
    if (process.env.ASAAS_WEBHOOK_SECRET) {
      if (!signature) {
        console.error('Missing webhook signature');
        return res.status(401).json({
          error: 'Missing signature'
        });
      }

      const isValidSignature = asaasService.validateWebhookSignature(rawBody, signature);
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return res.status(401).json({
          error: 'Invalid signature'
        });
      }
    }

    const webhookData = req.body;
    console.log('Webhook data received:', {
      event: webhookData.event,
      paymentId: webhookData.payment?.id,
      subscriptionId: webhookData.subscription?.id
    });

    // Process different webhook events
    switch (webhookData.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await handlePaymentConfirmed(supabase, webhookData);
        break;

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(supabase, webhookData);
        break;

      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        await handlePaymentCancelled(supabase, webhookData);
        break;

      case 'SUBSCRIPTION_RECEIVED':
        await handleSubscriptionReceived(supabase, webhookData);
        break;

      case 'SUBSCRIPTION_OVERDUE':
        await handleSubscriptionOverdue(supabase, webhookData);
        break;

      case 'SUBSCRIPTION_CANCELLED':
        await handleSubscriptionCancelled(supabase, webhookData);
        break;

      default:
        console.log('Unhandled webhook event:', webhookData.event);
    }

    // Always return success to acknowledge webhook
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

/**
 * Handle payment confirmed
 */
async function handlePaymentConfirmed(supabase, webhookData) {
  const payment = webhookData.payment;
  console.log('Processing payment confirmation:', payment.id);

  try {
    // Update subscription status based on payment
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('asaas_subscription_id', payment.subscription || payment.id);

    if (subsError) {
      console.error('Error finding subscriptions:', subsError);
      return;
    }

    if (subscriptions && subscriptions.length > 0) {
      // Update subscription status to active
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', payment.subscription || payment.id);

      if (updateError) {
        console.error('Error updating subscription status:', updateError);
      } else {
        console.log('Subscription activated:', subscriptions.length, 'records');
      }
    }

    // Update package status if applicable
    const { data: packages, error: packagesError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('asaas_subscription_id', payment.subscription || payment.id);

    if (packages && packages.length > 0) {
      const { error: updatePackageError } = await supabase
        .from('user_packages')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', payment.subscription || payment.id);

      if (updatePackageError) {
        console.error('Error updating package status:', updatePackageError);
      } else {
        console.log('Package activated:', packages.length, 'records');
      }
    }

    // TODO: Send confirmation email to user
    // TODO: Log payment for analytics

  } catch (error) {
    console.error('Error processing payment confirmation:', error);
  }
}

/**
 * Handle payment overdue
 */
async function handlePaymentOverdue(supabase, webhookData) {
  const payment = webhookData.payment;
  console.log('Processing payment overdue:', payment.id);

  try {
    // Update subscription status to overdue
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription || payment.id);

    if (updateError) {
      console.error('Error updating subscription to overdue:', updateError);
    }

    // Update package status to overdue
    const { error: updatePackageError } = await supabase
      .from('user_packages')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription || payment.id);

    if (updatePackageError) {
      console.error('Error updating package to overdue:', updatePackageError);
    }

    // TODO: Send overdue notification email
    // TODO: Temporarily suspend access

  } catch (error) {
    console.error('Error processing payment overdue:', error);
  }
}

/**
 * Handle payment cancelled/refunded
 */
async function handlePaymentCancelled(supabase, webhookData) {
  const payment = webhookData.payment;
  console.log('Processing payment cancellation:', payment.id);

  try {
    // Update subscription status to cancelled
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription || payment.id);

    if (updateError) {
      console.error('Error updating subscription to cancelled:', updateError);
    }

    // Update package status to cancelled
    const { error: updatePackageError } = await supabase
      .from('user_packages')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription || payment.id);

    if (updatePackageError) {
      console.error('Error updating package to cancelled:', updatePackageError);
    }

    // TODO: Send cancellation confirmation email
    // TODO: Revoke access immediately

  } catch (error) {
    console.error('Error processing payment cancellation:', error);
  }
}

/**
 * Handle subscription received (first payment of recurring subscription)
 */
async function handleSubscriptionReceived(supabase, webhookData) {
  const subscription = webhookData.subscription;
  console.log('Processing subscription received:', subscription.id);

  try {
    // Calculate next expiration date
    const today = new Date();
    const nextExpiration = new Date(today);

    // Get subscription details to determine cycle
    const { data: dbSubscription } = await supabase
      .from('user_subscriptions')
      .select('subscription_type')
      .eq('asaas_subscription_id', subscription.id)
      .single();

    if (dbSubscription) {
      if (dbSubscription.subscription_type === 'monthly') {
        nextExpiration.setMonth(today.getMonth() + 1);
      } else {
        nextExpiration.setMonth(today.getMonth() + 6);
      }

      // Update subscription with new expiration
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          expires_at: nextExpiration.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', subscription.id);

      if (updateError) {
        console.error('Error updating subscription expiration:', updateError);
      }

      // Update package expiration as well
      const { error: updatePackageError } = await supabase
        .from('user_packages')
        .update({
          status: 'active',
          expires_at: nextExpiration.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', subscription.id);

      if (updatePackageError) {
        console.error('Error updating package expiration:', updatePackageError);
      }
    }

  } catch (error) {
    console.error('Error processing subscription received:', error);
  }
}

/**
 * Handle subscription overdue
 */
async function handleSubscriptionOverdue(supabase, webhookData) {
  const subscription = webhookData.subscription;
  console.log('Processing subscription overdue:', subscription.id);

  try {
    // Update subscription status to overdue (grace period)
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription to overdue:', updateError);
    }

    // Update package status to overdue
    const { error: updatePackageError } = await supabase
      .from('user_packages')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id);

    if (updatePackageError) {
      console.error('Error updating package to overdue:', updatePackageError);
    }

    // TODO: Send payment reminder email
    // TODO: Implement grace period logic

  } catch (error) {
    console.error('Error processing subscription overdue:', error);
  }
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCancelled(supabase, webhookData) {
  const subscription = webhookData.subscription;
  console.log('Processing subscription cancellation:', subscription.id);

  try {
    // Update subscription status to cancelled
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription to cancelled:', updateError);
    }

    // Update package status to cancelled
    const { error: updatePackageError } = await supabase
      .from('user_packages')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id);

    if (updatePackageError) {
      console.error('Error updating package to cancelled:', updatePackageError);
    }

    // TODO: Send cancellation notification
    // TODO: Schedule access revocation at end of current period

  } catch (error) {
    console.error('Error processing subscription cancellation:', error);
  }
}