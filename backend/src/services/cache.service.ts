import Redis from 'ioredis';
import { env } from '../config/env.validation';

/**
 * Cache service for OpenAI responses and other expensive operations
 * Reduces API costs and improves response times
 */
export class CacheService {
  private static redis: Redis | null = null;
  private static isEnabled: boolean = false;

  /**
   * Initialize Redis connection
   */
  static async initialize(): Promise<void> {
    try {
      if (env.REDIS_URL) {
        // Try to connect but don't block startup if it fails
        try {
          this.redis = new Redis(env.REDIS_URL, {
            connectTimeout: 5000,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
          });

          this.redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
            this.isEnabled = true;
          });

          this.redis.on('error', (err) => {
            console.warn('⚠️ Redis connection error (cache disabled):', err.message);
            this.isEnabled = false;
          });

          // Test connection with timeout
          const pingPromise = this.redis.ping();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 3000)
          );
          
          await Promise.race([pingPromise, timeoutPromise]);
          
        } catch (redisError) {
          console.log('⚠️ Redis not available, running without cache');
          this.isEnabled = false;
          this.redis = null;
        }
      } else {
        console.log('⚠️ Redis not configured, caching disabled');
      }
    } catch (error) {
      console.log('⚠️ Cache service disabled:', (error as Error).message);
      this.isEnabled = false;
    }
  }

  /**
   * Check if cache is available
   */
  static isAvailable(): boolean {
    return this.isEnabled && this.redis !== null;
  }

  /**
   * Generate cache key with namespace
   */
  private static generateKey(namespace: string, key: string): string {
    return `neuroia:${namespace}:${key}`;
  }

  /**
   * Get cached value
   */
  static async get<T>(namespace: string, key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const cacheKey = this.generateKey(namespace, key);
      const cached = await this.redis!.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }
    
    return null;
  }

  /**
   * Set cached value with expiration
   */
  static async set(
    namespace: string, 
    key: string, 
    value: any, 
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = this.generateKey(namespace, key);
      await this.redis!.setex(cacheKey, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  static async delete(namespace: string, key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = this.generateKey(namespace, key);
      await this.redis!.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   */
  static async deletePattern(namespace: string, pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const searchPattern = this.generateKey(namespace, pattern);
      const keys = await this.redis!.keys(searchPattern);
      
      if (keys.length > 0) {
        return await this.redis!.del(...keys);
      }
      
      return 0;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(namespace: string, key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = this.generateKey(namespace, key);
      const result = await this.redis!.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  static async getTTL(namespace: string, key: string): Promise<number> {
    if (!this.isAvailable()) return -1;

    try {
      const cacheKey = this.generateKey(namespace, key);
      return await this.redis!.ttl(cacheKey);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<any> {
    if (!this.isAvailable()) return null;

    try {
      const info = await this.redis!.info('memory');
      const dbSize = await this.redis!.dbsize();
      
      return {
        connected: this.isEnabled,
        dbSize,
        memoryInfo: info
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Flush all cache data (use with caution)
   */
  static async flushAll(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.redis!.flushall();
      console.log('🗑️  Cache flushed successfully');
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  static async close(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
      this.isEnabled = false;
      console.log('Redis connection closed');
    }
  }
}

/**
 * OpenAI specific cache methods with optimized TTL
 */
export class OpenAICacheService {
  private static readonly NAMESPACE = 'openai';
  
  // Cache TTL configurations (in seconds)
  private static readonly CACHE_TTL = {
    ASSISTANT_RESPONSE: 24 * 60 * 60, // 24 hours for assistant responses
    THREAD_MESSAGES: 30 * 60, // 30 minutes for thread messages
    USER_THREADS: 10 * 60, // 10 minutes for user thread lists
    ASSISTANT_INFO: 60 * 60, // 1 hour for assistant info
  };

  /**
   * Generate content-based cache key for similar requests
   */
  private static generateContentKey(assistantId: string, message: string): string {
    const crypto = require('crypto');
    const contentHash = crypto
      .createHash('sha256')
      .update(`${assistantId}:${message.toLowerCase().trim()}`)
      .digest('hex')
      .substring(0, 16);
    
    return `response:${assistantId}:${contentHash}`;
  }

  /**
   * Cache OpenAI assistant response
   */
  static async cacheResponse(
    assistantId: string, 
    message: string, 
    response: any
  ): Promise<void> {
    const cacheKey = this.generateContentKey(assistantId, message);
    await CacheService.set(
      this.NAMESPACE, 
      cacheKey, 
      response, 
      this.CACHE_TTL.ASSISTANT_RESPONSE
    );
  }

  /**
   * Get cached OpenAI response
   */
  static async getCachedResponse(
    assistantId: string, 
    message: string
  ): Promise<any | null> {
    const cacheKey = this.generateContentKey(assistantId, message);
    return await CacheService.get(this.NAMESPACE, cacheKey);
  }

  /**
   * Cache thread messages
   */
  static async cacheThreadMessages(threadId: string, messages: any[]): Promise<void> {
    await CacheService.set(
      this.NAMESPACE, 
      `thread:${threadId}`, 
      messages, 
      this.CACHE_TTL.THREAD_MESSAGES
    );
  }

  /**
   * Get cached thread messages
   */
  static async getCachedThreadMessages(threadId: string): Promise<any[] | null> {
    return await CacheService.get(this.NAMESPACE, `thread:${threadId}`);
  }

  /**
   * Cache user threads list
   */
  static async cacheUserThreads(userId: string, threads: any[]): Promise<void> {
    await CacheService.set(
      this.NAMESPACE, 
      `user_threads:${userId}`, 
      threads, 
      this.CACHE_TTL.USER_THREADS
    );
  }

  /**
   * Get cached user threads
   */
  static async getCachedUserThreads(userId: string): Promise<any[] | null> {
    return await CacheService.get(this.NAMESPACE, `user_threads:${userId}`);
  }

  /**
   * Cache assistant information
   */
  static async cacheAssistantInfo(assistantId: string, info: any): Promise<void> {
    await CacheService.set(
      this.NAMESPACE, 
      `assistant_info:${assistantId}`, 
      info, 
      this.CACHE_TTL.ASSISTANT_INFO
    );
  }

  /**
   * Get cached assistant info
   */
  static async getCachedAssistantInfo(assistantId: string): Promise<any | null> {
    return await CacheService.get(this.NAMESPACE, `assistant_info:${assistantId}`);
  }

  /**
   * Invalidate user-specific cache (e.g., when subscription changes)
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await CacheService.deletePattern(this.NAMESPACE, `user_threads:${userId}`);
  }

  /**
   * Invalidate assistant-specific cache (e.g., when assistant is updated)
   */
  static async invalidateAssistantCache(assistantId: string): Promise<void> {
    await CacheService.deletePattern(this.NAMESPACE, `assistant_info:${assistantId}`);
    await CacheService.deletePattern(this.NAMESPACE, `response:${assistantId}:*`);
  }
}

// Initialize cache service on module load
CacheService.initialize().catch(console.error);