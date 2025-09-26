const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  console.log('🎓 Institution Chat API - OpenAI Integration - Build 2025-09-26T19:58:30Z:', Date.now());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

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
    console.log('✅ Institution Chat preflight handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Use POST.'
    });
  }

  try {
    // Initialize services
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;


    // Validate only essential Supabase variables early
    if (!supabaseUrl || !supabaseAnonKey) {
      const missing = [];
      if (!supabaseUrl) missing.push('SUPABASE_URL');
      if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');

      console.error('❌ Missing essential environment variables:', missing.join(', '));

      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta. Variáveis faltando: ' + missing.join(', ')
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
    // OpenAI will be initialized later when needed (lazy loading)

    // Extract and validate authentication
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

    // Parse request body
    const {
      assistant_id,
      message,
      thread_id,
      institution_slug,
      session_id
    } = req.body;

    if (!assistant_id || !message || !institution_slug) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: assistant_id, message, institution_slug'
      });
    }

    console.log('🎓 Institution chat request:', {
      assistant_id,
      institution_slug,
      has_thread_id: !!thread_id,
      session_id,
      user_id: user.id
    });

    // Verify user has access to this institution and is active
    console.log('🔍 Verifying institution access for:', {
      user_id: user.id,
      institution_slug,
      user_email: user.email
    });

    const { data: accessData, error: accessError } = await userClient
      .rpc('verify_institution_access', {
        p_institution_slug: institution_slug
      });

    console.log('🔍 Institution access verification result:', {
      success: accessData?.success,
      has_data: !!accessData?.data,
      error: accessError,
      raw_response: JSON.stringify(accessData, null, 2)
    });

    // Debug RPC result in detail
    if (accessData?.data?.available_assistants) {
      console.log('🎯 Available assistants from RPC:', {
        count: accessData.data.available_assistants.length,
        assistants: accessData.data.available_assistants.map(a => ({
          id: a.id,
          name: a.name,
          openai_assistant_id: a.openai_assistant_id,
          assistant_id: a.assistant_id, // FK to assistants table
          is_simulator: a.is_simulator,
          is_primary: a.is_primary
        }))
      });
    } else {
      console.log('❌ No available_assistants in RPC response');
    }

    if (accessError || !accessData?.success) {
      console.error('❌ Institution access verification failed:', {
        error: accessError,
        data: accessData,
        institution_slug,
        user_id: user.id
      });
      return res.status(403).json({
        success: false,
        error: 'Acesso negado à instituição'
      });
    }

    const userAccess = accessData.data?.user_access;
    if (!userAccess?.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Usuário não aprovado pela instituição'
      });
    }

    // Check subscription for regular users (admins/subadmins bypass)
    if (userAccess.role !== 'subadmin' && !userAccess.is_admin) {
      const { data: subResponse, error: subError } = await userClient
        .rpc('get_institution_subscription_status', {
          p_institution_slug: institution_slug
        });

      if (subError || !subResponse?.has_subscription) {
        console.log('❌ User does not have active subscription');
        return res.status(402).json({
          success: false,
          error: 'Assinatura ativa necessária para usar os assistentes'
        });
      }
    }

    // Find the assistant in available assistants for this institution
    const availableAssistants = accessData.data?.available_assistants || [];

    console.log('🔍 Assistant search details:', {
      requested_assistant_id: assistant_id,
      total_available_assistants: availableAssistants.length,
      available_assistants: availableAssistants.map(a => ({
        id: a.id,
        name: a.name,
        openai_assistant_id: a.openai_assistant_id,
        is_simulator: a.is_simulator
      }))
    });

    console.log('🎯 Frontend sent assistant_id:', assistant_id);
    console.log('🎯 Looking for match in field: openai_assistant_id');

    const targetAssistant = availableAssistants.find(a => a.openai_assistant_id === assistant_id);

    console.log('🔍 Assistant search result:', {
      found: !!targetAssistant,
      target_assistant: targetAssistant ? {
        id: targetAssistant.id,
        name: targetAssistant.name,
        openai_assistant_id: targetAssistant.openai_assistant_id,
        is_simulator: targetAssistant.is_simulator
      } : null,
      comparison_details: availableAssistants.map(a => ({
        id: a.id,
        openai_assistant_id: a.openai_assistant_id,
        matches_requested: a.openai_assistant_id === assistant_id
      }))
    });

    if (!targetAssistant) {
      console.error('❌ Assistant not available for this institution:', {
        requested_assistant_id: assistant_id,
        institution_slug,
        available_assistant_ids: availableAssistants.map(a => a.openai_assistant_id),
        available_assistant_names: availableAssistants.map(a => a.name)
      });
      return res.status(404).json({
        success: false,
        error: 'Assistente não disponível para esta instituição'
      });
    }

    console.log('✅ Using assistant:', {
      name: targetAssistant.name,
      openai_id: targetAssistant.openai_assistant_id,
      is_simulator: targetAssistant.is_simulator
    });

    // Validate OpenAI configuration before using
    console.log('🔑 OpenAI API Key validation:', {
      has_key: !!process.env.OPENAI_API_KEY,
      key_length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      key_starts_with: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'N/A'
    });

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured - cannot provide AI responses');
      return res.status(500).json({
        success: false,
        error: 'Serviço de IA temporariamente indisponível. Entre em contato com o suporte.',
        error_type: 'OPENAI_CONFIG_MISSING'
      });
    }

    // Initialize OpenAI client (lazy loading)
    console.log('🤖 Initializing OpenAI client...');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Handle OpenAI thread
    let currentThreadId = thread_id;

    try {
      if (!currentThreadId) {
        // Create new thread
        console.log('🆕 Creating new OpenAI thread...');
        const thread = await openai.beta.threads.create();
        currentThreadId = thread.id;
        console.log('✅ New thread created:', currentThreadId);
      } else {
        // Verify existing thread exists
        try {
          await openai.beta.threads.retrieve(currentThreadId);
          console.log('✅ Using existing thread:', currentThreadId);
        } catch (threadError) {
          console.log('⚠️ Thread not found, creating new one...');
          const thread = await openai.beta.threads.create();
          currentThreadId = thread.id;
        }
      }

      // Add user message to thread
      console.log('💬 Adding message to thread...');
      await openai.beta.threads.messages.create(currentThreadId, {
        role: 'user',
        content: message
      });

      // Create and run assistant
      console.log('🤖 Running assistant...');
      const run = await openai.beta.threads.runs.create(currentThreadId, {
        assistant_id: assistant_id,
        max_completion_tokens: 4000,
        temperature: targetAssistant.is_simulator ? 0.8 : 0.7,
        // Add specific instructions for simulator
        additional_instructions: targetAssistant.is_simulator
          ? "Você é um paciente/analisando em uma sessão de psicanálise. Responda como alguém que está buscando ajuda terapêutica, demonstrando resistências, transferências e outros fenômenos clínicos típicos. Ocasionalmente, forneça feedback técnico sobre a intervenção do analista em formação."
          : null
      });

      // Poll for completion
      console.log('⏳ Waiting for response...');
      let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (runStatus.status === 'running' || runStatus.status === 'queued') {
        if (attempts >= maxAttempts) {
          throw new Error('Timeout waiting for assistant response');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
        attempts++;
      }

      if (runStatus.status === 'failed') {
        console.error('❌ OpenAI run failed:', runStatus.last_error);
        throw new Error('Falha na execução do assistente: ' + runStatus.last_error?.message);
      }

      if (runStatus.status !== 'completed') {
        console.error('❌ Unexpected run status:', runStatus.status);
        throw new Error('Status inesperado do assistente: ' + runStatus.status);
      }

      // Get assistant response
      console.log('📨 Retrieving assistant response...');
      const messages = await openai.beta.threads.messages.list(currentThreadId, {
        order: 'desc',
        limit: 1
      });

      if (!messages.data.length || messages.data[0].role !== 'assistant') {
        throw new Error('Nenhuma resposta do assistente encontrada');
      }

      const assistantMessage = messages.data[0];
      const responseContent = assistantMessage.content[0]?.text?.value || 'Resposta não disponível';

      console.log('✅ Response received:', responseContent.substring(0, 100) + '...');

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          response: responseContent,
          thread_id: currentThreadId,
          assistant_name: targetAssistant.name,
          is_simulator: targetAssistant.is_simulator,
          usage: {
            total_tokens: runStatus.usage?.total_tokens || 0,
            prompt_tokens: runStatus.usage?.prompt_tokens || 0,
            completion_tokens: runStatus.usage?.completion_tokens || 0
          }
        }
      });

    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError);
      return res.status(500).json({
        success: false,
        error: 'Erro na comunicação com o assistente: ' + (openaiError.message || 'Erro desconhecido')
      });
    }

  } catch (error) {
    console.error('❌ Institution chat error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor: ' + (error.message || 'Erro desconhecido')
    });
  }
};