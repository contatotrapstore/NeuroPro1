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

    // Validar se o assistente existe no banco
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

    // Validar se o usuário tem acesso ao assistente
    const { data: subscriptions, error: subError } = await supabase
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

    // Criar thread no OpenAI
    const threadId = await openaiService.createThread();

    // Criar conversa no banco
    const { data: conversation, error } = await supabase
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

    res.status(201).json({
      success: true,
      data: conversation,
      message: 'Conversa criada com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao criar conversa:', error);
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

    const { data: conversations, error } = await supabase
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

    res.json({
      success: true,
      data: conversations,
      message: 'Conversas recuperadas com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao listar conversas:', error);
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

    const { data: conversation, error } = await supabase
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

    if (error || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    res.json({
      success: true,
      data: conversation,
      message: 'Conversa recuperada com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao obter conversa:', error);
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

    // Verificar se a conversa existe e pertence ao usuário
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, assistants(id, name, openai_assistant_id)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Validar se o usuário ainda tem acesso ao assistente
    const { data: subscriptions, error: subError } = await supabase
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

    // Salvar mensagem do usuário no banco
    const { data: userMessage, error: userMsgError } = await supabase
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
      
      const { data: assistantReply, error: assistantError } = await supabase
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

      // Atualizar timestamp da conversa
      await supabase
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

    // Verificar se a conversa existe e pertence ao usuário
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Buscar mensagens da conversa
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar mensagens',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: messages,
      message: 'Mensagens recuperadas com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao obter mensagens:', error);
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

    // Deletar mensagens primeiro (cascade)
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id);

    // Deletar conversa
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar conversa',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Conversa deletada com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao deletar conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;