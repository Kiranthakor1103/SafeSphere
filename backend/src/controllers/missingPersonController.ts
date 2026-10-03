import { Request, Response } from 'express';
import MissingPerson from '../models/MissingPerson';
import { applyDistrictScope, enforceDistrictCreation, verifyDistrictOwnership } from '../utils/districtScope';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { validatePhoneBackend } from '../utils/phoneValidator';

export const getMissingPersons = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, gender, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 100 } = req.query;
  let filter: any = {};
  if (status) filter.status = status;
  if (gender) filter.gender = gender;

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { contactPerson: searchRegex },
      { contactPhone: searchRegex },
      { distinguishingFeatures: searchRegex },
      { description: searchRegex },
      { 'lastSeenLocation.address': searchRegex },
    ];
  }

  filter = applyDistrictScope(req as any, filter);

  const sortOptions: any = {};
  sortOptions[String(sortBy)] = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  const persons = await MissingPerson.find(filter)
    .populate('reportedBy', 'name email phone')
    .populate('disasterId', 'title')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sortOptions);

  const total = await MissingPerson.countDocuments(filter);
  res.json({ success: true, total, page: +page, persons });
});

export const createMissingPerson = asyncHandler(async (req: any, res: Response): Promise<void> => {
  req.body = enforceDistrictCreation(req, req.body);
  const { countryCode = '+91', contactPhone } = req.body;
  if (contactPhone) {
    const phoneErr = validatePhoneBackend(countryCode, contactPhone, false);
    if (phoneErr) {
      throw new AppError(phoneErr, 400);
    }
  }
  const person = await MissingPerson.create({ ...req.body, reportedBy: req.user._id });

  if (req.io) {
    req.io.emit('missingPerson:created', {
      ...person.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.status(201).json({ success: true, message: 'Missing person report filed.', person });
});

export const updateMissingPerson = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await MissingPerson.findById(req.params.id);
  if (!existing) {
    throw new AppError('Record not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Missing Person');

  const { countryCode = '+91', contactPhone } = req.body;
  if (contactPhone) {
    const phoneErr = validatePhoneBackend(countryCode, contactPhone, false);
    if (phoneErr) {
      throw new AppError(phoneErr, 400);
    }
  }
  const person = await MissingPerson.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('reportedBy', 'name email');

  if (req.io) {
    req.io.emit('missingPerson:updated', {
      ...person!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Record updated.', person });
});

export const deleteMissingPerson = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const person = await MissingPerson.findById(req.params.id);
  if (!person) {
    throw new AppError('Record not found.', 404);
  }
  verifyDistrictOwnership(req, person, 'Missing Person');

  await MissingPerson.findByIdAndDelete(req.params.id);

  if (req.io) {
    req.io.emit('missingPerson:deleted', {
      _id: req.params.id,
      name: person.name,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
    req.io.emit('stats:updated');
  }

  res.json({ success: true, message: 'Record deleted.' });
});
