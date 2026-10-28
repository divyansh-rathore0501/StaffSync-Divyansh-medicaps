import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import type { Role } from '../types.js';

export const authorize = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] permissions. Current role: ${req.user.role}`
      });
    }

    next();
  };
};
