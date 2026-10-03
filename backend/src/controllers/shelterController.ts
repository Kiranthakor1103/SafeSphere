import { Request, Response } from 'express';
import Shelter from '../models/Shelter';
import { applyDistrictScope, enforceDistrictCreation, verifyDistrictOwnership } from '../utils/districtScope';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { validatePhoneBackend } from '../utils/phoneValidator';

export const getShelters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, type, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 100 } = req.query;
  let filter: any = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { contactPerson: searchRegex },
      { contactPhone: searchRegex },
      { 'location.address': searchRegex },
    ];
  }

  filter = applyDistrictScope(req as any, filter);

  const sortOptions: any = {};
  sortOptions[String(sortBy)] = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  const shelters = await Shelter.find(filter)
    .populate('managedBy', 'name email phone')
    .populate('disasterId', 'title')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sortOptions);

  const total = await Shelter.countDocuments(filter);
  res.json({ success: true, total, page: +page, shelters });
});

export const getShelter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const shelter = await Shelter.findById(req.params.id).populate('managedBy', 'name email phone');
  if (!shelter) {
    throw new AppError('Shelter not found.', 404);
  }
  verifyDistrictOwnership(req as any, shelter, 'Shelter');

  res.json({ success: true, shelter });
});

export const getNearestShelters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radiusKm = 20, status = 'open' } = req.query;

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

  const shelters = await Shelter.find(queryFilter)
    .populate('managedBy', 'name email phone')
    .limit(50);

  const results = shelters.map((shelter) => {
    const sObj = shelter.toObject();
    const dLat = (shelter.location.lat - latitude) * (Math.PI / 180);
    const dLng = (shelter.location.lng - longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latitude * (Math.PI / 180)) *
        Math.cos(shelter.location.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(6371 * c * 10) / 10;
    return { ...sObj, distanceKm };
  });

  res.json({ success: true, count: results.length, shelters: results });
});

export const createShelter = asyncHandler(async (req: any, res: Response): Promise<void> => {
  req.body = enforceDistrictCreation(req, req.body);
  const { countryCode = '+91', contactPhone, location } = req.body;
  if (contactPhone) {
    const phoneErr = validatePhoneBackend(countryCode, contactPhone, false);
    if (phoneErr) {
      throw new AppError(phoneErr, 400);
    }
  }
  const geo = (location && typeof location.lat === 'number' && typeof location.lng === 'number') 
    ? { type: 'Point', coordinates: [location.lng, location.lat] } 
    : undefined;

  const shelter = await Shelter.create({ ...req.body, geo, managedBy: req.user._id });

  if (req.io) {
    req.io.emit('shelter:created', {
      ...shelter.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.status(201).json({ success: true, message: 'Shelter created.', shelter });
});

export const updateShelter = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await Shelter.findById(req.params.id);
  if (!existing) {
    throw new AppError('Shelter not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Shelter');

  const { countryCode = '+91', contactPhone, location } = req.body;
  if (contactPhone) {
    const phoneErr = validatePhoneBackend(countryCode, contactPhone, false);
    if (phoneErr) {
      throw new AppError(phoneErr, 400);
    }
  }
  if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
    req.body.geo = { type: 'Point', coordinates: [location.lng, location.lat] };
  }

  const shelter = await Shelter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  if (req.io) {
    req.io.emit('shelter:updated', {
      ...shelter!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Shelter updated.', shelter });
});

export const deleteShelter = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) {
    throw new AppError('Shelter not found.', 404);
  }
  verifyDistrictOwnership(req, shelter, 'Shelter');

  await Shelter.findByIdAndDelete(req.params.id);

  if (req.io) {
    req.io.emit('shelter:deleted', {
      _id: req.params.id,
      name: shelter.name,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Shelter removed.' });
});
