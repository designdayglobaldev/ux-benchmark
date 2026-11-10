import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis';

// Helper to create store if Redis is available, otherwise default to memory
const createStore = (prefix: string) => {
  if (redis && redis.status === 'ready') {
    return new RedisStore({
      // @ts-expect-error - ioredis sendCommand compatibility with rate-limit-redis
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix,
    });
  }
  return undefined; // Falls back to express-rate-limit default in-memory store
};

/**
 * General API rate limiter:
 * 100 requests per 1 minute window
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:general:'),
  message: {
    status: 'error',
    message: 'Too many requests, please slow down and try again shortly.',
  },
});

/**
 * Strict AI rate limiter:
 * Protects Anthropic/OpenAI quota and prevents server memory overload.
 * Reads endpoints (GET /sessions, GET /sessions/:id) skip this limiter.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // Never rate-limit reading session history or polling
  store: createStore('rl:ai:'),
  message: {
    status: 'error',
    message: 'AI request limit reached. Please wait a moment before sending another prompt.',
  },
});

