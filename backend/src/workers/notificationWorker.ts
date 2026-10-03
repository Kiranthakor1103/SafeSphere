import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { sendRegionalSMSAlert } from '../services/smsService';

export const startNotificationWorker = () => {
  const worker = new Worker(
    'NotificationQueue',
    async (job: Job) => {
      if (job.name === 'send-sos-alerts') {
        const { type, message, district, contactPhone } = job.data;

        // 1. Dispatch SMS using existing smsService
        await sendRegionalSMSAlert(
          district,
          `SOS: ${type.toUpperCase()}`,
          message
        );

        // 2. Dispatch Mock Email and Push Notifications
      }
    },
    {
      connection: redisConnection,
    }
  );

  worker.on('completed', (job: Job) => {
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
  });
};
