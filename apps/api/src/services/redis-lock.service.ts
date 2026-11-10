import Redis from 'ioredis';
import { redis } from '../lib/redis';

export interface CacheLockOptions {
  ttlMs?: number;
  retryIntervalMs?: number;
  maxRetries?: number;
}

export class RedisLockService {
  private static client: Redis | null = redis;

  /**
   * Acquire a distributed mutex lock in Redis
   */
  public static async acquireLock(key: string, ownerToken: string, ttlMs = 5000): Promise<boolean> {
    if (!this.client) return true; // Fallback if redis is down
    try {
      // SET key ownerToken NX PX ttlMs
      const res = await this.client.set(key, ownerToken, 'PX', ttlMs, 'NX');
      return res === 'OK';
    } catch (err) {
      console.warn('[RedisLock] Acquire error:', err);
      return true; // Don't block requests if Redis fails
    }
  }

  /**
   * Release a distributed mutex lock in Redis (only if owned by ownerToken)
   */
  public static async releaseLock(key: string, ownerToken: string): Promise<boolean> {
    if (!this.client) return true;
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      const res = await this.client.eval(luaScript, 1, key, ownerToken);
      return res === 1;
    } catch (err) {
      console.warn('[RedisLock] Release error:', err);
      return false;
    }
  }

  /**
   * Execute an operation inside a distributed lock (Twenty CRM Pattern)
   */
  public static async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheLockOptions
  ): Promise<T> {
    const { ttlMs = 6000, retryIntervalMs = 80, maxRetries = 25 } = options || {};
    const ownerToken = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let acquired = false;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      acquired = await this.acquireLock(key, ownerToken, ttlMs);
      if (acquired) break;
      await new Promise(res => setTimeout(res, retryIntervalMs));
    }

    if (!acquired) {
      throw new Error(`[RedisLock] Concurrency conflict: could not acquire lock for ${key}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(key, ownerToken);
    }
  }
}

