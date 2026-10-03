import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { hasPermission, normalizeRole, type Action, type Module } from '../config/permissions';
import { ENV } from '../config/env';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
      return;
    }

    const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or account disabled.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized. Invalid token.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;
    const normalizedRole = normalizeRole(userRole);
    const isAllowed = roles.some(r => r === userRole || (normalizedRole && r === normalizedRole) || (r === 'admin' && normalizedRole === 'super_admin') || (r === 'ngo' && normalizedRole === 'district_admin'));

    if (!req.user || !isAllowed) {
      res.status(403).json({
        success: false,
        message: `Role '${userRole}' is not authorized to access this resource.`
      });
      return;
    }
    next();
  };
};

export const authorizePermission = (module: Module, action: Action) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!hasPermission(req.user?.role, module, action)) {
      res.status(403).json({ success: false, message: `You do not have permission to ${action} ${module}.` });
      return;
    }
    next();
  };
};
