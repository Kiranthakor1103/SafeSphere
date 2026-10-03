import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const notificationQueue = new Queue('NotificationQueue', {
  connection: redisConnection,
});

export const queueSOSNotification = async (sosData: any) => {
  await notificationQueue.add('send-sos-alerts', {
    sosId: sosData._id,
    type: sosData.type,
    message: sosData.message,
    numberOfPeople: sosData.numberOfPeople,
    contactPhone: sosData.contactPhone,
    district: sosData.district,
    location: sosData.location,
  });
};
