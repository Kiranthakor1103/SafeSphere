import { Request, Response } from 'express';
import IoTSensor from '../models/IoTSensor';
import RescueTeam from '../models/RescueTeam';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

// Telemetry endpoint invoked by ESP32 / Arduino / Semiconductor hardware chips
export const receiveTelemetry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { chipId, name, lat, lng, address, distanceMeters, waterLevelCm, batteryLevel, sensorType } = req.body;

  if (!chipId) {
    throw new AppError('Chip identifier (chipId) is required.', 400);
  }

  let sensor = await IoTSensor.findOne({ chipId });

  if (!sensor) {
    sensor = new IoTSensor({
      chipId,
      name: name || `IoT Sensor (${chipId})`,
      sensorType: sensorType || 'location_tracker',
      location: {
        lat: lat !== undefined ? Number(lat) : 0,
        lng: lng !== undefined ? Number(lng) : 0,
        address: address || 'Field IoT Station',
      },
    });
  }

  // Update telemetry metrics
  if (lat !== undefined) sensor.location.lat = Number(lat);
  if (lng !== undefined) sensor.location.lng = Number(lng);
  if (address !== undefined) sensor.location.address = address;
  if (distanceMeters !== undefined) sensor.distanceMeters = Number(distanceMeters);
  if (waterLevelCm !== undefined) sensor.waterLevelCm = Number(waterLevelCm);
  if (batteryLevel !== undefined) sensor.batteryLevel = Number(batteryLevel);
  sensor.lastPing = new Date();

  await sensor.save();

  // If this hardware chip is attached to a Rescue Team, sync team coordinates automatically
  if (sensor.assignedTeam && (lat !== undefined || lng !== undefined)) {
    const team = await RescueTeam.findById(sensor.assignedTeam);
    if (team) {
      team.location.lat = sensor.location.lat;
      team.location.lng = sensor.location.lng;
      if (address) team.location.address = address;
      await team.save();

      if ((req as any).io) {
        (req as any).io.emit('team:updated', team.toObject());
      }
    }
  }

  // Emit real-time telemetry over WebSockets to dashboards & live maps
  if ((req as any).io) {
    (req as any).io.emit('iot:telemetry', {
      sensor: sensor.toObject(),
      timestamp: new Date(),
    });

    if (sensor.status === 'critical') {
      (req as any).io.emit('iot:alert', {
        chipId: sensor.chipId,
        name: sensor.name,
        waterLevelCm: sensor.waterLevelCm,
        message: `CRITICAL FLOOD LEVEL DETECTED: ${sensor.waterLevelCm} cm recorded by ${sensor.name}`,
        timestamp: new Date(),
      });
    }
  }

  res.json({
    success: true,
    message: 'Telemetry recorded successfully.',
    sensor: {
      chipId: sensor.chipId,
      status: sensor.status,
      lastPing: sensor.lastPing,
    },
  });
});

export const getSensors = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sensors = await IoTSensor.find()
    .populate('disasterId', 'title type')
    .populate('assignedTeam', 'name status vehicleType')
    .sort({ updatedAt: -1 });

  res.json({ success: true, count: sensors.length, sensors });
});

export const createSensor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sensor = await IoTSensor.create(req.body);

  if ((req as any).io) {
    (req as any).io.emit('iot:created', sensor.toObject());
  }

  res.status(201).json({ success: true, message: 'IoT Sensor registered.', sensor });
});

export const updateSensor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sensor = await IoTSensor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!sensor) {
    throw new AppError('IoT Sensor not found.', 404);
  }

  if ((req as any).io) {
    (req as any).io.emit('iot:updated', sensor.toObject());
  }

  res.json({ success: true, message: 'IoT Sensor updated.', sensor });
});

export const deleteSensor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sensor = await IoTSensor.findByIdAndDelete(req.params.id);

  if (!sensor) {
    throw new AppError('IoT Sensor not found.', 404);
  }

  if ((req as any).io) {
    (req as any).io.emit('iot:deleted', { _id: req.params.id });
  }

  res.json({ success: true, message: 'IoT Sensor unregistered.' });
});
