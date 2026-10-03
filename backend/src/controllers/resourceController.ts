import { Request, Response } from 'express';
import Resource from '../models/Resource';
import { applyDistrictScope, enforceDistrictCreation, verifyDistrictOwnership } from '../utils/districtScope';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

export const getResources = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { type, status, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 100 } = req.query;
  let filter: any = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { type: searchRegex },
      { providedBy: searchRegex },
      { 'location.address': searchRegex },
    ];
  }

  filter = applyDistrictScope(req as any, filter);

  const sortOptions: any = {};
  sortOptions[String(sortBy)] = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  const resources = await Resource.find(filter)
    .populate('disasterId', 'title')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sortOptions);

  const total = await Resource.countDocuments(filter);
  res.json({ success: true, total, page: +page, resources });
});

export const createResource = asyncHandler(async (req: any, res: Response): Promise<void> => {
  req.body = enforceDistrictCreation(req, req.body);
  const resource = await Resource.create(req.body);

  if (req.io) {
    req.io.emit('resource:created', {
      ...resource.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.status(201).json({ success: true, message: 'Resource added.', resource });
});

export const updateResource = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await Resource.findById(req.params.id);
  if (!existing) {
    throw new AppError('Resource not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Resource');

  const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (req.io) {
    req.io.emit('resource:updated', {
      ...resource!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Resource updated.', resource });
});

export const deleteResource = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw new AppError('Resource not found.', 404);
  }
  verifyDistrictOwnership(req, resource, 'Resource');

  await Resource.findByIdAndDelete(req.params.id);

  if (req.io) {
    req.io.emit('resource:deleted', {
      _id: req.params.id,
      name: resource.name,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Resource removed.' });
});
