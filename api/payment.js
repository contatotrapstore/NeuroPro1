/**
 * Payment API - NeuroIA Lab
 * Handles payment processing with Asaas integration
 */

const { createClient } = require('@supabase/supabase-js');
const AsaasService = require('./services/asaas.service');

module.exports = async function handler(req, res) {
  // IMMEDIATE CORS - FIRST 3 LINES OF FUNCTION
  console.log('🚀 Payment API v1.2 - IMMEDIATE CORS');
  console.log('📋 Request:', { method: req.method, origin: req.headers.origin, url: req.url });

  // 🔥 CRITICAL: Capture client IP for Asaas credit card processing (REQUIRED!)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   '127.0.0.1'; // fallback

  console.log('🌐 Client IP captured:', {
    ip: clientIp,
    xForwardedFor: req.headers['x-forwarded-for'],
    xRealIp: req.headers['x-real-ip'],
    source: req.headers['x-forwarded-for'] ? 'x-forwarded-for' : 'fallback'
  });

  // FORCE CORS HEADERS IMMEDIATELY - NO CONDITIONS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  console.log('✅ CORS headers set immediately');

  // Handle preflight immediately
  if (req.method === 'OPTIONS') {
    console.log('🔍 OPTIONS preflight - returning 200 immediately');
    res.status(200).end();
    return;
  }

  console.log('🎯 Continuing with main logic...');

  try {
    // Initialize services
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const asaasService = new AsaasService();

    // Get user from auth token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client to validate token
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Get user from token using Supabase auth
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    const userId = user.id;

    // Parse URL for routing
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);

    if (req.method === 'POST') {
      // POST /payment/create - Create payment
      if (pathParts[pathParts.length - 1] === 'create') {
        const {
          type, // 'individual' or 'package'
          assistant_id,
          package_type,
          subscription_type,
          selected_assistants,
          payment_method,
          customer_data,
          card_data
        } = req.body;

        console.log('Creating payment:', {
          type,
          assistant_id,
          package_type,
          subscription_type,
          payment_method,
          user_id: userId
        });

        // Validate required fields
        if (!type || !subscription_type || !payment_method || !customer_data) {
          return res.status(400).json({
            success: false,
            error: 'Dados obrigatórios não fornecidos'
          });
        }

        if (type === 'individual' && !assistant_id) {
          return res.status(400).json({
            success: false,
            error: 'ID do assistente é obrigatório para assinatura individual'
          });
        }

        if (type === 'package' && !package_type) {
          return res.status(400).json({
            success: false,
            error: 'Tipo do pacote é obrigatório'
          });
        }

        // For package_all, selected_assistants will be auto-populated, so skip validation here
        if (type === 'package' && package_type !== 'package_all' && !selected_assistants?.length) {
          return res.status(400).json({
            success: false,
            error: 'Assistentes do pacote são obrigatórios'
          });
        }

        if (payment_method === 'CREDIT_CARD' && !card_data) {
          return res.status(400).json({
            success: false,
            error: 'Dados do cartão são obrigatórios para pagamento via cartão'
          });
        }

        try {
          // 1. Create or get Asaas customer
          const asaasCustomer = await asaasService.createCustomer({
            ...customer_data,
            externalReference: userId
          });

          console.log('Asaas customer created/updated:', asaasCustomer.id);

          // 2. Store customer reference in database
          await supabase
            .from('asaas_customers')
            .upsert({
              user_id: userId,
              asaas_customer_id: asaasCustomer.id
            }, {
              onConflict: 'user_id'
            });

          // 3. Calculate pricing
          let totalAmount = 0;
          let description = '';

          if (type === 'individual') {
            // Get assistant pricing
            const { data: assistant, error: assistantError } = await supabase
              .from('assistants')
              .select('name, monthly_price, semester_price, annual_price')
              .eq('id', assistant_id)
              .single();

            if (assistantError || !assistant) {
              return res.status(404).json({
                success: false,
                error: 'Assistente não encontrado'
              });
            }

            // Individual assistant pricing (normal prices, no Black Friday for individuals)
            if (subscription_type === 'monthly') {
              totalAmount = assistant.monthly_price;
            } else if (subscription_type === 'semester') {
              totalAmount = assistant.semester_price;
            } else if (subscription_type === 'annual') {
              totalAmount = assistant.annual_price || 239.90;
            } else {
              totalAmount = assistant.monthly_price; // Fallback
            }

            const subscriptionTypeLabel = subscription_type === 'monthly' ? 'Mensal' :
                                         subscription_type === 'semester' ? 'Semestral' :
                                         subscription_type === 'annual' ? 'Anual' : 'Mensal';

            description = `Assinatura ${subscriptionTypeLabel} - ${assistant.name}`;
          } else {
            // Package pricing
            // BLACK FRIDAY: package_all - 12x R$ 199 monthly (total R$ 2,388) until 01/12/2025
            const now = new Date();
            const blackFridayEnd = new Date('2025-12-01T23:59:59-03:00');
            const isBlackFriday = now < blackFridayEnd;

            const packagePricing = {
              package_3: {
                monthly: 99.90,
                semester: 499.00
              },
              package_6: {
                monthly: 179.90,
                semester: 899.90
              },
              package_all: {
                monthly: isBlackFriday ? 2388.00 : 999.00  // Black Friday 12x R$199 = R$2,388, normal R$999
              }
            };

            // Auto-populate all active assistants for package_all
            if (package_type === 'package_all') {
              const { data: allAssistants, error: assistantsError } = await supabase
                .from('assistants')
                .select('id, name')
                .eq('is_active', true)
                .order('name');

              if (assistantsError || !allAssistants?.length) {
                console.error('Error fetching assistants for package_all:', assistantsError);
                return res.status(500).json({
                  success: false,
                  error: 'Erro ao buscar assistentes disponíveis'
                });
              }

              selected_assistants = allAssistants.map(a => a.id);
              console.log(`🔥 BLACK FRIDAY package_all: Auto-selected ${allAssistants.length} assistants`);
            }

            totalAmount = packagePricing[package_type][subscription_type];

            let packageLabel = package_type === 'package_3' ? '3 Assistentes' :
                             package_type === 'package_6' ? '6 Assistentes' :
                             `Todos os ${selected_assistants.length} Assistentes`;

            let subscriptionLabel = subscription_type === 'monthly' ? 'Mensal' :
                                  subscription_type === 'semester' ? 'Semestral' :
                                  'Anual';

            description = `Pacote ${packageLabel} - ${subscriptionLabel}`;

            if (package_type === 'package_all' && isBlackFriday) {
              console.log(`🔥 BLACK FRIDAY: package_all pricing - PROMOTIONAL 12x R$ 199.00 (total R$ 2.388,00) for ${selected_assistants.length} assistants`);
            }
          }

          // 4. Create payment in Asaas (ONE-TIME PAYMENT - NO MORE SUBSCRIPTIONS)
          let asaasResult;
          const isRecurring = false; // Always create one-time payment for better approval rates

          const paymentData = {
            customerId: asaasCustomer.id,
            billingType: payment_method,
            value: asaasService.formatCurrencyValue(totalAmount),
            description,
            externalReference: `${type}_${userId}_${Date.now()}`,
            customerEmail: customer_data.email,
            customerCpfCnpj: customer_data.cpfCnpj,
            customerPostalCode: customer_data.postalCode,
            customerAddressNumber: customer_data.addressNumber,
            customerPhone: customer_data.mobilePhone || customer_data.phone
          };

          if (payment_method === 'CREDIT_CARD') {
            // 🔍 ENHANCED DEBUG: Log all credit card data before processing
            console.log('🚨 CREDIT CARD DEBUG - Raw card_data received:', {
              hasCardData: !!card_data,
              cardDataKeys: card_data ? Object.keys(card_data) : [],
              holderName: card_data?.holderName,
              numberLength: card_data?.number?.length,
              numberStart: card_data?.number?.substring(0, 4),
              expiryMonth: card_data?.expiryMonth,
              expiryMonthType: typeof card_data?.expiryMonth,
              expiryYear: card_data?.expiryYear,
              expiryYearType: typeof card_data?.expiryYear,
              ccvLength: card_data?.ccv?.length,
              clientIp: clientIp
            });

            // 🔧 CRITICAL FIX: Ensure proper format for Asaas API
            const formattedCardData = {
              holderName: card_data.holderName,
              number: card_data.number.replace(/\D/g, ''), // Remove all non-digits
              expiryMonth: String(card_data.expiryMonth).padStart(2, '0'), // Ensure 2 digits: 01-12
              expiryYear: String(card_data.expiryYear).length === 2
                ? `20${card_data.expiryYear}` // Convert 24 -> 2024
                : String(card_data.expiryYear), // Keep 2024 as is
              ccv: String(card_data.ccv)
            };

            console.log('✅ FORMATTED CARD DATA for Asaas:', {
              holderName: formattedCardData.holderName,
              numberLength: formattedCardData.number.length,
              numberStart: formattedCardData.number.substring(0, 4),
              expiryMonth: formattedCardData.expiryMonth,
              expiryYear: formattedCardData.expiryYear,
              ccvLength: formattedCardData.ccv.length
            });

            paymentData.creditCard = formattedCardData;
            // 🔥 CRITICAL: Add client IP - REQUIRED by Asaas for credit card processing!
            paymentData.remoteIp = clientIp;
            console.log('💳 CREDIT CARD - Adding remoteIp:', clientIp);
          }

          // Create one-time payment (no more subscriptions for better approval)
          const singlePaymentData = {
            ...paymentData,
            dueDate: new Date().toISOString().split('T')[0] // Immediate payment
          };

          console.log('💳 CREATING ONE-TIME PAYMENT (Better approval rates):', {
            dueDate: singlePaymentData.dueDate,
            subscriptionType: subscription_type,
            paymentMethod: payment_method,
            value: singlePaymentData.value
          });

          asaasResult = await asaasService.createPayment(singlePaymentData);
          console.log('✅ ONE-TIME PAYMENT CREATED:', {
            paymentId: asaasResult.id,
            status: asaasResult.status,
            dueDate: asaasResult.dueDate,
            billingType: asaasResult.billingType,
            value: asaasResult.value,
            customer: asaasResult.customer,
            paymentMethod: payment_method
          });

          // 5. Create subscription/package record in database
          let dbResult;

          if (type === 'individual') {
            // Check for existing subscription first
            console.log('🔍 Checking for existing subscription:', {
              user_id: userId,
              assistant_id: assistant_id
            });

            const { data: existingSubscription, error: existingError } = await supabase
              .from('user_subscriptions')
              .select('*')
              .eq('user_id', userId)
              .eq('assistant_id', assistant_id)
              .single();

            if (existingError && existingError.code !== 'PGRST116') {
              // PGRST116 = no rows returned, which is fine
              console.error('❌ Error checking existing subscription:', existingError);
            }

            if (existingSubscription) {
              console.log('📋 Found existing subscription:', {
                id: existingSubscription.id,
                status: existingSubscription.status,
                asaas_subscription_id: existingSubscription.asaas_subscription_id
              });

              // If subscription exists and is pending/cancelled, we'll update it
              if (['pending', 'cancelled', 'expired'].includes(existingSubscription.status)) {
                console.log('🔄 Updating existing subscription instead of creating new');

                // Calculate expiration date (proper date handling for monthly, semester, annual)
                const expirationDate = new Date();
                if (subscription_type === 'monthly') {
                  expirationDate.setMonth(expirationDate.getMonth() + 1);
                } else if (subscription_type === 'semester') {
                  expirationDate.setMonth(expirationDate.getMonth() + 6);
                } else if (subscription_type === 'annual') {
                  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
                } else {
                  // Fallback to 30 days for unknown types
                  expirationDate.setDate(expirationDate.getDate() + 30);
                }

                const updateData = {
                  subscription_type: subscription_type,
                  amount: totalAmount,
                  status: 'pending', // All payments start as pending until webhook confirms
                  asaas_subscription_id: asaasResult.id, // Store payment_id in this field
                  expires_at: expirationDate.toISOString(),
                  updated_at: new Date().toISOString()
                };

                const { data: updatedSubscription, error: updateError } = await supabase
                  .from('user_subscriptions')
                  .update(updateData)
                  .eq('id', existingSubscription.id)
                  .select()
                  .single();

                if (updateError) {
                  console.error('❌ Error updating subscription:', updateError);
                  return res.status(500).json({
                    success: false,
                    error: `Erro ao atualizar assinatura: ${updateError.message}`
                  });
                }

                console.log('✅ Subscription updated successfully:', updatedSubscription.id);
                dbResult = updatedSubscription;

                // Log transaction for tracking (non-blocking)
                try {
                  await supabase.from('transactions').insert({
                    user_id: userId,
                    subscription_id: updatedSubscription.id,
                    amount: totalAmount,
                    payment_method: payment_method,
                    asaas_payment_id: asaasResult.id,
                    asaas_customer_id: asaasCustomer.id,
                    status: 'pending',
                    customer_data: customer_data,
                    payment_data: asaasResult,
                    created_at: new Date().toISOString()
                  });
                  console.log('✅ Transaction record created');
                } catch (transactionError) {
                  console.warn('⚠️ Failed to log transaction (non-critical):', transactionError.message);
                }
              } else {
                // Subscription is active - should not allow duplicate
                return res.status(409).json({
                  success: false,
                  error: 'Você já possui uma assinatura ativa para este assistente',
                  existing_subscription: {
                    id: existingSubscription.id,
                    status: existingSubscription.status,
                    expires_at: existingSubscription.expires_at
                  }
                });
              }
            } else {
              console.log('➕ No existing subscription found, creating new');

              // Calculate expiration date (proper date handling for monthly, semester, annual)
              const expirationDate = new Date();
              if (subscription_type === 'monthly') {
                expirationDate.setMonth(expirationDate.getMonth() + 1);
              } else if (subscription_type === 'semester') {
                expirationDate.setMonth(expirationDate.getMonth() + 6);
              } else if (subscription_type === 'annual') {
                expirationDate.setFullYear(expirationDate.getFullYear() + 1);
              } else {
                // Fallback to 30 days for unknown types
                expirationDate.setDate(expirationDate.getDate() + 30);
              }

              // Prepare subscription data with detailed logging
              const subscriptionData = {
                user_id: userId,
                assistant_id: assistant_id,
                subscription_type: subscription_type,
                package_type: 'individual',
                amount: totalAmount,
                status: 'pending', // All payments start as pending until webhook confirms
                asaas_subscription_id: asaasResult.id, // Store payment_id in this field
                expires_at: expirationDate.toISOString()
              };

            console.log('💾 Creating subscription in database:', {
              user_id: userId,
              assistant_id: assistant_id,
              subscription_type: subscription_type,
              package_type: 'individual',
              amount: totalAmount,
              status: subscriptionData.status,
              asaas_subscription_id: asaasResult.id,
              expires_at: subscriptionData.expires_at
            });

            // Validate required fields
            if (!userId || !assistant_id || !subscription_type || !asaasResult.id) {
              console.error('❌ Missing required fields for subscription:', {
                hasUserId: !!userId,
                hasAssistantId: !!assistant_id,
                hasSubscriptionType: !!subscription_type,
                hasAsaasId: !!asaasResult.id
              });
              return res.status(400).json({
                success: false,
                error: 'Dados obrigatórios faltando para criar assinatura'
              });
            }

            const { data: subscription, error: subscriptionError } = await supabase
              .from('user_subscriptions')
              .insert(subscriptionData)
              .select()
              .single();

            if (subscriptionError) {
              console.error('❌ Database error creating subscription:', {
                error: subscriptionError,
                code: subscriptionError.code,
                message: subscriptionError.message,
                details: subscriptionError.details,
                hint: subscriptionError.hint,
                data: subscriptionData
              });
              return res.status(500).json({
                success: false,
                error: `Erro ao criar assinatura no banco de dados: ${subscriptionError.message}`,
                debug: {
                  code: subscriptionError.code,
                  details: subscriptionError.details,
                  hint: subscriptionError.hint
                }
              });
            }

            console.log('✅ Subscription created successfully:', subscription.id);

            // Log transaction for tracking (non-blocking)
            try {
              await supabase.from('transactions').insert({
                user_id: userId,
                subscription_id: subscription.id,
                amount: totalAmount,
                payment_method: payment_method,
                asaas_payment_id: asaasResult.id,
                asaas_customer_id: asaasCustomer.id,
                status: 'pending',
                customer_data: customer_data,
                payment_data: asaasResult,
                created_at: new Date().toISOString()
              });
              console.log('✅ Transaction record created');
            } catch (transactionError) {
              console.warn('⚠️ Failed to log transaction (non-critical):', transactionError.message);
            }

            dbResult = subscription;
            }
          } else {
            // Calculate expiration date for package (proper date handling for monthly, semester, annual)
            const packageExpirationDate = new Date();
            if (subscription_type === 'monthly') {
              packageExpirationDate.setMonth(packageExpirationDate.getMonth() + 1);
            } else if (subscription_type === 'semester') {
              packageExpirationDate.setMonth(packageExpirationDate.getMonth() + 6);
            } else if (subscription_type === 'annual') {
              packageExpirationDate.setFullYear(packageExpirationDate.getFullYear() + 1);
            } else {
              // Fallback to 30 days for unknown types
              packageExpirationDate.setDate(packageExpirationDate.getDate() + 30);
            }

            // Create package
            const { data: userPackage, error: packageError } = await supabase
              .from('user_packages')
              .insert({
                user_id: userId,
                package_type: package_type,
                subscription_type: subscription_type,
                assistant_ids: selected_assistants,
                total_amount: totalAmount,
                status: 'pending', // All payments start as pending until webhook confirms
                asaas_subscription_id: asaasResult.id, // Store payment_id in this field
                expires_at: packageExpirationDate.toISOString()
              })
              .select()
              .single();

            if (packageError) {
              console.error('Database error creating package:', packageError);
              return res.status(500).json({
                success: false,
                error: 'Erro ao criar pacote no banco de dados'
              });
            }

            // Create individual subscriptions for each assistant in package
            const subscriptionsData = selected_assistants.map(assistantId => ({
              user_id: userId,
              assistant_id: assistantId,
              subscription_type: subscription_type,
              package_type: package_type,
              package_id: userPackage.id,
              amount: totalAmount / selected_assistants.length,
              status: 'pending', // All payments start as pending until webhook confirms
              asaas_subscription_id: asaasResult.id, // Store payment_id in this field
              expires_at: packageExpirationDate.toISOString() // Same expiration as package
            }));

            const { error: subscriptionsError } = await supabase
              .from('user_subscriptions')
              .insert(subscriptionsData);

            if (subscriptionsError) {
              console.error('Database error creating package subscriptions:', subscriptionsError);
            }

            // Log transaction for tracking (non-blocking)
            try {
              await supabase.from('transactions').insert({
                user_id: userId,
                package_id: userPackage.id,
                amount: totalAmount,
                payment_method: payment_method,
                asaas_payment_id: asaasResult.id,
                asaas_customer_id: asaasCustomer.id,
                status: 'pending',
                customer_data: customer_data,
                payment_data: asaasResult,
                created_at: new Date().toISOString()
              });
              console.log('✅ Transaction record created for package');
            } catch (transactionError) {
              console.warn('⚠️ Failed to log transaction (non-critical):', transactionError.message);
            }

            dbResult = userPackage;
          }

          // 6. Handle payment method specific responses
          let responseData = {
            payment_id: asaasResult.id,
            subscription_id: dbResult.id,
            status: asaasResult.status,
            amount: totalAmount,
            description,
            payment_method: payment_method
          };

          if (payment_method === 'PIX') {
            // 💳 ONE-TIME PAYMENT PIX: Use payment ID directly (much simpler!)
            const targetPaymentId = asaasResult.id;

            console.log('💳 ONE-TIME PAYMENT PIX: Using payment ID directly:', {
              paymentId: targetPaymentId,
              status: asaasResult.status,
              billingType: asaasResult.billingType
            });

            // Generate PIX QR Code with correct payment ID
            let pixData = null;
            let pixAttempts = 0;
            const maxPixAttempts = 3;
            const pixRetryDelay = 5000; // 5 seconds between PIX generation attempts
            const initialDelay = 2000; // 2 seconds initial delay

            // Add initial delay to let payment settle in Asaas system
            console.log(`⏳ Initial delay: Waiting ${initialDelay}ms for payment to settle in Asaas system...`);
            await new Promise(resolve => setTimeout(resolve, initialDelay));

            while (pixAttempts < maxPixAttempts && !pixData) {
              pixAttempts++;
              try {
                console.log(`🎯 Attempting PIX QR Code generation (attempt ${pixAttempts}/${maxPixAttempts}) for payment:`, targetPaymentId);

                // Add delay for subsequent attempts
                if (pixAttempts > 1) {
                  console.log(`⏳ Retry delay: Waiting ${pixRetryDelay}ms before retry...`);
                  await new Promise(resolve => setTimeout(resolve, pixRetryDelay));
                }

                pixData = await asaasService.generatePixQrCode(targetPaymentId);

                console.log('✅ PIX QR Code generated successfully:', {
                  hasEncodedImage: !!pixData.encodedImage,
                  hasPayload: !!pixData.payload,
                  hasExpiration: !!pixData.expirationDate,
                  attempt: pixAttempts
                });

                responseData.pix = {
                  qr_code: pixData.encodedImage,
                  copy_paste: pixData.payload,
                  expiration_date: pixData.expirationDate
                };

                break; // Success, exit retry loop

              } catch (pixError) {
                console.error(`❌ PIX generation attempt ${pixAttempts} failed:`, {
                  error: pixError.message,
                  targetPaymentId: targetPaymentId,
                  subscriptionId: isRecurring ? asaasResult.id : null,
                  willRetry: pixAttempts < maxPixAttempts
                });

                if (pixAttempts >= maxPixAttempts) {
                  // All attempts failed - continue without PIX for now
                  console.error('💥 All PIX generation attempts failed - continuing without QR Code');
                  console.log('⚠️ Fallback: Returning payment data without PIX for manual processing');

                  responseData.pix_fallback = {
                    message: 'PIX QR Code temporariamente indisponível',
                    payment_id: targetPaymentId,
                    subscription_id: null, // No more subscriptions
                    manual_instructions: 'Entre em contato com o suporte para gerar o PIX manualmente',
                    support_email: 'suporte@neuroialab.com',
                    error_details: pixError.message
                  };

                  // Continue with success but without QR code
                  console.log('✅ Payment created successfully (PIX fallback mode)');
                  break;
                }
              }
            }
          }

          // Log detailed response for debugging
          if (payment_method === 'CREDIT_CARD') {
            console.log('🎯 CREDIT CARD PAYMENT RESPONSE:', {
              success: true,
              payment_id: responseData.payment_id,
              subscription_id: responseData.subscription_id,
              status: responseData.status,
              amount: responseData.amount,
              payment_method: responseData.payment_method,
              asaasSubscriptionId: asaasResult.id,
              asaasStatus: asaasResult.status,
              message: 'Pagamento criado com sucesso'
            });
          }

          return res.status(201).json({
            success: true,
            data: responseData,
            message: 'Pagamento criado com sucesso'
          });

        } catch (error) {
          console.error('Payment creation error:', error);
          return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao processar pagamento'
          });
        }
      }
    }

    if (req.method === 'GET') {
      // GET /payment/status/:id - Get payment status
      if (pathParts[pathParts.length - 2] === 'status') {
        const asaasId = pathParts[pathParts.length - 1];

        try {
          console.log('🔍 Checking status for payment ID:', asaasId);

          // Since we now only use one-time payments, this is simpler
          const paymentData = await asaasService.getPayment(asaasId);

          console.log('✅ Payment status retrieved:', {
            paymentId: asaasId,
            status: paymentData.status,
            value: paymentData.value
          });

          if (!paymentData) {
            throw new Error('Payment data not found');
          }

          return res.json({
            success: true,
            data: {
              id: paymentData.id,
              status: paymentData.status,
              value: paymentData.value,
              due_date: paymentData.dueDate,
              payment_date: paymentData.paymentDate,
              description: paymentData.description,
              original_id: asaasId,
              id_type: 'payment' // Always payment now
            }
          });
        } catch (error) {
          console.error('Error fetching payment status:', {
            asaasId: asaasId,
            error: error.message,
            stack: error.stack
          });
          return res.status(500).json({
            success: false,
            error: 'Erro ao consultar status do pagamento',
            details: error.message
          });
        }
      }

      // GET /payment/methods - Get available payment methods
      if (pathParts[pathParts.length - 1] === 'methods') {
        const methods = asaasService.getAvailablePaymentMethods();

        return res.json({
          success: true,
          data: methods
        });
      }
    }

    return res.status(404).json({
      success: false,
      error: 'Rota não encontrada'
    });

  } catch (error) {
    console.error('Payment API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};