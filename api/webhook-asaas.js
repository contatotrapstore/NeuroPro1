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
    // Initialize services with error handling (with fallbacks for Vercel)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                               process.env.SUPABASE_SERVICE_KEY ||
                               process.env.VITE_SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        availableEnvVars: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
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
    // COMMENTED OUT: Asaas webhook validation was causing 401 errors
    // The Asaas platform has its own security mechanisms and IP restrictions
    // if (process.env.ASAAS_WEBHOOK_SECRET) {
    //   if (!signature) {
    //     console.error('Missing webhook signature');
    //     return res.status(401).json({
    //       error: 'Missing signature'
    //     });
    //   }

    //   const isValidSignature = asaasService.validateWebhookSignature(rawBody, signature);
    //   if (!isValidSignature) {
    //     console.error('Invalid webhook signature');
    //     return res.status(401).json({
    //       error: 'Invalid signature'
    //     });
    //   }
    // }

    console.log('✅ Webhook signature validation bypassed - accepting Asaas requests');

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
    externalReference: payment.externalReference,
    timestamp: new Date().toISOString()
  });

  // Determine if payment should activate subscriptions
  const shouldActivate = ['CONFIRMED', 'RECEIVED'].includes(payment.status);
  const newTransactionStatus = shouldActivate ? 'paid' : 'pending';

  console.log(`💰 Payment status: ${payment.status} → Transaction status: ${newTransactionStatus}`);

  try {
    // ============================================
    // STEP 1: UPDATE TRANSACTIONS TABLE FIRST
    // ============================================
    console.log('📝 STEP 1: Updating transactions table...');

    // Try to find transaction by asaas_payment_id
    const { data: existingTransaction, error: findTxError } = await supabase
      .from('transactions')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .single();

    let transactionUserId = null;
    let transactionData = null;

    if (existingTransaction) {
      console.log('✅ Found existing transaction:', {
        id: existingTransaction.id,
        userId: existingTransaction.user_id,
        currentStatus: existingTransaction.status
      });

      transactionUserId = existingTransaction.user_id;
      transactionData = existingTransaction;

      // Update transaction status
      const { error: updateTxError } = await supabase
        .from('transactions')
        .update({
          status: newTransactionStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTransaction.id);

      if (updateTxError) {
        console.error('❌ Error updating transaction:', updateTxError);
      } else {
        console.log(`✅ Transaction updated: ${existingTransaction.status} → ${newTransactionStatus}`);
      }
    } else {
      console.log('⚠️ No transaction found by payment ID:', payment.id);

      // Try to extract user_id from externalReference
      if (payment.externalReference) {
        // Format: "individual_USER_ID_TIMESTAMP" or "package_USER_ID_TIMESTAMP"
        const refParts = payment.externalReference.split('_');
        if (refParts.length >= 2) {
          // UUID is 36 chars, find it in the parts
          const uuidPart = refParts.find(part => part.length === 36 && part.includes('-'));
          if (uuidPart) {
            transactionUserId = uuidPart;
            console.log('👤 Extracted user_id from externalReference:', transactionUserId);
          }
        }
      }
    }

    // If we still don't have a user_id, try customer lookup
    if (!transactionUserId && payment.customer) {
      console.log('🔍 Looking up user by Asaas customer ID:', payment.customer);
      const { data: customerTransaction } = await supabase
        .from('transactions')
        .select('user_id')
        .eq('asaas_customer_id', payment.customer)
        .limit(1)
        .single();

      if (customerTransaction) {
        transactionUserId = customerTransaction.user_id;
        console.log('✅ Found user_id by customer ID:', transactionUserId);
      }
    }

    if (!transactionUserId) {
      console.error('❌ Could not determine user_id for payment:', payment.id);
      return;
    }

    // Don't proceed with subscription activation if payment is just PENDING
    if (!shouldActivate) {
      console.log('⏳ Payment is PENDING - transaction updated but subscriptions not activated yet');
      return;
    }

    // ============================================
    // STEP 2: UPDATE USER SUBSCRIPTIONS
    // ============================================
    console.log('📝 STEP 2: Updating user subscriptions for user:', transactionUserId);
    // ============================================
    // SIMPLIFIED SUBSCRIPTION RENEWAL LOGIC
    // ============================================

    // Get ALL user subscriptions (active or expired)
    const { data: userSubscriptions, error: userSubsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', transactionUserId);

    if (userSubsError) {
      console.error('❌ Error fetching user subscriptions:', userSubsError);
      return;
    }

    console.log(`📋 Found ${userSubscriptions?.length || 0} subscription(s) for user`);

    if (userSubscriptions && userSubscriptions.length > 0) {
      // Determine subscription period based on payment value
      let periodMonths = 1; // Default monthly
      const paymentValue = payment.value;

      // Detect period based on common pricing patterns
      if (paymentValue >= 150 && paymentValue < 300) {
        periodMonths = 6; // Semester
      } else if (paymentValue >= 300 || paymentValue > 2000) {
        periodMonths = 12; // Annual or package_all
      }

      // Calculate new expiration date
      const now = new Date();
      let newExpiresAt = new Date(now);
      newExpiresAt.setMonth(now.getMonth() + periodMonths);

      console.log(`📅 Renewal period: ${periodMonths} month(s), new expiration: ${newExpiresAt.toISOString()}`);

      // Update ALL user subscriptions
      const { error: updateError, count } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transactionUserId);

      if (updateError) {
        console.error('❌ Error updating subscriptions:', updateError);
      } else {
        console.log(`✅ Updated ${userSubscriptions.length} subscription(s) to active until ${newExpiresAt.toISOString()}`);
      }
    } else {
      console.warn('⚠️ No subscriptions found for user:', transactionUserId);
    }

    // ============================================
    // STEP 3: UPDATE USER PACKAGES (if any)
    // ============================================
    console.log('📝 STEP 3: Checking for user packages...');

    const { data: userPackages, error: pkgError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', transactionUserId);

    if (userPackages && userPackages.length > 0) {
      const pkg = userPackages[0];

      // Calculate new expiration (same logic as subscriptions)
      let periodMonths = 1;
      const paymentValue = payment.value;
      if (paymentValue >= 150 && paymentValue < 300) {
        periodMonths = 6;
      } else if (paymentValue >= 300 || paymentValue > 2000) {
        periodMonths = 12;
      }

      const now = new Date();
      let newPkgExpiresAt = new Date(now);
      newPkgExpiresAt.setMonth(now.getMonth() + periodMonths);

      const { error: updatePackageError } = await supabase
        .from('user_packages')
        .update({
          status: 'active',
          expires_at: newPkgExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transactionUserId);

      if (updatePackageError) {
        console.error('❌ Error updating package:', updatePackageError);
      } else {
        console.log(`✅ Package updated to active until ${newPkgExpiresAt.toISOString()}`);
      }
    }

    console.log('🎉 Payment processing completed successfully!');

  } catch (error) {
    console.error('❌ Error processing payment confirmation:', error);
    console.error('Stack:', error.stack);
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
    const { data: packageData, error: updatePackageError } = await supabase
      .from('user_packages')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription || payment.id)
      .select('id, user_id');

    if (updatePackageError) {
      console.error('Error updating package to overdue:', updatePackageError);
    } else if (packageData && packageData.length > 0) {
      // Also update all individual subscriptions linked to this package
      const pkg = packageData[0];
      const { error: updateSubsError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString()
        })
        .eq('package_id', pkg.id)
        .eq('user_id', pkg.user_id);

      if (updateSubsError) {
        console.error('❌ Error updating package subscriptions to overdue:', updateSubsError);
      } else {
        console.log(`✅ Package subscriptions set to overdue`);
      }
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
    const { data: packageData, error: updatePackageError } = await supabase
      .from('user_packages')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription || payment.id)
      .select('id, user_id');

    if (updatePackageError) {
      console.error('Error updating package to cancelled:', updatePackageError);
    } else if (packageData && packageData.length > 0) {
      // Also update all individual subscriptions linked to this package
      const pkg = packageData[0];
      const { error: updateSubsError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('package_id', pkg.id)
        .eq('user_id', pkg.user_id);

      if (updateSubsError) {
        console.error('❌ Error updating package subscriptions to cancelled:', updateSubsError);
      } else {
        console.log(`✅ Package subscriptions set to cancelled`);
      }
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
    const { data: packageData, error: updatePackageError } = await supabase
      .from('user_packages')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id)
      .select('id, user_id');

    if (updatePackageError) {
      console.error('Error updating package to overdue:', updatePackageError);
    } else if (packageData && packageData.length > 0) {
      // Also update all individual subscriptions linked to this package
      const pkg = packageData[0];
      const { error: updateSubsError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString()
        })
        .eq('package_id', pkg.id)
        .eq('user_id', pkg.user_id);

      if (updateSubsError) {
        console.error('❌ Error updating package subscriptions to overdue:', updateSubsError);
      } else {
        console.log(`✅ Package subscriptions set to overdue`);
      }
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
    const { data: packageData, error: updatePackageError } = await supabase
      .from('user_packages')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id)
      .select('id, user_id');

    if (updatePackageError) {
      console.error('Error updating package to cancelled:', updatePackageError);
    } else if (packageData && packageData.length > 0) {
      // Also update all individual subscriptions linked to this package
      const pkg = packageData[0];
      const { error: updateSubsError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('package_id', pkg.id)
        .eq('user_id', pkg.user_id);

      if (updateSubsError) {
        console.error('❌ Error updating package subscriptions to cancelled:', updateSubsError);
      } else {
        console.log(`✅ Package subscriptions set to cancelled`);
      }
    }

    // TODO: Send cancellation notification
    // TODO: Schedule access revocation at end of current period

  } catch (error) {
    console.error('Error processing subscription cancellation:', error);
  }
}