import { Request, Response } from 'express';
import SOSAlert from '../models/SOSAlert';
import Disaster from '../models/Disaster';
import { normalizeRole } from '../config/permissions';
import { applyDistrictScope, enforceDistrictCreation, verifyDistrictOwnership } from '../utils/districtScope';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { validatePhoneBackend } from '../utils/phoneValidator';
import { queueSOSNotification } from '../queues/notificationQueue';

export const getSOSAlerts = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const { status, priority, type, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 100 } = req.query;
  let filter: any = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;
  
  if (['citizen', 'volunteer'].includes(normalizeRole(req.user?.role) || '')) {
    filter.userId = req.user._id;
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { message: searchRegex },
      { contactPhone: searchRegex },
      { 'location.address': searchRegex },
    ];
  }

  filter = applyDistrictScope(req, filter);

  const sortOptions: any = {};
  sortOptions[String(sortBy)] = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  const alerts = await SOSAlert.find(filter)
    .populate('userId', 'name email phone')
    .populate('disasterId', 'title type')
    .populate('assignedTeam', 'name')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sortOptions);

  const total = await SOSAlert.countDocuments(filter);
  res.json({ success: true, total, page: +page, alerts });
});

export const getSOSAlert = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const alert = await SOSAlert.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('disasterId', 'title type')
    .populate('assignedTeam');
  if (!alert) {
    throw new AppError('SOS Alert not found.', 404);
  }
  if (['citizen', 'volunteer'].includes(normalizeRole(req.user?.role) || '') && alert.userId?._id?.toString() !== req.user._id.toString()) {
    throw new AppError('You can only view your own SOS alerts.', 403);
  }
  verifyDistrictOwnership(req, alert, 'SOS Alert');

  res.json({ success: true, alert });
});

export const getNearestSOS = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radiusKm = 25, status = 'pending' } = req.query;

  if (!lat || !lng) {
    throw new AppError('Latitude and longitude are required parameters.', 400);
  }

  const latitude = parseFloat(String(lat));
  const longitude = parseFloat(String(lng));
  const maxDistanceMeters = parseFloat(String(radiusKm)) * 1000;

  let queryFilter: any = {
    geo: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  };

  if (status && status !== 'all') {
    queryFilter.status = status;
  }

  const alerts = await SOSAlert.find(queryFilter)
    .populate('userId', 'name email phone')
    .populate('disasterId', 'title type')
    .populate('assignedTeam', 'name')
    .limit(50);

  const results = alerts.map((alert) => {
    const aObj = alert.toObject();
    const dLat = (alert.location.lat - latitude) * (Math.PI / 180);
    const dLng = (alert.location.lng - longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latitude * (Math.PI / 180)) *
        Math.cos(alert.location.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(6371 * c * 10) / 10;
    return { ...aObj, distanceKm };
  });

  res.json({ success: true, count: results.length, alerts: results });
});

export const createSOSAlert = asyncHandler(async (req: any, res: Response): Promise<void> => {
  req.body = enforceDistrictCreation(req, req.body);
  const { countryCode = '+91', contactPhone, location } = req.body;
  if (contactPhone !== undefined) {
    const phoneErr = validatePhoneBackend(countryCode, contactPhone, true);
    if (phoneErr) {
      throw new AppError(phoneErr, 400);
    }
  }

  // Real-life intelligent auto-matching: If no disasterId provided, auto-tag to nearest active disaster within 50km
  if (!req.body.disasterId && location && typeof location.lat === 'number' && typeof location.lng === 'number') {
    const activeDisasters = await Disaster.find({ status: 'active' });
    let minDistanceKm = 50; // 50km radius threshold
    let nearestDisasterId = null;

    for (const d of activeDisasters) {
      if (d.location && typeof d.location.lat === 'number' && typeof d.location.lng === 'number') {
        const dLat = (d.location.lat - location.lat) * (Math.PI / 180);
        const dLng = (d.location.lng - location.lng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(location.lat * (Math.PI / 180)) *
            Math.cos(d.location.lat * (Math.PI / 180)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = 6371 * c;
        if (distanceKm < minDistanceKm) {
          minDistanceKm = distanceKm;
          nearestDisasterId = d._id;
        }
      }
    }
    if (nearestDisasterId) {
      req.body.disasterId = nearestDisasterId;
    }
  }

  const alert = await SOSAlert.create({ ...req.body, userId: req.user._id });
  
  try {
    await queueSOSNotification(alert);
  } catch (err) {
    // Fail silently in route, backend worker handles retries/failures
  }

  const populatedAlert = await SOSAlert.findById(alert._id)
    .populate('userId', 'name email phone')
    .populate('disasterId', 'title type')
    .populate('assignedTeam', 'name');

  if (req.io) {
    const alertObj = populatedAlert ? populatedAlert.toObject() : alert.toObject();
    req.io.emit('sos:created', {
      ...alertObj,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.status(201).json({ success: true, message: 'SOS Alert created. Help is on the way!', alert: populatedAlert || alert });
});

export const updateSOSAlert = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await SOSAlert.findById(req.params.id);
  if (!existing) {
    throw new AppError('SOS Alert not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'SOS Alert');

  const { countryCode = '+91', contactPhone, status } = req.body;
  if (contactPhone !== undefined) {
    const phoneErr = validatePhoneBackend(countryCode, contactPhone, true);
    if (phoneErr) {
      throw new AppError(phoneErr, 400);
    }
  }

  if (status === 'resolved' && !req.body.resolvedAt) {
    req.body.resolvedAt = new Date();
  }

  const alert = await SOSAlert.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('userId', 'name email phone')
    .populate('disasterId', 'title type')
    .populate('assignedTeam', 'name');

  // Real-life logic: If SOS is resolved or cancelled, check assigned team status
  if ((status === 'resolved' || status === 'cancelled') && alert!.assignedTeam) {
    const teamId = typeof alert!.assignedTeam === 'object' ? (alert!.assignedTeam as any)._id : alert!.assignedTeam;
    const activeAlertsCount = await SOSAlert.countDocuments({
      assignedTeam: teamId,
      status: { $in: ['pending', 'assigned', 'in_progress'] },
      _id: { $ne: alert!._id }
    });

    if (activeAlertsCount === 0) {
      const team = await RescueTeam.findById(teamId);
      if (team && team.status === 'deployed') {
        team.status = 'available';
        await team.save();
        if (req.io) {
          req.io.emit('team:updated', {
            ...team.toObject(),
            performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
          });
        }
      }
    }
  }

  if (req.io) {
    req.io.emit('sos:updated', {
      ...alert!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'SOS Alert updated.', alert });
});

import RescueTeam from '../models/RescueTeam';
import Alert from '../models/Alert';

export const dispatchTeamToSOS = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const { teamId } = req.body;
  const { id } = req.params;

  if (!teamId) {
    throw new AppError('Rescue team ID is required for dispatching.', 400);
  }

  const alert = await SOSAlert.findById(id);
  if (!alert) {
    throw new AppError('SOS Alert not found.', 404);
  }
  verifyDistrictOwnership(req, alert, 'SOS Alert');

  const team = await RescueTeam.findById(teamId);
  if (!team) {
    throw new AppError('Rescue Team not found.', 404);
  }
  verifyDistrictOwnership(req, team, 'Rescue Team');

  alert.assignedTeam = team._id;
  alert.status = 'in_progress';
  await alert.save();

  team.status = 'deployed';
  if (!team.assignedSOS.includes(alert._id)) {
    team.assignedSOS.push(alert._id);
  }
  await team.save();

  const populatedAlert = await SOSAlert.findById(alert._id)
    .populate('userId', 'name email phone')
    .populate('disasterId', 'title type')
    .populate('assignedTeam', 'name status contactPhone');

  // Create system emergency notification record
  let createdSystemAlert = null;
  try {
    createdSystemAlert = await Alert.create({
      title: `🚨 Team Dispatched: ${team.name}`,
      message: `Rescue team "${team.name}" dispatched to respond to ${alert.type?.toUpperCase()} emergency at ${alert.location?.address || 'field location'}.`,
      type: 'danger',
      targetRoles: ['admin', 'super_admin', 'district_admin', 'rescue_team', 'volunteer', 'responder', 'citizen'],
      issuedBy: req.user?._id || team.leader,
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (err) {}

  if (req.io) {
    if (createdSystemAlert) {
      req.io.emit('alert:broadcast', {
        ...createdSystemAlert.toObject(),
        performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
      });
    }
    req.io.emit('team:dispatched', {
      teamId: team._id,
      teamName: team.name,
      sosId: alert._id,
      sosType: alert.type,
      location: alert.location?.address,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('sos:updated', {
      ...populatedAlert!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('team:updated', {
      ...team.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: `Rescue team "${team.name}" dispatched successfully!`, alert: populatedAlert });
});

export const deleteSOSAlert = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const alert = await SOSAlert.findById(req.params.id);
  if (!alert) {
    throw new AppError('SOS Alert not found.', 404);
  }
  verifyDistrictOwnership(req, alert, 'SOS Alert');

  await SOSAlert.findByIdAndDelete(req.params.id);

  if (req.io) {
    req.io.emit('sos:deleted', {
      _id: req.params.id,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'SOS Alert deleted.' });
});
