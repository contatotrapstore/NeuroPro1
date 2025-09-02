const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  console.log('🚀 Chat API v2.1 - Fixed OpenAI integration');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
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

      // Check user subscription
      const { data: subscriptions, error: subError } = await userClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('assistant_id', assistant_id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      if (subError || !subscriptions || subscriptions.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Você não possui acesso a este assistente. Faça uma assinatura para usar este assistente.'
        });
      }

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
      const { content } = req.body;

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

      // Check subscription access
      const { data: subscriptions, error: subError } = await userClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('assistant_id', conversation.assistant_id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      if (subError || !subscriptions || subscriptions.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Sua assinatura para este assistente expirou ou foi cancelada.'
        });
      }

      // Save user message
      const { data: userMessage, error: userMsgError } = await userClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content
        })
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
      
      console.log('🤖 OpenAI Configuration Check:', {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
        keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'none',
        hasAssistantId: !!conversation.assistants?.openai_assistant_id,
        assistantId: conversation.assistants?.openai_assistant_id || 'none',
        threadId: conversation.thread_id
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
          
          // Add message to thread
          console.log('📝 Adding message to thread...');
          await openai.beta.threads.messages.create(conversation.thread_id, {
            role: 'user',
            content: content
          });

          // Create run
          console.log('▶️ Creating run with assistant...');
          const run = await openai.beta.threads.runs.create(conversation.thread_id, {
            assistant_id: conversation.assistants.openai_assistant_id
          });
          
          console.log('✅ Run created:', { 
            runId: run.id, 
            status: run.status,
            hasRunId: !!run.id,
            runObject: Object.keys(run || {})
          });

          if (!run || !run.id) {
            console.error('❌ Invalid run object returned from OpenAI:', { 
              run,
              threadId: conversation.thread_id,
              assistantId: conversation.assistants.openai_assistant_id
            });
            throw new Error('Failed to create run - invalid response from OpenAI');
          }

          // Wait for completion (simplified)
          let runStatus = await openai.beta.threads.runs.retrieve(conversation.thread_id, run.id);
          let attempts = 0;
          
          console.log('⏳ Waiting for run completion...', { 
            initialStatus: runStatus.status,
            runId: run.id 
          });
          
          while (runStatus.status === 'running' && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(conversation.thread_id, run.id);
            attempts++;
            
            if (attempts % 5 === 0) {
              console.log(`⏳ Still waiting... attempt ${attempts}, status: ${runStatus.status}`);
            }
          }

          if (runStatus.status === 'completed') {
            // Get messages
            const messages = await openai.beta.threads.messages.list(conversation.thread_id);
            const assistantMessage = messages.data.find(msg => msg.role === 'assistant' && msg.run_id === run.id);
            
            if (assistantMessage && assistantMessage.content[0]?.text?.value) {
              const assistantContent = assistantMessage.content[0].text.value;
              
              // Save assistant reply
              const { data: reply, error: replyError } = await userClient
                .from('messages')
                .insert({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: assistantContent
                })
                .select()
                .single();

              if (!replyError) {
                assistantReply = reply;
              }
            }
          }
        } catch (openaiError) {
          console.error('🤖 OpenAI Error Details:', {
            message: openaiError.message,
            status: openaiError.status,
            code: openaiError.code,
            type: openaiError.type,
            conversationId,
            assistantId: conversation.assistants?.openai_assistant_id,
            hasAPIKey: !!process.env.OPENAI_API_KEY,
            apiKeyLength: process.env.OPENAI_API_KEY?.length
          });
          // Continue without AI response
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