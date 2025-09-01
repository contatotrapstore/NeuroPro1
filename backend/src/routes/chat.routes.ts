import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';
import { openaiService } from '../services/openai.service';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Criar nova conversa
router.post('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assistant_id, title } = req.body;
    const userId = req.user?.id;
    const userClient = req.supabaseClient;

    console.log('🔍 [createConversation] Iniciando criação de conversa');
    console.log('🔍 [createConversation] User ID:', userId);
    console.log('🔍 [createConversation] Assistant ID:', assistant_id);
    console.log('🔍 [createConversation] Cliente individual disponível:', !!userClient);

    // Usar cliente individual da requisição ou fallback para o compartilhado
    const client = userClient || supabase;

    // Validar se o assistente existe no banco (query pública, pode usar cliente compartilhado)
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id, name')
      .eq('id', assistant_id)
      .eq('is_active', true)
      .single();

    if (assistantError || !assistant) {
      console.log('❌ [createConversation] Assistente não encontrado:', assistant_id);
      return res.status(404).json({
        success: false,
        message: 'Assistente não encontrado'
      });
    }

    // Validar se o usuário tem acesso ao assistente (precisa do cliente autenticado)
    const { data: subscriptions, error: subError } = await client
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('assistant_id', assistant_id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());

    console.log('🔍 [createConversation] Verificação de acesso executada');
    console.log('🔍 [createConversation] Subscriptions encontradas:', subscriptions?.length || 0);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log('❌ [createConversation] Usuário sem acesso ao assistente');
      return res.status(403).json({
        success: false,
        message: 'Você não possui acesso a este assistente. Faça uma assinatura para usar este assistente.'
      });
    }

    // Criar thread no OpenAI
    const threadId = await openaiService.createThread();

    // Criar conversa no banco (precisa do cliente autenticado)
    const { data: conversation, error } = await client
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
      console.error('❌ [createConversation] Erro ao criar conversa:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar conversa',
        error: error.message
      });
    }

    console.log('✅ [createConversation] Conversa criada com sucesso');
    res.status(201).json({
      success: true,
      data: conversation,
      message: 'Conversa criada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [createConversation] Erro ao criar conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar conversas do usuário
router.get('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userClient = req.supabaseClient;

    console.log('🔍 [getConversations] Iniciando busca de conversas');
    console.log('🔍 [getConversations] User ID:', userId);
    console.log('🔍 [getConversations] Cliente individual disponível:', !!userClient);

    // Usar cliente individual da requisição ou fallback para o compartilhado
    const client = userClient || supabase;

    const { data: conversations, error } = await client
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

    console.log('🔍 [getConversations] Query executada');
    console.log('🔍 [getConversations] Erro:', error);
    console.log('🔍 [getConversations] Conversas encontradas:', conversations?.length || 0);

    if (error) {
      console.error('❌ [getConversations] Erro na query:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar conversas',
        error: error.message
      });
    }

    console.log('✅ [getConversations] Retornando', conversations?.length || 0, 'conversas');
    res.json({
      success: true,
      data: conversations,
      message: 'Conversas recuperadas com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [getConversations] Erro ao listar conversas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter conversa específica
router.get('/conversations/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userClient = req.supabaseClient;

    console.log('🔍 [getConversation] Buscando conversa específica');
    console.log('🔍 [getConversation] Conversation ID:', id);
    console.log('🔍 [getConversation] User ID:', userId);
    console.log('🔍 [getConversation] Cliente individual disponível:', !!userClient);

    // Usar cliente individual da requisição ou fallback para o compartilhado
    const client = userClient || supabase;

    const { data: conversation, error } = await client
      .from('conversations')
      .select(`
        *,
        assistants (
          name,
          icon,
          color_theme
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    console.log('🔍 [getConversation] Query executada');
    console.log('🔍 [getConversation] Erro:', error);
    console.log('🔍 [getConversation] Conversa encontrada:', !!conversation);

    if (error || !conversation) {
      console.log('❌ [getConversation] Conversa não encontrada');
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    console.log('✅ [getConversation] Conversa recuperada com sucesso');
    res.json({
      success: true,
      data: conversation,
      message: 'Conversa recuperada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [getConversation] Erro ao obter conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar mensagem
router.post('/conversations/:id/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;
    const userClient = req.supabaseClient;

    console.log('🔍 [sendMessage] Iniciando envio de mensagem');
    console.log('🔍 [sendMessage] Conversation ID:', id);
    console.log('🔍 [sendMessage] User ID:', userId);
    console.log('🔍 [sendMessage] Cliente individual disponível:', !!userClient);

    // Usar cliente individual da requisição ou fallback para o compartilhado
    const client = userClient || supabase;

    // Verificar se a conversa existe e pertence ao usuário
    const { data: conversation, error: convError } = await client
      .from('conversations')
      .select('*, assistants(id, name, openai_assistant_id)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    console.log('🔍 [sendMessage] Verificação de conversa executada');
    console.log('🔍 [sendMessage] Erro:', convError);
    console.log('🔍 [sendMessage] Conversa encontrada:', !!conversation);

    if (convError || !conversation) {
      console.log('❌ [sendMessage] Conversa não encontrada');
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Validar se o usuário ainda tem acesso ao assistente
    const { data: subscriptions, error: subError } = await client
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('assistant_id', conversation.assistant_id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());

    console.log('🔍 [sendMessage] Verificação de acesso executada');
    console.log('🔍 [sendMessage] Subscriptions encontradas:', subscriptions?.length || 0);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log('❌ [sendMessage] Usuário sem acesso ao assistente');
      return res.status(403).json({
        success: false,
        message: 'Sua assinatura para este assistente expirou ou foi cancelada.'
      });
    }

    // Salvar mensagem do usuário no banco (messages tem RLS, precisa usar cliente autenticado)
    const { data: userMessage, error: userMsgError } = await client
      .from('messages')
      .insert({
        conversation_id: id,
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

    // Enviar mensagem para o OpenAI
    console.log(`Enviando mensagem para OpenAI - Assistant ID: ${conversation.assistants.openai_assistant_id}, Thread ID: ${conversation.thread_id}`);
    const { runId } = await openaiService.sendMessage(
      conversation.thread_id,
      conversation.assistants.openai_assistant_id,
      content
    );

    // Aguardar resposta do assistente
    console.log(`Aguardando conclusão do run ${runId}...`);
    const completionResult = await openaiService.waitForCompletion(conversation.thread_id, runId);
    console.log(`Run concluído com status: ${completionResult.status}`);

    // Obter mensagens da thread
    const threadMessages = await openaiService.getThreadMessages(conversation.thread_id);
    console.log(`Encontradas ${threadMessages.length} mensagens na thread`);
    console.log('Thread messages:', JSON.stringify(threadMessages.slice(0, 2), null, 2)); // Log primeiras 2 mensagens
    
    // Encontrar a última mensagem do assistente (mais recente)
    const assistantMessages = threadMessages.filter(msg => msg.role === 'assistant');
    const assistantMessage = assistantMessages.length > 0 ? assistantMessages[0] : null; // OpenAI retorna em ordem decrescente por data
    console.log('Assistant message found:', assistantMessage ? 'Yes' : 'No');

    if (assistantMessage) {
      // Salvar resposta do assistente no banco
      const assistantContent = assistantMessage.content[0]?.text?.value || 'Erro ao obter resposta';
      
      const { data: assistantReply, error: assistantError } = await client
        .from('messages')
        .insert({
          conversation_id: id,
          role: 'assistant',
          content: assistantContent
        })
        .select()
        .single();

      if (assistantError) {
        console.error('Erro ao salvar resposta do assistente:', assistantError);
      }

      // Atualizar timestamp da conversa (precisa do cliente autenticado)
      await client
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      res.json({
        success: true,
        data: {
          userMessage,
          assistantMessage: assistantReply
        },
        message: 'Mensagem enviada e resposta recebida'
      });
    } else {
      res.json({
        success: true,
        data: { userMessage },
        message: 'Mensagem enviada, aguardando resposta'
      });
    }

  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    console.error('Stack trace:', error.stack);
    
    // Log specific OpenAI errors
    if (error.status) {
      console.error(`OpenAI API Error - Status: ${error.status}, Message: ${error.message}`);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao processar mensagem',
      error: error.message
    });
  }
});

// Obter mensagens de uma conversa
router.get('/conversations/:id/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userClient = req.supabaseClient;

    console.log('🔍 [getMessages] Buscando mensagens da conversa');
    console.log('🔍 [getMessages] Conversation ID:', id);
    console.log('🔍 [getMessages] User ID:', userId);
    console.log('🔍 [getMessages] Cliente individual disponível:', !!userClient);

    // Usar cliente individual da requisição ou fallback para o compartilhado
    const client = userClient || supabase;

    // Verificar se a conversa existe e pertence ao usuário
    const { data: conversation, error: convError } = await client
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    console.log('🔍 [getMessages] Verificação de conversa executada');
    console.log('🔍 [getMessages] Erro na verificação:', convError);
    console.log('🔍 [getMessages] Conversa encontrada:', !!conversation);

    if (convError || !conversation) {
      console.log('❌ [getMessages] Conversa não encontrada');
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Buscar mensagens da conversa (messages tem RLS, precisa usar cliente autenticado)
    const { data: messages, error } = await client
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    console.log('🔍 [getMessages] Query de mensagens executada');
    console.log('🔍 [getMessages] Erro:', error);
    console.log('🔍 [getMessages] Mensagens encontradas:', messages?.length || 0);

    if (error) {
      console.error('❌ [getMessages] Erro ao buscar mensagens:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar mensagens',
        error: error.message
      });
    }

    console.log('✅ [getMessages] Retornando', messages?.length || 0, 'mensagens');
    res.json({
      success: true,
      data: messages,
      message: 'Mensagens recuperadas com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [getMessages] Erro ao obter mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Deletar conversa
router.delete('/conversations/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userClient = req.supabaseClient;

    console.log('🔍 [deleteConversation] Iniciando deleção de conversa');
    console.log('🔍 [deleteConversation] Conversation ID:', id);
    console.log('🔍 [deleteConversation] User ID:', userId);
    console.log('🔍 [deleteConversation] Cliente individual disponível:', !!userClient);

    // Usar cliente individual da requisição ou fallback para o compartilhado
    const client = userClient || supabase;

    // Deletar mensagens primeiro (cascade) - messages tem RLS, precisa usar cliente autenticado
    await client
      .from('messages')
      .delete()
      .eq('conversation_id', id);

    console.log('🔍 [deleteConversation] Mensagens deletadas');

    // Deletar conversa (precisa do cliente autenticado)
    const { error } = await client
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    console.log('🔍 [deleteConversation] Tentativa de deletar conversa executada');
    console.log('🔍 [deleteConversation] Erro:', error);

    if (error) {
      console.error('❌ [deleteConversation] Erro ao deletar conversa:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar conversa',
        error: error.message
      });
    }

    console.log('✅ [deleteConversation] Conversa deletada com sucesso');
    res.json({
      success: true,
      message: 'Conversa deletada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [deleteConversation] Erro ao deletar conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;