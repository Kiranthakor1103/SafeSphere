import Redis from 'ioredis';
import { ENV } from './env';

export const redisConnection = new Redis({
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  maxRetriesPerRequest: null, // Required by BullMQ
});

redisConnection.on('connect', () => {
});

redisConnection.on('error', (err) => {
});
