import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisManager {
  private static instance: Redis | null = null;
  private static isConnected = false;

  public static createClient(): Redis {
    return new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Connection fallback: continuing without Redis.');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
  }

  public static getClient(): Redis | null {
    if (this.instance) {
      return this.instance;
    }

    try {
      this.instance = this.createClient();

      this.instance.on('connect', () => {
        this.isConnected = true;
        console.log('[Redis] Connected successfully.');
      });

      this.instance.on('error', (err) => {
        console.warn('[Redis] Connection warning (optional offline mode):', err.message);
      });

      this.instance.connect().catch((err) => {
        console.warn('[Redis] Running in local memory fallback mode:', err.message);
      });

      return this.instance;
    } catch (err: any) {
      console.warn('[Redis] Initialization error, falling back:', err.message);
      return null;
    }
  }

  public static isReady(): boolean {
    return this.isConnected && this.instance?.status === 'ready';
  }
}

export const createRedisClient = () => RedisManager.createClient();
export const redis = RedisManager.getClient();
