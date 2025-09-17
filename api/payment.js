/**
 * Payment API - NeuroIA Lab
 * Handles payment processing with Asaas integration
 */

const { createClient } = require('@supabase/supabase-js');
const AsaasService = require('./services/asaas.service');
const { applyCors } = require('./utils/cors');

module.exports = async function handler(req, res) {
  console.log('🚀 Payment API v1.0 - Processing request');

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) {
    return; // Preflight request handled
  }

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

    // Decode JWT to get user ID
    let userId;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;

      if (payload.exp && payload.exp < Date.now() / 1000) {
        return res.status(401).json({
          success: false,
          error: 'Token expirado'
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

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

        if (type === 'package' && (!package_type || !selected_assistants?.length)) {
          return res.status(400).json({
            success: false,
            error: 'Tipo e assistentes do pacote são obrigatórios'
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
              .select('name, monthly_price, semester_price')
              .eq('id', assistant_id)
              .single();

            if (assistantError || !assistant) {
              return res.status(404).json({
                success: false,
                error: 'Assistente não encontrado'
              });
            }

            totalAmount = subscription_type === 'monthly'
              ? assistant.monthly_price
              : assistant.semester_price;

            description = `Assinatura ${subscription_type === 'monthly' ? 'Mensal' : 'Semestral'} - ${assistant.name}`;
          } else {
            // Package pricing
            const packagePricing = {
              package_3: {
                monthly: 99.90,
                semester: 499.90
              },
              package_6: {
                monthly: 179.90,
                semester: 899.90
              }
            };

            totalAmount = packagePricing[package_type][subscription_type];
            description = `Pacote ${package_type === 'package_3' ? '3' : '6'} Assistentes - ${subscription_type === 'monthly' ? 'Mensal' : 'Semestral'}`;
          }

          // 4. Create payment or subscription in Asaas
          let asaasResult;
          const isRecurring = true; // Always create subscription for recurring billing

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
            paymentData.creditCard = card_data;
          }

          if (isRecurring) {
            // Create subscription for recurring payments
            const subscriptionData = {
              ...paymentData,
              cycle: asaasService.mapSubscriptionCycle(subscription_type),
              nextDueDate: asaasService.calculateNextDueDate(subscription_type)
            };

            asaasResult = await asaasService.createSubscription(subscriptionData);
            console.log('Asaas subscription created:', asaasResult.id);
          } else {
            // Create one-time payment
            asaasResult = await asaasService.createPayment(paymentData);
            console.log('Asaas payment created:', asaasResult.id);
          }

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

                const updateData = {
                  subscription_type: subscription_type,
                  amount: totalAmount,
                  status: payment_method === 'CREDIT_CARD' ? 'active' : 'pending',
                  asaas_subscription_id: asaasResult.id,
                  expires_at: asaasService.calculateNextDueDate(subscription_type),
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

              // Prepare subscription data with detailed logging
              const subscriptionData = {
                user_id: userId,
                assistant_id: assistant_id,
                subscription_type: subscription_type,
                package_type: 'individual',
                amount: totalAmount,
                status: payment_method === 'CREDIT_CARD' ? 'active' : 'pending',
                asaas_subscription_id: asaasResult.id,
                expires_at: asaasService.calculateNextDueDate(subscription_type)
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

            dbResult = subscription;
              }
            }
          } else {
            // Create package
            const { data: userPackage, error: packageError } = await supabase
              .from('user_packages')
              .insert({
                user_id: userId,
                package_type: package_type,
                subscription_type: subscription_type,
                assistant_ids: selected_assistants,
                total_amount: totalAmount,
                status: payment_method === 'CREDIT_CARD' ? 'active' : 'pending',
                asaas_subscription_id: asaasResult.id,
                expires_at: asaasService.calculateNextDueDate(subscription_type)
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
              status: payment_method === 'CREDIT_CARD' ? 'active' : 'pending',
              asaas_subscription_id: asaasResult.id,
              expires_at: asaasService.calculateNextDueDate(subscription_type)
            }));

            const { error: subscriptionsError } = await supabase
              .from('user_subscriptions')
              .insert(subscriptionsData);

            if (subscriptionsError) {
              console.error('Database error creating package subscriptions:', subscriptionsError);
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
            // Generate PIX QR Code with retry logic
            let pixData = null;
            let pixAttempts = 0;
            const maxPixAttempts = 3;
            const pixRetryDelay = 2000; // 2 seconds

            while (pixAttempts < maxPixAttempts && !pixData) {
              pixAttempts++;
              try {
                console.log(`🎯 Attempting PIX QR Code generation (attempt ${pixAttempts}/${maxPixAttempts}) for payment:`, asaasResult.id);

                // Add delay for subsequent attempts
                if (pixAttempts > 1) {
                  console.log(`⏳ Waiting ${pixRetryDelay}ms before retry...`);
                  await new Promise(resolve => setTimeout(resolve, pixRetryDelay));
                }

                pixData = await asaasService.generatePixQrCode(asaasResult.id);

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
                  paymentId: asaasResult.id,
                  willRetry: pixAttempts < maxPixAttempts
                });

                if (pixAttempts >= maxPixAttempts) {
                  // All attempts failed
                  console.error('💥 All PIX generation attempts failed');
                  return res.status(500).json({
                    success: false,
                    error: `Erro ao gerar PIX após ${maxPixAttempts} tentativas: ${pixError.message}`,
                    debug: {
                      paymentId: asaasResult.id,
                      attempts: pixAttempts,
                      lastError: pixError.message,
                      suggestion: 'Verifique se a conta Asaas tem PIX habilitado e se o pagamento foi criado corretamente'
                    }
                  });
                }
              }
            }
          } else if (payment_method === 'BOLETO') {
            responseData.boleto = {
              barcode: asaasResult.bankSlipUrl,
              pdf_url: asaasResult.bankSlipUrl,
              due_date: asaasResult.dueDate
            };
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
        const paymentId = pathParts[pathParts.length - 1];

        try {
          const asaasPayment = await asaasService.getPayment(paymentId);

          return res.json({
            success: true,
            data: {
              id: asaasPayment.id,
              status: asaasPayment.status,
              value: asaasPayment.value,
              due_date: asaasPayment.dueDate,
              payment_date: asaasPayment.paymentDate,
              description: asaasPayment.description
            }
          });
        } catch (error) {
          console.error('Error fetching payment status:', error);
          return res.status(500).json({
            success: false,
            error: 'Erro ao consultar status do pagamento'
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