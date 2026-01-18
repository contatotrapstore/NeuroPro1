const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  console.log('🚀 Chat API v2.5 - FIXED PARAMETERS - Compatible with OpenAI Assistants API - Build: ' + Date.now());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Deploy timestamp:', new Date().toISOString());
  console.log('Fix: Removed invalid params (temperature, max_tokens, top_p), using max_completion_tokens');
  
  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ Chat preflight handled');
    return res.status(200).end();
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Extract user token for authentication
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Get user from token
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    const userId = user.id;

    // Route handling based on URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    console.log('Path parts:', pathParts);

    // Handle different chat endpoints
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'conversations') {
      // GET /chat/conversations - List conversations
      const { data: conversations, error } = await userClient
        .from('conversations')
        .select(`
          *,
          assistants (
            name,
            icon,
            color_theme
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar conversas',
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: conversations,
        message: 'Conversas recuperadas com sucesso'
      });
    }

    else if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'conversations') {
      // POST /chat/conversations - Create conversation
      const { assistant_id, title } = req.body;

      // Validate assistant exists and user has access
      const { data: assistant, error: assistantError } = await supabase
        .from('assistants')
        .select('id, name')
        .eq('id', assistant_id)
        .eq('is_active', true)
        .single();

      if (assistantError || !assistant) {
        return res.status(404).json({
          success: false,
          message: 'Assistente não encontrado'
        });
      }

      // Check user subscription with detailed expiration info
      const { data: subscriptions, error: subError } = await userClient
        .from('user_subscriptions')
        .select('*, assistants(name)')
        .eq('user_id', userId)
        .eq('assistant_id', assistant_id)
        .eq('status', 'active');

      if (subError) {
        console.error('Error checking subscription:', subError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao verificar assinatura.'
        });
      }

      // Check package subscription if no individual subscription found
      let hasAccess = subscriptions && subscriptions.length > 0;
      let accessType = 'individual_subscription';
      let expiresAt = null;
      let assistantName = null;

      if (hasAccess) {
        // Use individual subscription data
        const subscription = subscriptions[0];
        expiresAt = new Date(subscription.expires_at);
        assistantName = subscription.assistants?.name;
      } else {
        // Check if assistant is in user's package
        const { data: userPackages, error: pkgError } = await userClient
          .from('user_packages')
          .select('assistant_ids, status, expires_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString());

        if (!pkgError && userPackages) {
          const matchingPackage = userPackages.find(pkg =>
            pkg.assistant_ids && pkg.assistant_ids.includes(assistant_id)
          );
          if (matchingPackage) {
            hasAccess = true;
            accessType = 'package_subscription';
            expiresAt = new Date(matchingPackage.expires_at);
          }
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Você não possui assinatura ativa para este assistente.',
          error_code: 'NO_SUBSCRIPTION',
          action_required: 'subscribe',
          assistant_id: assistant_id
        });
      }

      // Check if subscription/package expired
      const now = new Date();
      if (expiresAt && expiresAt < now) {
        const daysExpired = Math.ceil((now - expiresAt) / (1000 * 60 * 60 * 24));

        return res.status(403).json({
          success: false,
          message: `Sua assinatura ${assistantName ? `do ${assistantName}` : ''} expirou há ${daysExpired} ${daysExpired === 1 ? 'dia' : 'dias'}. Renove para continuar usando.`,
          error_code: 'SUBSCRIPTION_EXPIRED',
          expired_at: expiresAt.toISOString(),
          days_expired: daysExpired,
          action_required: 'renew',
          assistant_id: assistant_id
        });
      }

      console.log(`✅ Creating conversation - access via ${accessType}${assistantName ? ` for ${assistantName}` : ''}`);

      // Initialize OpenAI if API key is available
      let threadId = 'mock-thread-' + Date.now(); // fallback
      
      if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const thread = await openai.beta.threads.create();
          threadId = thread.id;
        } catch (openaiError) {
          console.warn('OpenAI thread creation failed, using fallback:', openaiError.message);
        }
      }

      // Create conversation
      const { data: conversation, error } = await userClient
        .from('conversations')
        .insert({
          user_id: userId,
          assistant_id,
          title: title || `Chat com ${assistant.name}`,
          thread_id: threadId
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar conversa',
          error: error.message
        });
      }

      return res.status(201).json({
        success: true,
        data: conversation,
        message: 'Conversa criada com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 4 && pathParts[1] === 'conversations' && pathParts[3] === 'messages') {
      // GET /chat/conversations/:id/messages - Get messages
      const conversationId = pathParts[2];

      // Verify conversation ownership
      const { data: conversation, error: convError } = await userClient
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversa não encontrada'
        });
      }

      // Get messages
      const { data: messages, error } = await userClient
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar mensagens',
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: messages,
        message: 'Mensagens recuperadas com sucesso'
      });
    }

    else if (req.method === 'POST' && pathParts.length === 4 && pathParts[1] === 'conversations' && pathParts[3] === 'messages') {
      // POST /chat/conversations/:id/messages - Send message
      const conversationId = pathParts[2];
      const { content, attachments } = req.body;

      // Log attachments if present
      if (attachments && attachments.length > 0) {
        console.log('📎 Message has attachments:', attachments.length);
      }

      // Verify conversation and get assistant info
      const { data: conversation, error: convError } = await userClient
        .from('conversations')
        .select('*, assistants(id, name, openai_assistant_id)')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversa não encontrada'
        });
      }

      // Check subscription access with detailed expiration info
      const { data: subscriptions, error: subError } = await userClient
        .from('user_subscriptions')
        .select('*, assistants(name)')
        .eq('user_id', userId)
        .eq('assistant_id', conversation.assistant_id)
        .eq('status', 'active');

      if (subError) {
        console.error('Error checking subscription:', subError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao verificar assinatura.'
        });
      }

      // Check package subscription if no individual subscription found
      let hasAccess = subscriptions && subscriptions.length > 0;
      let accessType = 'individual_subscription';
      let expiresAt = null;
      let assistantName = null;

      if (hasAccess) {
        // Use individual subscription data
        const subscription = subscriptions[0];
        expiresAt = new Date(subscription.expires_at);
        assistantName = subscription.assistants?.name;
      } else {
        // Check if assistant is in user's package
        const { data: userPackages, error: pkgError } = await userClient
          .from('user_packages')
          .select('assistant_ids, status, expires_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString());

        if (!pkgError && userPackages) {
          const matchingPackage = userPackages.find(pkg =>
            pkg.assistant_ids && pkg.assistant_ids.includes(conversation.assistant_id)
          );
          if (matchingPackage) {
            hasAccess = true;
            accessType = 'package_subscription';
            expiresAt = new Date(matchingPackage.expires_at);
          }
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Você não possui assinatura ativa para este assistente.',
          error_code: 'NO_SUBSCRIPTION',
          action_required: 'subscribe'
        });
      }

      // Check if subscription/package expired
      const now = new Date();
      if (expiresAt && expiresAt < now) {
        const daysExpired = Math.ceil((now - expiresAt) / (1000 * 60 * 60 * 24));

        return res.status(403).json({
          success: false,
          message: `Sua assinatura ${assistantName ? `do ${assistantName}` : ''} expirou há ${daysExpired} ${daysExpired === 1 ? 'dia' : 'dias'}. Renove para continuar usando.`,
          error_code: 'SUBSCRIPTION_EXPIRED',
          expired_at: expiresAt.toISOString(),
          days_expired: daysExpired,
          action_required: 'renew',
          assistant_id: conversation.assistant_id
        });
      }

      // Calculate days remaining for info
      const daysRemaining = expiresAt ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0;
      console.log(`✅ Access via ${accessType}${assistantName ? ` for ${assistantName}` : ''}: ${daysRemaining} days remaining`);

      // Add warning if less than 3 days remaining
      if (daysRemaining <= 3 && daysRemaining > 0) {
        console.log(`⚠️ Subscription expiring soon: ${daysRemaining} days remaining`);
      }

      // Save user message (with attachments if present)
      const messageData = {
        conversation_id: conversationId,
        role: 'user',
        content
      };

      // Add attachments if present
      if (attachments && attachments.length > 0) {
        messageData.attachments = attachments;
      }

      const { data: userMessage, error: userMsgError } = await userClient
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (userMsgError) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao salvar mensagem',
          error: userMsgError.message
        });
      }

      // Try to get AI response if OpenAI is configured
      let assistantReply = null;
      
      // OpenAI configuration validation
      console.log('🤖 OpenAI Check:', {
        hasKey: !!process.env.OPENAI_API_KEY,
        hasAssistant: !!conversation.assistants?.openai_assistant_id,
        threadId: conversation.thread_id
      });

      // DEBUG: Verificar acesso à OPENAI_API_KEY no chat.js
      console.log('🔑 CHAT.JS OPENAI DEBUG:', {
        has_key: !!process.env.OPENAI_API_KEY,
        key_length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
        key_starts_with: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) + '...' : 'N/A',
        all_openai_keys: Object.keys(process.env).filter(key => key.toLowerCase().includes('openai')),
        function_name: 'chat.js'
      });

      // Validate OpenAI configuration before proceeding
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder')) {
        console.log('⚠️ OpenAI API key not configured, skipping AI response');
      } else if (!conversation.assistants?.openai_assistant_id) {
        console.error('❌ No OpenAI assistant ID found for assistant:', conversation.assistant_id);
      } else {
        try {
          console.log('🚀 Initiating OpenAI request...');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          
          // Check if thread_id is valid, create new one if needed
          let workingThreadId = conversation.thread_id;
          if (!workingThreadId || workingThreadId === 'undefined' || workingThreadId.startsWith('mock-thread-')) {
            console.log('🔧 Creating new OpenAI thread (invalid thread_id)...');
            const newThread = await openai.beta.threads.create();
            workingThreadId = newThread.id;
            
            // Update conversation with new thread_id
            await userClient
              .from('conversations')
              .update({ thread_id: workingThreadId })
              .eq('id', conversationId);
            
            console.log('✅ New thread created:', workingThreadId);
          }
          
          // Add message to thread (with attachments if present)
          console.log('📝 Adding message to thread:', workingThreadId);

          const messageParams = {
            role: 'user',
            content: content
          };

          // Add file attachments for OpenAI file_search
          if (attachments && attachments.length > 0) {
            const openaiAttachments = attachments
              .filter(a => a.openai_file_id)
              .map(a => ({
                file_id: a.openai_file_id,
                tools: [{ type: 'file_search' }]
              }));

            if (openaiAttachments.length > 0) {
              messageParams.attachments = openaiAttachments;
              console.log('📎 Adding', openaiAttachments.length, 'file attachments to OpenAI message');
            }
          }

          await openai.beta.threads.messages.create(workingThreadId, messageParams);

          // Create run (fixed parameters for Assistants API)
          console.log('▶️ Creating run with assistant...');
          const run = await openai.beta.threads.runs.create(workingThreadId, {
            assistant_id: conversation.assistants.openai_assistant_id,
            max_completion_tokens: 3000,
            metadata: {
              conversation_id: conversationId,
              user_id: userId,
              timestamp: new Date().toISOString()
            }
          });
          
          console.log('✅ Run created:', { 
            runId: run.id, 
            status: run.status
          });

          if (!run || !run.id) {
            console.error('❌ Invalid run object returned from OpenAI:', { 
              run,
              threadId: workingThreadId,
              assistantId: conversation.assistants.openai_assistant_id
            });
            throw new Error('Failed to create run - invalid response from OpenAI');
          }

          // Wait for completion (optimized timeout and polling)
          let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: workingThreadId });
          let attempts = 0;
          const maxAttempts = 60; // Reduced to 60 seconds for faster failures
          
          console.log('⏳ Waiting for run completion...', { 
            initialStatus: runStatus.status,
            runId: run.id,
            maxAttempts: maxAttempts
          });
          
          const startTime = Date.now();
          const maxTimeMs = 60000; // 60 seconds maximum wait time
          
          // Status que indicam que o run ainda está processando
          const processingStatuses = ['queued', 'in_progress', 'running'];
          // Status que indicam conclusão (sucesso ou falha)
          const finalStatuses = ['completed', 'failed', 'cancelled', 'expired', 'requires_action'];
          
          // Early exit if already completed
          if (finalStatuses.includes(runStatus.status)) {
            console.log('✅ Run already completed on first check:', runStatus.status);
          } else {
            while (processingStatuses.includes(runStatus.status) && attempts < maxAttempts && (Date.now() - startTime) < maxTimeMs) {
              // Progressive backoff: 300ms, 500ms, 750ms, 1000ms (max)
              const delayMs = Math.min(300 + (attempts * 100), 1000);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              
              try {
                // Fix: Use correct syntax for OpenAI v5 API - runId first, threadId in options
                runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: workingThreadId });
                attempts++;
                
                // Early exit on completion
                if (finalStatuses.includes(runStatus.status)) {
                  console.log(`🎯 Run completed early at attempt ${attempts}: ${runStatus.status}`);
                  break;
                }
                
                if (attempts % 10 === 0 || attempts === 1) {
                  console.log(`⏳ Still waiting... attempt ${attempts}/${maxAttempts}, status: ${runStatus.status}, elapsed: ${Math.round((Date.now() - startTime) / 1000)}s, next delay: ${Math.min(300 + (attempts * 100), 1000)}ms`);
                }
              } catch (retrieveError) {
                console.error('❌ Error retrieving run status:', retrieveError);
                attempts++;
                
                // If we can't retrieve status, wait a bit longer and try again
                if (attempts >= maxAttempts) {
                  throw new Error('Failed to retrieve run status after multiple attempts');
                }
              }
            }
          }
          
          console.log('🏁 Run completion loop finished:', {
            finalStatus: runStatus.status,
            totalAttempts: attempts,
            wasTimeout: attempts >= maxAttempts,
            elapsedTime: Math.round((Date.now() - startTime) / 1000) + 's',
            lastError: runStatus.last_error || null
          });

          if (runStatus.status === 'completed') {
            console.log('✅ Run completed successfully, retrieving messages');
            
            // Get messages
            try {
              const messages = await openai.beta.threads.messages.list(workingThreadId);
              console.log('📜 Messages retrieved:', {
                totalMessages: messages.data.length,
                messageTypes: messages.data.map(msg => ({ role: msg.role, runId: msg.run_id }))
              });
              
              const assistantMessage = messages.data.find(msg => msg.role === 'assistant' && msg.run_id === run.id);
              
              if (assistantMessage && assistantMessage.content[0]?.text?.value) {
                const assistantContent = assistantMessage.content[0].text.value;
                console.log('💬 Assistant response found:', {
                  messageId: assistantMessage.id,
                  contentLength: assistantContent.length,
                  contentPreview: assistantContent.substring(0, 200) + '...'
                });

                // Check for file annotations (files generated by code_interpreter)
                const annotations = assistantMessage.content[0].text.annotations || [];
                const fileAnnotations = annotations.filter(a => a.type === 'file_path');
                let generatedFiles = [];

                if (fileAnnotations.length > 0) {
                  console.log('📄 Found', fileAnnotations.length, 'generated files in response');

                  // Save file references to database
                  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

                  for (const annotation of fileAnnotations) {
                    try {
                      // Get file info from OpenAI
                      const fileInfo = await openai.files.retrieve(annotation.file_path.file_id);

                      const { data: fileRecord, error: fileError } = await serviceClient
                        .from('chat_files')
                        .insert({
                          user_id: userId,
                          conversation_id: conversationId,
                          file_name: fileInfo.filename || 'generated-file',
                          file_type: 'application/octet-stream',
                          file_size: fileInfo.bytes || 0,
                          openai_file_id: annotation.file_path.file_id,
                          direction: 'download',
                          status: 'ready'
                        })
                        .select()
                        .single();

                      if (!fileError && fileRecord) {
                        generatedFiles.push({
                          file_id: fileRecord.id,
                          file_name: fileInfo.filename || 'generated-file',
                          openai_file_id: annotation.file_path.file_id,
                          direction: 'download'
                        });
                        console.log('✅ Generated file saved:', fileRecord.id);
                      }
                    } catch (fileErr) {
                      console.error('⚠️ Error saving generated file reference:', fileErr.message);
                    }
                  }
                }

                // Build message data with optional attachments
                const replyData = {
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: assistantContent
                };

                if (generatedFiles.length > 0) {
                  replyData.attachments = generatedFiles;
                }

                // Save assistant reply
                const { data: reply, error: replyError } = await userClient
                  .from('messages')
                  .insert(replyData)
                  .select()
                  .single();

                if (!replyError) {
                  assistantReply = reply;
                  console.log('✅ Assistant reply saved to database', generatedFiles.length > 0 ? `with ${generatedFiles.length} files` : '');
                } else {
                  console.error('❌ Error saving assistant reply:', replyError);
                }
              } else {
                console.error('❌ No assistant message found or empty content');
              }
            } catch (messagesError) {
              console.error('❌ Error retrieving messages:', messagesError);
              throw messagesError;
            }
          } else {
            const errorInfo = {
              status: runStatus.status,
              lastError: runStatus.last_error,
              elapsedTime: Math.round((Date.now() - startTime) / 1000) + 's',
              attempts: attempts
            };
            
            console.error('⚠️ Run did not complete successfully:', errorInfo);
            
            // If run failed, throw specific error with details
            if (runStatus.status === 'failed') {
              throw new Error(`OpenAI run failed: ${JSON.stringify(runStatus.last_error || 'Unknown error')}`);
            } else {
              throw new Error(`OpenAI run timed out or stuck in status: ${runStatus.status} after ${Math.round((Date.now() - startTime) / 1000)}s`);
            }
          }
        } catch (openaiError) {
          // Enhanced error logging with categorization
          const errorCategory = openaiError.code || openaiError.type || 'UNKNOWN';
          const isAuthError = ['invalid_api_key', 'insufficient_quota', 'authentication_error'].includes(errorCategory);
          const isRateLimitError = errorCategory === 'rate_limit_exceeded';
          const isTimeoutError = openaiError.message?.includes('timeout') || openaiError.message?.includes('timed out');
          const isAssistantError = errorCategory === 'invalid_request_error' && openaiError.message?.includes('assistant');

          console.error('🤖 OpenAI Error Details:', {
            message: openaiError.message,
            status: openaiError.status,
            code: openaiError.code,
            type: openaiError.type,
            category: errorCategory,
            isAuthError,
            isRateLimitError,
            isTimeoutError,
            isAssistantError,
            conversationId,
            assistantId: conversation.assistants?.openai_assistant_id,
            assistantName: conversation.assistants?.name,
            hasAPIKey: !!process.env.OPENAI_API_KEY,
            apiKeyLength: process.env.OPENAI_API_KEY?.length,
            apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 8) + '...' : 'NOT_SET',
            timestamp: new Date().toISOString(),
            userId,
            stack: openaiError.stack,
            debugStep: 'OPENAI_ERROR_CAUGHT'
          });

          // Log to database for admin monitoring (non-blocking)
          try {
            await supabase
              .from('error_logs')
              .insert({
                service: 'openai',
                error_type: errorCategory,
                error_message: openaiError.message,
                user_id: userId,
                conversation_id: conversationId,
                assistant_id: conversation.assistant_id,
                metadata: {
                  code: openaiError.code,
                  status: openaiError.status,
                  type: openaiError.type,
                  isAuthError,
                  isRateLimitError,
                  isTimeoutError,
                  isAssistantError
                }
              });
          } catch (logError) {
            console.warn('⚠️ Failed to log error to database:', logError.message);
          }

          // Create context-aware fallback response
          let fallbackContent = `Desculpe, não consegui processar sua mensagem no momento. O assistente está temporariamente indisponível. Tente novamente em alguns instantes.`;

          // Provide more specific feedback based on error type (for admins, log it)
          if (isAuthError) {
            console.error('🚨 CRITICAL: OpenAI Authentication Error - Check API Key configuration!');
            fallbackContent = `Desculpe, estamos com problemas técnicos no momento. Nossa equipe foi notificada e está trabalhando na solução.`;
          } else if (isRateLimitError) {
            console.warn('⚠️ Rate limit exceeded - too many requests');
            fallbackContent = `O sistema está com alta demanda no momento. Por favor, aguarde alguns segundos e tente novamente.`;
          } else if (isTimeoutError) {
            console.warn('⏱️ Request timeout - OpenAI took too long to respond');
            fallbackContent = `O processamento está demorando mais que o esperado. Por favor, tente novamente.`;
          } else if (isAssistantError) {
            console.error('🚨 CRITICAL: Assistant configuration error - Invalid assistant_id:', conversation.assistants?.openai_assistant_id);
            fallbackContent = `Desculpe, há um problema com a configuração deste assistente. Nossa equipe foi notificada.`;
          }
          
          const { data: fallbackReply, error: fallbackError } = await userClient
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fallbackContent
            })
            .select()
            .single();

          if (!fallbackError) {
            assistantReply = fallbackReply;
          }
        }
      }

      // Update conversation timestamp
      await userClient
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return res.json({
        success: true,
        data: {
          userMessage,
          assistantMessage: assistantReply
        },
        message: assistantReply ? 'Mensagem enviada e resposta recebida' : 'Mensagem enviada'
      });
    }

    else if (req.method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'conversations') {
      // DELETE /chat/conversations/:id - Delete conversation
      const conversationId = pathParts[2];

      // Delete messages first
      await userClient
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      const { error } = await userClient
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao deletar conversa',
          error: error.message
        });
      }

      return res.json({
        success: true,
        message: 'Conversa deletada com sucesso'
      });
    }

    else {
      return res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado'
      });
    }

  } catch (error) {
    console.error('💥 Chat function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};