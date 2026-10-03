import { Request, Response } from 'express';
import Disaster from '../models/Disaster';
import { applyDistrictScope, enforceDistrictCreation, verifyDistrictOwnership } from '../utils/districtScope';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

export const getDisasters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, type, severity, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 100 } = req.query;
  let filter: any = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (severity) filter.severity = severity;

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { affectedArea: searchRegex },
      { 'location.address': searchRegex },
    ];
  }

  filter = applyDistrictScope(req as any, filter);

  const sortOptions: any = {};
  const sortField = String(sortBy);
  sortOptions[sortField] = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  const disasters = await Disaster.find(filter)
    .populate('reportedBy', 'name email')
    .populate('assignedTeams', 'name status')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sortOptions);

  const total = await Disaster.countDocuments(filter);
  res.json({ success: true, total, page: +page, disasters });
});

export const getDisaster = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const disaster = await Disaster.findById(req.params.id)
    .populate('reportedBy', 'name email phone')
    .populate('assignedTeams')
    .populate('resources');

  if (!disaster) {
    throw new AppError('Disaster not found.', 404);
  }
  verifyDistrictOwnership(req as any, disaster, 'Disaster');

  res.json({ success: true, disaster });
});

export const createDisaster = asyncHandler(async (req: any, res: Response): Promise<void> => {
  req.body = enforceDistrictCreation(req, req.body);
  const disaster = await Disaster.create({ ...req.body, reportedBy: req.user._id });
  const populated = await Disaster.findById(disaster._id)
    .populate('reportedBy', 'name email')
    .populate('assignedTeams', 'name status');

  if (req.io) {
    const disasterObj = populated ? populated.toObject() : disaster.toObject();
    req.io.emit('disaster:created', {
      ...disasterObj,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.status(201).json({ success: true, message: 'Disaster created.', disaster: populated || disaster });
});

export const updateDisaster = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await Disaster.findById(req.params.id);
  if (!existing) {
    throw new AppError('Disaster not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Disaster');

  const disaster = await Disaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('reportedBy', 'name email')
    .populate('assignedTeams', 'name status');

  if (req.io) {
    req.io.emit('disaster:updated', {
      ...disaster!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Disaster updated.', disaster });
});

export const deleteDisaster = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await Disaster.findById(req.params.id);
  if (!existing) {
    throw new AppError('Disaster not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Disaster');

  await Disaster.findByIdAndDelete(req.params.id);

  if (req.io) {
    req.io.emit('disaster:deleted', {
      _id: req.params.id,
      title: existing.title,
      type: existing.type,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Disaster deleted.' });
});
