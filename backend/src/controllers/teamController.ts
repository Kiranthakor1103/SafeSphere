import { Request, Response } from 'express';
import Volunteer from '../models/Volunteer';
import RescueTeam from '../models/RescueTeam';
import User from '../models/User';
import { applyDistrictScope, enforceDistrictCreation, verifyDistrictOwnership } from '../utils/districtScope';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { validatePhoneBackend } from '../utils/phoneValidator';

// ---- VOLUNTEERS ----
export const getVolunteers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { isAvailable, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 100 } = req.query;
  let filter: any = {};
  if (isAvailable !== undefined) {
    filter.isAvailable = isAvailable === 'true';
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { skills: searchRegex },
      { 'location.address': searchRegex },
    ];
  }

  filter = applyDistrictScope(req as any, filter);

  const sortOptions: any = {};
  sortOptions[String(sortBy)] = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  const volunteers = await Volunteer.find(filter)
    .populate('userId', 'name email phone')
    .populate('assignedDisaster', 'title type')
    .populate('assignedTeam', 'name')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sortOptions);

  const total = await Volunteer.countDocuments(filter);
  res.json({ success: true, total, page: +page, volunteers });
});

export const createVolunteer = asyncHandler(async (req: any, res: Response): Promise<void> => {
  req.body = enforceDistrictCreation(req, req.body);
  const existing = await Volunteer.findOne({ userId: req.user._id });
  if (existing) {
    throw new AppError('You are already registered as a volunteer.', 400);
  }
  const volunteer = await Volunteer.create({ ...req.body, userId: req.user._id });

  if (req.user.role === 'citizen') {
    await User.findByIdAndUpdate(req.user._id, { role: 'volunteer' });
  }

  if (req.io) {
    req.io.emit('volunteer:created', {
      ...volunteer.toObject(),
      userName: req.user.name,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.status(201).json({ success: true, message: 'Volunteer registered.', volunteer });
});

export const updateVolunteer = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await Volunteer.findById(req.params.id);
  if (!existing) {
    throw new AppError('Volunteer not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Volunteer');

  const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('userId', 'name email');

  if (req.io) {
    req.io.emit('volunteer:updated', {
      ...volunteer!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Volunteer updated.', volunteer });
});

export const deleteVolunteer = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const volunteer = await Volunteer.findById(req.params.id);
  if (!volunteer) {
    throw new AppError('Volunteer not found.', 404);
  }
  verifyDistrictOwnership(req, volunteer, 'Volunteer');

  const userId = volunteer.userId;
  await Volunteer.findByIdAndDelete(req.params.id);

  const user = await User.findById(userId);
  if (user && user.role === 'volunteer') {
    await User.findByIdAndUpdate(userId, { role: 'citizen' });
  }

  if (req.io) {
    req.io.emit('volunteer:deleted', {
      _id: req.params.id,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Volunteer removed.' });
});

export const unregisterVolunteer = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const volunteer = await Volunteer.findOne({ userId: req.user._id });
  if (!volunteer) {
    throw new AppError('You are not registered as a volunteer.', 404);
  }

  await Volunteer.findByIdAndDelete(volunteer._id);

  const user = await User.findById(req.user._id);
  if (user && user.role === 'volunteer') {
    await User.findByIdAndUpdate(req.user._id, { role: 'citizen' });
  }

  res.json({ success: true, message: 'Unregistered as volunteer.' });
});

// ---- RESCUE TEAMS ----
export const getRescueTeams = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, vehicleType, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 100 } = req.query;
  let filter: any = {};
  if (status) filter.status = status;
  if (vehicleType) filter.vehicleType = vehicleType;

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { contactPhone: searchRegex },
      { vehicleType: searchRegex },
      { specialization: searchRegex },
    ];
  }

  filter = applyDistrictScope(req as any, filter);

  const sortOptions: any = {};
  sortOptions[String(sortBy)] = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  const teams = await RescueTeam.find(filter)
    .populate('leader', 'name email phone')
    .populate('members', 'name email')
    .populate('assignedDisaster', 'title type')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sortOptions);

  const total = await RescueTeam.countDocuments(filter);
  res.json({ success: true, total, page: +page, teams });
});

export const getNearestTeams = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radiusKm = 50, status = 'available' } = req.query;

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

  queryFilter = applyDistrictScope(req as any, queryFilter);

  let teams = [];
  try {
    teams = await RescueTeam.find(queryFilter)
      .populate('leader', 'name email phone')
      .populate('members', 'name email')
      .populate('assignedDisaster', 'title type')
      .limit(50);
  } catch (err) {}

  // Fallback: If 0 teams found within strict radius or coordinates not set, return available rescue teams
  if (teams.length === 0) {
    let fallbackFilter: any = {};
    if (status && status !== 'all') fallbackFilter.status = status;
    fallbackFilter = applyDistrictScope(req as any, fallbackFilter);
    teams = await RescueTeam.find(fallbackFilter)
      .populate('leader', 'name email phone')
      .populate('members', 'name email')
      .populate('assignedDisaster', 'title type')
      .limit(50);
  }

  const results = teams.map((team) => {
    const tObj = team.toObject();
    let distanceKm = undefined;
    if (team.location && typeof team.location.lat === 'number' && typeof team.location.lng === 'number' && (team.location.lat !== 0 || team.location.lng !== 0)) {
      const dLat = (team.location.lat - latitude) * (Math.PI / 180);
      const dLng = (team.location.lng - longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latitude * (Math.PI / 180)) *
          Math.cos(team.location.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = Math.round(6371 * c * 10) / 10;
    }
    return { ...tObj, distanceKm };
  });

  results.sort((a, b) => {
    if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
    if (a.distanceKm !== undefined) return -1;
    if (b.distanceKm !== undefined) return 1;
    return 0;
  });

  res.json({ success: true, count: results.length, teams: results });
});

export const createRescueTeam = asyncHandler(async (req: any, res: Response): Promise<void> => {
  req.body = enforceDistrictCreation(req, req.body);
  const { countryCode = '+91', contactPhone, location } = req.body;
  if (contactPhone !== undefined) {
    const phoneErr = validatePhoneBackend(countryCode, contactPhone, true);
    if (phoneErr) {
      throw new AppError(phoneErr, 400);
    }
  }
  const geo = (location && typeof location.lat === 'number' && typeof location.lng === 'number') 
    ? { type: 'Point', coordinates: [location.lng, location.lat] } 
    : undefined;

  const team = await RescueTeam.create({ ...req.body, geo, leader: req.user._id });

  if (req.io) {
    req.io.emit('team:created', {
      ...team.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.status(201).json({ success: true, message: 'Rescue team created.', team });
});

export const updateRescueTeam = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await RescueTeam.findById(req.params.id);
  if (!existing) {
    throw new AppError('Team not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Rescue Team');

  const { countryCode = '+91', contactPhone, location } = req.body;
  if (contactPhone !== undefined) {
    const phoneErr = validatePhoneBackend(countryCode, contactPhone, true);
    if (phoneErr) {
      throw new AppError(phoneErr, 400);
    }
  }
  if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
    req.body.geo = { type: 'Point', coordinates: [location.lng, location.lat] };
  }

  const team = await RescueTeam.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (req.io) {
    req.io.emit('team:updated', {
      ...team!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Rescue team updated.', team });
});

export const deleteRescueTeam = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const team = await RescueTeam.findById(req.params.id);
  if (!team) {
    throw new AppError('Team not found.', 404);
  }
  verifyDistrictOwnership(req, team, 'Rescue Team');

  await RescueTeam.findByIdAndDelete(req.params.id);

  if (req.io) {
    req.io.emit('team:deleted', {
      _id: req.params.id,
      name: team.name,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Rescue team removed.' });
});
