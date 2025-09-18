/**
 * Asaas Webhook Handler - NeuroIA Lab
 * Processes payment notifications from Asaas
 */

const { createClient } = require('@supabase/supabase-js');
const AsaasService = require('./services/asaas.service');
const { applyCors } = require('./utils/cors');

module.exports = async function handler(req, res) {
  const timestamp = new Date().toISOString();
  console.log('🔔 Asaas Webhook received at:', timestamp);
  console.log('📋 Request Details:', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'asaas-signature': req.headers['asaas-signature'] ? 'present' : 'missing',
      'x-asaas-signature': req.headers['x-asaas-signature'] ? 'present' : 'missing'
    },
    bodySize: req.body ? JSON.stringify(req.body).length : 0
  });

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) {
    console.log('✅ CORS preflight handled successfully');
    return; // Preflight request handled
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({
      error: 'Method not allowed',
      received: req.method,
      expected: 'POST'
    });
  }

  try {
    // Initialize services with error handling
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return res.status(500).json({
        error: 'Server configuration error'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const asaasService = new AsaasService();

    console.log('✅ Webhook services initialized successfully');

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

    // Validate webhook data
    if (!webhookData || !webhookData.event) {
      console.error('❌ Invalid webhook data received:', webhookData);
      return res.status(400).json({
        error: 'Invalid webhook data - missing event'
      });
    }

    console.log('📦 Webhook data received:', {
      event: webhookData.event,
      paymentId: webhookData.payment?.id,
      subscriptionId: webhookData.subscription?.id,
      hasPayment: !!webhookData.payment,
      hasSubscription: !!webhookData.subscription,
      timestamp: timestamp
    });

    // Log full webhook data for debugging (remove in production)
    console.log('🔍 Full webhook data:', JSON.stringify(webhookData, null, 2));

    // Special handling for known problematic payment
    if (webhookData.payment?.id === 'pay_bguudk6oev9nqmpw') {
      console.log('🚨 Processing known PIX payment that was causing issues');
      console.log('💳 Payment details:', {
        id: webhookData.payment.id,
        status: webhookData.payment.status,
        billingType: webhookData.payment.billingType,
        subscription: webhookData.payment.subscription,
        externalReference: webhookData.payment.externalReference
      });
    }

    // Process different webhook events with error handling
    try {
      switch (webhookData.event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          console.log('🎯 Processing payment confirmation event');
          await handlePaymentConfirmed(supabase, webhookData);
          break;

        case 'PAYMENT_OVERDUE':
          console.log('⚠️ Processing payment overdue event');
          await handlePaymentOverdue(supabase, webhookData);
          break;

        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
          console.log('❌ Processing payment cancelled event');
          await handlePaymentCancelled(supabase, webhookData);
          break;

        case 'SUBSCRIPTION_RECEIVED':
          console.log('📋 Processing subscription received event');
          await handleSubscriptionReceived(supabase, webhookData);
          break;

        case 'SUBSCRIPTION_OVERDUE':
          console.log('⚠️ Processing subscription overdue event');
          await handleSubscriptionOverdue(supabase, webhookData);
          break;

        case 'SUBSCRIPTION_CANCELLED':
          console.log('❌ Processing subscription cancelled event');
          await handleSubscriptionCancelled(supabase, webhookData);
          break;

        default:
          console.log('❓ Unhandled webhook event:', webhookData.event);
      }

      console.log('✅ Webhook event processed successfully');

    } catch (eventError) {
      console.error('❌ Error processing webhook event:', {
        event: webhookData.event,
        error: eventError.message,
        stack: eventError.stack,
        paymentId: webhookData.payment?.id,
        subscriptionId: webhookData.subscription?.id,
        timestamp: timestamp
      });

      // Log additional debugging info
      console.error('🔍 Event processing failed - webhook data:', JSON.stringify(webhookData, null, 2));

      // Continue execution but log the error
      // Don't return error to Asaas to avoid webhook retries for valid events
    }

    // Always return success to acknowledge webhook
    console.log('✅ Webhook processing completed successfully at:', new Date().toISOString());
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: timestamp,
      event: webhookData.event
    });

  } catch (error) {
    console.error('❌ Critical webhook processing error:', {
      error: error.message,
      stack: error.stack,
      timestamp: timestamp,
      url: req.url,
      method: req.method
    });
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: timestamp
    });
  }
};

/**
 * Handle payment confirmed
 */
async function handlePaymentConfirmed(supabase, webhookData) {
  const payment = webhookData.payment;
  console.log('🎯 Processing payment confirmation:', {
    paymentId: payment.id,
    subscriptionId: payment.subscription,
    value: payment.value,
    billingType: payment.billingType,
    status: payment.status,
    timestamp: new Date().toISOString()
  });

  // Extra validation for credit card payments
  if (payment.billingType === 'CREDIT_CARD') {
    console.log('💳 Credit card payment detected - applying extra validation');
    if (payment.status !== 'CONFIRMED' && payment.status !== 'RECEIVED') {
      console.warn('⚠️ Credit card payment status not confirmed:', payment.status);
      return; // Don't activate subscription if payment not properly confirmed
    }
  }

  try {
    // For PIX subscriptions, we need to search correctly
    let subscriptionSearchId = null;

    if (payment.subscription) {
      // This is a subscription payment - use subscription ID
      subscriptionSearchId = payment.subscription;
      console.log('🔍 Searching by subscription ID:', subscriptionSearchId);
    } else {
      // This might be a single payment - use payment ID
      subscriptionSearchId = payment.id;
      console.log('🔍 Searching by payment ID:', subscriptionSearchId);
    }

    if (!subscriptionSearchId) {
      console.error('❌ No valid ID found for subscription search');
      console.error('🔍 Payment data:', {
        paymentId: payment.id,
        subscriptionId: payment.subscription,
        externalReference: payment.externalReference,
        status: payment.status
      });
      return;
    }

    // Update subscription status based on payment
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('asaas_subscription_id', subscriptionSearchId);

    if (subsError) {
      console.error('Error finding subscriptions:', subsError);
      return;
    }

    console.log('🔍 Found subscriptions:', {
      count: subscriptions?.length || 0,
      searchId: subscriptionSearchId,
      foundIds: subscriptions?.map(s => s.id) || []
    });

    if (subscriptions && subscriptions.length > 0) {
      // Update subscription status to active
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', subscriptionSearchId);

      if (updateError) {
        console.error('Error updating subscription status:', updateError);
      } else {
        console.log('✅ Subscription activated:', subscriptions.length, 'records');
      }
    } else {
      console.warn('⚠️ No subscriptions found for payment:', {
        paymentId: payment.id,
        subscriptionId: payment.subscription,
        searchId: subscriptionSearchId
      });
    }

    // Update package status if applicable
    const { data: packages, error: packagesError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('asaas_subscription_id', subscriptionSearchId);

    if (packages && packages.length > 0) {
      const { error: updatePackageError } = await supabase
        .from('user_packages')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', subscriptionSearchId);

      if (updatePackageError) {
        console.error('Error updating package status:', updatePackageError);
      } else {
        console.log('✅ Package activated:', packages.length, 'records');
      }
    } else {
      console.warn('⚠️ No packages found for payment:', {
        paymentId: payment.id,
        subscriptionId: payment.subscription,
        searchId: subscriptionSearchId
      });
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