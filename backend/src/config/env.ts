import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/disasterconnect',
  JWT_SECRET: process.env.JWT_SECRET || 'disasterconnect_super_secret_jwt_key_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  IOT_API_KEY: process.env.IOT_API_KEY || '',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  PG_URI: process.env.PG_URI || 'postgresql://postgres:postgres@localhost:5432/safesphere',
  MQTT_HOST: process.env.MQTT_HOST || 'mqtt://localhost:1883',
  AI_ENGINE_URL: process.env.AI_ENGINE_URL || 'http://localhost:8000',
};

export const validateEnv = (): void => {
  const missing: string[] = [];

  if (!process.env.JWT_SECRET && ENV.NODE_ENV === 'production') {
    missing.push('JWT_SECRET');
  } else if (!process.env.JWT_SECRET) {}

  if (!process.env.MONGODB_URI && ENV.NODE_ENV === 'production') {
    missing.push('MONGODB_URI');
  } else if (!process.env.MONGODB_URI) {}

  if (!process.env.IOT_API_KEY) {}

  if (missing.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  }
};
