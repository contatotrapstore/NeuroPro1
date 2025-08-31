import OpenAI from 'openai';
import { supabase } from '../config/supabase';
import { OpenAICacheService } from './cache.service';
import { env } from '../config/env.validation';

class OpenAIService {
  private client: OpenAI;
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Detectar chave placeholder
    if (env.OPENAI_API_KEY.includes('placeholder') || env.OPENAI_API_KEY.includes('testing')) {
      console.warn('⚠️ OpenAI usando chave placeholder - Chat não funcionará');
      console.warn('📖 Veja CONFIGURACAO_OPENAI.md para configurar chave real');
    }

    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      organization: env.OPENAI_ORGANIZATION
    });
  }

  /**
   * Exponential backoff with jitter for retries
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
      30000 // Max 30 seconds
    );
    
    console.log(`⏳ OpenAI retry attempt ${attempt + 1}, waiting ${Math.round(delay)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt < this.maxRetries - 1) {
          await this.exponentialBackoff(attempt);
        }
      }
    }

    throw lastError;
  }

  // Criar nova thread de conversa
  async createThread(): Promise<string> {
    return await this.withRetry(async () => {
      const thread = await this.client.beta.threads.create();
      return thread.id;
    });
  }

  // Enviar mensagem para o assistente com cache e retry
  async sendMessage(
    threadId: string,
    assistantId: string,
    content: string
  ): Promise<{ messageId: string; runId: string }> {
    // Check cache for similar responses first
    const cachedResponse = await OpenAICacheService.getCachedResponse(assistantId, content);
    if (cachedResponse) {
      console.log('💾 Cache hit for OpenAI response');
      return cachedResponse;
    }

    return await this.withRetry(async () => {
      // Adicionar mensagem à thread
      const message = await this.client.beta.threads.messages.create(threadId, {
        role: 'user',
        content: content
      });

      // Executar assistente
      const run = await this.client.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
      });

      const result = {
        messageId: message.id,
        runId: run.id
      };

      // Cache the result for future similar requests
      await OpenAICacheService.cacheResponse(assistantId, content, result);

      return result;
    });
  }

  // Obter status da execução com retry
  async getRunStatus(threadId: string, runId: string): Promise<any> {
    return await this.withRetry(async () => {
      return await this.client.beta.threads.runs.retrieve(threadId, runId);
    });
  }

  // Obter mensagens da thread com cache
  async getThreadMessages(threadId: string): Promise<any[]> {
    // Try cache first
    const cachedMessages = await OpenAICacheService.getCachedThreadMessages(threadId);
    if (cachedMessages) {
      console.log('💾 Cache hit for thread messages');
      return cachedMessages;
    }

    return await this.withRetry(async () => {
      const messages = await this.client.beta.threads.messages.list(threadId);
      const messageData = messages.data;
      
      // Cache the messages
      await OpenAICacheService.cacheThreadMessages(threadId, messageData);
      
      return messageData;
    });
  }

  // Aguardar conclusão da execução com backoff otimizado
  async waitForCompletion(threadId: string, runId: string, timeoutMs: number = 300000): Promise<any> {
    const startTime = Date.now();
    let attempt = 0;
    
    while (Date.now() - startTime < timeoutMs) {
      const run = await this.getRunStatus(threadId, runId);
      
      if (run.status === 'completed' || run.status === 'failed' || run.status === 'expired') {
        return run;
      }
      
      // Progressive backoff: start with 1s, increase gradually
      const delay = Math.min(1000 + (attempt * 500), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
    
    throw new Error(`Timeout waiting for OpenAI run completion after ${timeoutMs}ms`);
  }

  // Obter dados do assistente com cache
  async getAssistant(assistantId: string): Promise<any> {
    // Try cache first
    const cachedAssistant = await OpenAICacheService.getCachedAssistantInfo(assistantId);
    if (cachedAssistant) {
      console.log('💾 Cache hit for assistant info');
      return cachedAssistant;
    }

    return await this.withRetry(async () => {
      const assistant = await this.client.beta.assistants.retrieve(assistantId);
      
      // Cache assistant info
      await OpenAICacheService.cacheAssistantInfo(assistantId, assistant);
      
      return assistant;
    });
  }

  // Validar se assistente existe
  async validateAssistant(assistantId: string): Promise<boolean> {
    try {
      await this.getAssistant(assistantId);
      return true;
    } catch (error: any) {
      // Log validation failures for debugging
      console.warn(`Assistant validation failed for ${assistantId}:`, error.message);
      return false;
    }
  }

  // Invalidate cache for specific assistant (useful for updates)
  async invalidateAssistantCache(assistantId: string): Promise<void> {
    await OpenAICacheService.invalidateAssistantCache(assistantId);
  }

  // Get cache statistics
  async getCacheStats(): Promise<any> {
    const { CacheService } = await import('./cache.service');
    return await CacheService.getStats();
  }
}

export const openaiService = new OpenAIService();