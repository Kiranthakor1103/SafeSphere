import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { ENV } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { validatePhoneBackend } from '../utils/phoneValidator';

const checkPhoneFormat = (phone: string): void => {
  if (!phone) return;
  let countryCode = '+91';
  let contactPhone = '';
  const countryCodes = ['+91', '+1', '+44', '+61', '+971', '+65', '+81', '+49', '+33', '+86'];
  const matched = countryCodes.find(c => phone.startsWith(c));
  if (matched) {
    countryCode = matched;
    contactPhone = phone.slice(matched.length).trim();
  } else {
    const parts = phone.trim().split(' ');
    if (parts.length > 1 && parts[0].startsWith('+')) {
      countryCode = parts[0];
      contactPhone = parts.slice(1).join(' ');
    } else {
      contactPhone = phone;
    }
  }

  const phoneErr = validatePhoneBackend(countryCode, contactPhone, false);
  if (phoneErr) {
    throw new AppError(phoneErr, 400);
  }
};

const generateToken = (id: string): string => {
  return jwt.sign({ id }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  } as any);
};

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone, district, state, country } = req.body;

  checkPhoneFormat(phone);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered.', 400);
  }

  // Public registration must never grant an elevated role. Role changes are
  // performed only through the Super Admin user-management endpoints.
  const user = await User.create({ name, email, password, role: 'citizen', phone, district: district || '', state: state || 'Gujarat', country: country || 'India' });

  await AuditLog.create({
    action: 'USER_REGISTERED',
    userId: user._id,
    resource: 'User',
    resourceId: user._id,
    details: `New user registered: ${email}`
  });

  const token = generateToken((user._id as any).toString());
  const io = (req as any).io;
  if (io) {
    io.emit('user:created', {
      _id: user._id, name: user.name, email: user.email, role: user.role,
      district: user.district,
      performedBy: { name: user.name, email: user.email, role: user.role }
    });
  }
  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, district: user.district, districtCode: user.districtCode, state: user.state, country: user.country }
  });
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password.', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled.', 401);
  }

  await AuditLog.create({
    action: 'USER_LOGIN',
    userId: user._id,
    resource: 'User',
    resourceId: user._id,
    details: `User logged in: ${email}`
  });

  // Auto-generate districtCode on login if not yet set
  if (user.district && !user.districtCode) {
    await User.findByIdAndUpdate(user._id, { districtCode: user.districtCode });
  }

  const token = generateToken((user._id as any).toString());
  res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      district: user.district,
      districtCode: user.districtCode,
      state: user.state,
      country: user.country,
      location: user.location,
      profilePhoto: user.profilePhoto
    }
  });
});

export const getMe = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User profile not found.', 404);
  }
  res.json({ success: true, user });
});

export const updateMe = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User profile not found.', 404);
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.phone) {
    checkPhoneFormat(req.body.phone);
    user.phone = req.body.phone;
  }
  if (req.body.country !== undefined) user.country = req.body.country;
  if (req.body.state !== undefined) user.state = req.body.state;
  if (req.body.district !== undefined) user.district = req.body.district;

  if (req.file) {
    const host = req.get('host');
    const protocol = req.protocol;
    user.profilePhoto = `${protocol}://${host}/uploads/${req.file.filename}`;
  } else if (req.body.profilePhoto !== undefined) {
    user.profilePhoto = req.body.profilePhoto;
  }

  let locationData = req.body.location;
  if (typeof locationData === 'string') {
    try {
      locationData = JSON.parse(locationData);
    } catch (e) {
      // Ignore parsing errors
    }
  }

  if (locationData) {
    user.location = {
      lat: locationData.lat !== undefined ? Number(locationData.lat) : user.location.lat,
      lng: locationData.lng !== undefined ? Number(locationData.lng) : user.location.lng,
      address: locationData.address !== undefined ? locationData.address : user.location.address
    };
  }

  if (req.body.password) {
    if (req.body.password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }
    user.password = req.body.password;
  }

  await user.save();

  const io = (req as any).io;
  if (io) {
    io.emit('user:updated', {
      _id: user._id, name: user.name, email: user.email, role: user.role,
      district: user.district,
      performedBy: { name: user.name, email: user.email, role: user.role }
    });
  }

  await AuditLog.create({
    action: 'USER_PROFILE_UPDATED',
    userId: user._id,
    resource: 'User',
    resourceId: user._id,
    details: `User updated profile: ${user.email}`
  });

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      district: user.district,
      districtCode: user.districtCode,
      state: user.state,
      country: user.country,
      location: user.location,
      profilePhoto: user.profilePhoto
    }
  });
});

import { applyDistrictScope } from '../utils/districtScope';

export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { role, search, page = 1, limit = 20 } = req.query;
  // Super Admin accounts are never exposed through this management module.
  // `admin` is a legacy alias for super_admin and must be protected too.
  let filter: any = { role: { $nin: ['super_admin', 'admin'] } };
  if (role && role !== 'super_admin' && role !== 'admin') filter.role = role;
  if (search) {
    const searchExpression = new RegExp(String(search), 'i');
    filter.$or = [{ name: searchExpression }, { email: searchExpression }, { district: searchExpression }];
  }

  filter = applyDistrictScope(req as any, filter);

  const users = await User.find(filter)
    .select('-password')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);
  res.json({ success: true, total, page: +page, users });
});

const manageableRoles = ['district_admin', 'shelter_manager', 'rescue_team', 'volunteer', 'citizen', 'ngo'];

const findManageableUser = async (id: string) => {
  const user = await User.findOne({ _id: id, role: { $nin: ['super_admin', 'admin'] } }).select('+password');
  if (!user) {
    throw new AppError('User not found. Super Admin accounts cannot be managed here.', 404);
  }
  return user;
};

export const updateUserBySuperAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await findManageableUser(String(req.params.id));
  const { name, phone, country, state, district, role, isActive } = req.body;

  if (role !== undefined) {
    if (!manageableRoles.includes(role)) {
      throw new AppError('Invalid role. Super Admin cannot be assigned through this module.', 400);
    }
    user.role = role;
  }
  if (name !== undefined) user.name = name;
  if (phone !== undefined) {
    checkPhoneFormat(phone);
    user.phone = phone;
  }
  if (country !== undefined) user.country = country;
  if (state !== undefined) user.state = state;
  if (district !== undefined) user.district = district;
  if (typeof isActive === 'boolean') user.isActive = isActive;

  await user.save();
  await AuditLog.create({
    action: 'USER_MANAGED', userId: (req as any).user._id, resource: 'User', resourceId: user._id,
    details: `Super Admin updated user: ${user.email}`
  });

  const io = (req as any).io;
  if (io) {
    io.emit('user:updated', {
      _id: user._id, name: user.name, email: user.email, role: user.role,
      district: user.district,
      isActive: user.isActive,
      performedBy: { name: (req as any).user.name, email: (req as any).user.email, role: (req as any).user.role }
    });
  }

  res.json({ success: true, message: 'User updated successfully.', user: { ...user.toObject(), password: undefined } });
});

export const deleteUserBySuperAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await findManageableUser(String(req.params.id));
  await User.deleteOne({ _id: user._id });
  await AuditLog.create({
    action: 'USER_DELETED', userId: (req as any).user._id, resource: 'User', resourceId: user._id,
    details: `Super Admin deleted user: ${user.email}`
  });
  const io = (req as any).io;
  if (io) {
    io.emit('user:deleted', {
      _id: user._id, name: user.name, email: user.email,
      performedBy: { name: (req as any).user.name, email: (req as any).user.email, role: (req as any).user.role }
    });
  }
  res.json({ success: true, message: 'User deleted successfully.' });
});
