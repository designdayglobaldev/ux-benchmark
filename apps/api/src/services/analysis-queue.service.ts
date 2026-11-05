import { redis } from '../lib/redis';

// Fallback in-memory set if Redis is offline
const memoryFallback = new Set<string>();
const REDIS_SET_KEY = 'analysis:active_screens';

// Backward compatibility proxy object
export const activeProcessingScreens = {
  has: (id: string) => memoryFallback.has(id),
  add: (id: string) => memoryFallback.add(id),
  delete: (id: string) => memoryFallback.delete(id),
  [Symbol.iterator]: function* () {
    yield* memoryFallback;
  }
};

export async function getActiveScreenIds(): Promise<string[]> {
  if (redis && redis.status === 'ready') {
    try {
      return await redis.smembers(REDIS_SET_KEY);
    } catch (err: any) {
      console.warn('[Redis] Queue read error, using fallback:', err.message);
    }
  }
  return Array.from(memoryFallback);
}

export async function markScreensProcessing(screenIds: string[]): Promise<void> {
  if (screenIds.length === 0) return;

  screenIds.forEach(id => memoryFallback.add(id));

  if (redis && redis.status === 'ready') {
    try {
      await redis.sadd(REDIS_SET_KEY, ...screenIds);
    } catch (err: any) {
      console.warn('[Redis] Queue error, using fallback:', err.message);
    }
  }
}

export async function unmarkScreenProcessing(screenId: string): Promise<void> {
  memoryFallback.delete(screenId);

  if (redis && redis.status === 'ready') {
    try {
      await redis.srem(REDIS_SET_KEY, screenId);
    } catch (err: any) {
      console.warn('[Redis] Queue error, using fallback:', err.message);
    }
  }
}

export async function isScreenProcessing(screenId: string): Promise<boolean> {
  if (redis && redis.status === 'ready') {
    try {
      const result = await redis.sismember(REDIS_SET_KEY, screenId);
      return result === 1;
    } catch (err: any) {
      console.warn('[Redis] Queue error, using fallback:', err.message);
    }
  }

  return memoryFallback.has(screenId);
}

export async function clearScreensProcessing(screenIds: string[]): Promise<void> {
  if (screenIds.length === 0) return;

  screenIds.forEach(id => memoryFallback.delete(id));

  if (redis && redis.status === 'ready') {
    try {
      await redis.srem(REDIS_SET_KEY, ...screenIds);
    } catch (err: any) {
      console.warn('[Redis] Queue error, using fallback:', err.message);
    }
  }
}
