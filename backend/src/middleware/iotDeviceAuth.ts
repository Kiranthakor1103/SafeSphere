import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ENV } from '../config/env';

/** Authenticates physical IoT devices independently of dashboard user JWTs. */
export const authenticateIoTDevice = (req: Request, res: Response, next: NextFunction): void => {
  const suppliedKey = req.header('x-iot-api-key');
  const configuredKey = ENV.IOT_API_KEY;

  if (!configuredKey) {
    res.status(503).json({ success: false, message: 'IoT telemetry authentication is not configured.' });
    return;
  }

  if (!suppliedKey || suppliedKey.length !== configuredKey.length) {
    res.status(401).json({ success: false, message: 'Invalid IoT device credentials.' });
    return;
  }

  const isValid = crypto.timingSafeEqual(Buffer.from(suppliedKey), Buffer.from(configuredKey));
  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid IoT device credentials.' });
    return;
  }

  (req as any).user = {
    _id: '000000000000000000000000',
    name: 'IoT Automated System',
    email: 'iot@safesphere.local',
    role: 'super_admin'
  };

  next();
};
