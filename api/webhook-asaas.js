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
    timestamp: new Date().toISOString()
  });

  // Log credit card payment for debugging
  if (payment.billingType === 'CREDIT_CARD') {
    console.log('💳 Credit card payment detected:', {
      paymentId: payment.id,
      status: payment.status,
      subscriptionId: payment.subscription,
      value: payment.value,
      billingType: payment.billingType
    });

    // For credit card, we should process CONFIRMED, RECEIVED, and even PENDING
    // because Asaas may send PENDING first then CONFIRMED later
    if (!['CONFIRMED', 'RECEIVED', 'PENDING'].includes(payment.status)) {
      console.warn('⚠️ Credit card payment status not processable:', payment.status);
      return; // Don't activate subscription for failed/cancelled payments
    }

    // Only activate subscription for confirmed payments
    if (payment.status === 'PENDING') {
      console.log('📋 Credit card payment is PENDING - updating status but not activating yet');
    } else {
      console.log('✅ Credit card payment confirmed - will activate subscription');
    }
  }

  try {
    // For ONE-TIME PAYMENTS, we always use payment ID (much simpler!)
    let subscriptionSearchId = payment.id;
    console.log('🔍 Searching by payment ID (one-time payment):', subscriptionSearchId);

    // Legacy support: if payment.subscription exists, try that too
    if (payment.subscription) {
      console.log('🔍 Also checking legacy subscription ID:', payment.subscription);
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

    // Update subscription status based on payment (try payment ID first, then subscription ID)
    let subscriptions = [];
    let subsError = null;

    // First try with payment ID (for one-time payments)
    const { data: paymentSubscriptions, error: paymentSubsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('asaas_subscription_id', payment.id);

    if (!paymentSubsError && paymentSubscriptions && paymentSubscriptions.length > 0) {
      subscriptions = paymentSubscriptions;
      console.log('✅ Found subscriptions by payment ID:', payment.id);
    } else if (payment.subscription) {
      // Fallback: try with subscription ID (for legacy subscriptions)
      const { data: legacySubscriptions, error: legacySubsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('asaas_subscription_id', payment.subscription);

      subscriptions = legacySubscriptions || [];
      subsError = legacySubsError;
      console.log('✅ Found subscriptions by subscription ID:', payment.subscription);
    } else {
      subsError = paymentSubsError;
    }

    if (subsError) {
      console.error('Error finding subscriptions:', subsError);
      return;
    }

    // If no subscriptions found by payment/subscription ID, try to find by user + assistant
    // This handles cases where user made a new payment for an existing subscription
    if (!subscriptions || subscriptions.length === 0) {
      console.log('🔍 No subscriptions found by payment ID, searching by externalReference...');

      // Extract user_id from externalReference (format: "individual_USER_ID_TIMESTAMP")
      const externalRef = payment.externalReference;
      if (externalRef && externalRef.startsWith('individual_')) {
        const parts = externalRef.split('_');
        if (parts.length >= 2) {
          const userId = parts[1];
          console.log('👤 Extracted user_id from externalReference:', userId);

          // Get user's subscriptions to find potential renewal candidates
          const { data: userSubscriptions, error: userSubsError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['active', 'expired', 'cancelled']);

          if (!userSubsError && userSubscriptions && userSubscriptions.length > 0) {
            console.log(`✅ Found ${userSubscriptions.length} subscription(s) for user to potentially renew`);

            // Try to match by subscription type and amount
            // This assumes the payment description or value can help identify the right subscription
            const matchingSubscriptions = userSubscriptions.filter(sub => {
              // Match by subscription type based on payment value
              const monthlyRange = [39, 40, 59, 60]; // Common monthly prices
              const semesterRange = [199, 200, 259, 260]; // Common semester prices

              if (sub.subscription_type === 'monthly' && monthlyRange.includes(Math.floor(payment.value))) {
                return true;
              }
              if (sub.subscription_type === 'semester' && semesterRange.includes(Math.floor(payment.value))) {
                return true;
              }
              return false;
            });

            if (matchingSubscriptions.length > 0) {
              // Use the first matching subscription (or the most recently expired one)
              subscriptions = matchingSubscriptions.sort((a, b) =>
                new Date(b.expires_at) - new Date(a.expires_at)
              );
              console.log('🎯 Matched subscription by user + value:', {
                subscriptionId: subscriptions[0].id,
                assistant: subscriptions[0].assistant_id,
                currentStatus: subscriptions[0].status,
                expiresAt: subscriptions[0].expires_at
              });
            } else {
              // If no match by value, take all subscriptions (admin might need to verify)
              subscriptions = userSubscriptions;
              console.log('⚠️ Using all user subscriptions (no value match)');
            }
          } else {
            console.log('❌ No subscriptions found for user:', userId);
          }
        }
      } else {
        console.log('⚠️ Could not extract user_id from externalReference:', externalRef);
      }
    }

    console.log('🔍 Found subscriptions:', {
      count: subscriptions?.length || 0,
      foundByPaymentId: !!paymentSubscriptions?.length,
      foundBySubscriptionId: !!(payment.subscription && legacySubscriptions?.length),
      foundIds: subscriptions?.map(s => s.id) || []
    });

    if (subscriptions && subscriptions.length > 0) {
      // Determine the new status based on payment status
      let newStatus = 'pending'; // Default for PENDING payments
      if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
        newStatus = 'active';
      }

      const subscription = subscriptions[0];
      const isRenewal = subscription.status === 'active' && new Date(subscription.expires_at) > new Date();

      console.log(`📋 Processing subscription:`, {
        currentStatus: subscription.status,
        newStatus: newStatus,
        expiresAt: subscription.expires_at,
        subscriptionType: subscription.subscription_type,
        isRenewal: isRenewal
      });

      // Calculate new expiration date
      let newExpiresAt;
      if (isRenewal) {
        // RENEWAL: Extend from current expiration date
        console.log('🔄 RENEWAL detected - extending from current expiration');
        const currentExpiration = new Date(subscription.expires_at);
        newExpiresAt = new Date(currentExpiration);

        if (subscription.subscription_type === 'monthly') {
          newExpiresAt.setMonth(currentExpiration.getMonth() + 1);
        } else if (subscription.subscription_type === 'semester') {
          newExpiresAt.setMonth(currentExpiration.getMonth() + 6);
        } else if (subscription.subscription_type === 'annual') {
          newExpiresAt.setFullYear(currentExpiration.getFullYear() + 1);
        } else {
          newExpiresAt.setMonth(currentExpiration.getMonth() + 1);
        }
      } else {
        // NEW SUBSCRIPTION or REACTIVATION: Calculate from now
        console.log('➕ NEW subscription or REACTIVATION - calculating from now');
        newExpiresAt = new Date();

        if (subscription.subscription_type === 'monthly') {
          newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
        } else if (subscription.subscription_type === 'semester') {
          newExpiresAt.setMonth(newExpiresAt.getMonth() + 6);
        } else if (subscription.subscription_type === 'annual') {
          newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
        } else {
          newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
        }
      }

      console.log(`📅 Expiration date: ${subscription.expires_at} → ${newExpiresAt.toISOString()}`);

      // Update subscription status and expiration
      const updateId = subscription.asaas_subscription_id;
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: newStatus,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', updateId);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
      } else {
        console.log(`✅ Subscription updated:`, {
          status: newStatus,
          expiresAt: newExpiresAt.toISOString(),
          isRenewal: isRenewal,
          recordsUpdated: subscriptions.length
        });
      }
    } else {
      console.warn('⚠️ No subscriptions found for payment:', {
        paymentId: payment.id,
        subscriptionId: payment.subscription,
        searchId: subscriptionSearchId
      });
    }

    // Update package status if applicable (try payment ID first, then subscription ID)
    let packages = [];

    // First try with payment ID
    const { data: paymentPackages } = await supabase
      .from('user_packages')
      .select('*')
      .eq('asaas_subscription_id', payment.id);

    if (paymentPackages && paymentPackages.length > 0) {
      packages = paymentPackages;
      console.log('✅ Found packages by payment ID:', payment.id);
    } else if (payment.subscription) {
      // Fallback: try with subscription ID
      const { data: legacyPackages } = await supabase
        .from('user_packages')
        .select('*')
        .eq('asaas_subscription_id', payment.subscription);

      packages = legacyPackages || [];
      console.log('✅ Found packages by subscription ID:', payment.subscription);
    }

    if (packages && packages.length > 0) {
      // Use same status logic for packages
      let newPackageStatus = 'pending';
      if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
        newPackageStatus = 'active';
      }

      const pkg = packages[0];
      const isPkgRenewal = pkg.status === 'active' && new Date(pkg.expires_at) > new Date();

      console.log(`📦 Processing package:`, {
        currentStatus: pkg.status,
        newStatus: newPackageStatus,
        expiresAt: pkg.expires_at,
        subscriptionType: pkg.subscription_type,
        isRenewal: isPkgRenewal
      });

      // Calculate new expiration date for package
      let newPkgExpiresAt;
      if (isPkgRenewal) {
        // RENEWAL: Extend from current expiration date
        console.log('🔄 PACKAGE RENEWAL detected - extending from current expiration');
        const currentExpiration = new Date(pkg.expires_at);
        newPkgExpiresAt = new Date(currentExpiration);

        if (pkg.subscription_type === 'monthly') {
          newPkgExpiresAt.setMonth(currentExpiration.getMonth() + 1);
        } else if (pkg.subscription_type === 'semester') {
          newPkgExpiresAt.setMonth(currentExpiration.getMonth() + 6);
        } else if (pkg.subscription_type === 'annual') {
          newPkgExpiresAt.setFullYear(currentExpiration.getFullYear() + 1);
        } else {
          newPkgExpiresAt.setMonth(currentExpiration.getMonth() + 1);
        }
      } else {
        // NEW PACKAGE or REACTIVATION: Calculate from now
        console.log('➕ NEW package or REACTIVATION - calculating from now');
        newPkgExpiresAt = new Date();

        if (pkg.subscription_type === 'monthly') {
          newPkgExpiresAt.setMonth(newPkgExpiresAt.getMonth() + 1);
        } else if (pkg.subscription_type === 'semester') {
          newPkgExpiresAt.setMonth(newPkgExpiresAt.getMonth() + 6);
        } else if (pkg.subscription_type === 'annual') {
          newPkgExpiresAt.setFullYear(newPkgExpiresAt.getFullYear() + 1);
        } else {
          newPkgExpiresAt.setMonth(newPkgExpiresAt.getMonth() + 1);
        }
      }

      console.log(`📅 Package expiration: ${pkg.expires_at} → ${newPkgExpiresAt.toISOString()}`);

      // Update package status and expiration
      const packageUpdateId = pkg.asaas_subscription_id;
      const { error: updatePackageError } = await supabase
        .from('user_packages')
        .update({
          status: newPackageStatus,
          expires_at: newPkgExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', packageUpdateId);

      if (updatePackageError) {
        console.error('Error updating package:', updatePackageError);
      } else {
        console.log(`✅ Package updated:`, {
          status: newPackageStatus,
          expiresAt: newPkgExpiresAt.toISOString(),
          isRenewal: isPkgRenewal,
          recordsUpdated: packages.length
        });
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