import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'candidate' | 'recruiter';
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const JWT_SECRET = process.env.JWT_SECRET || 'naukri_career_portal_secret_key_2026_jwt';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

export function requireRole(allowedRoles: Array<'candidate' | 'recruiter'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden. This action requires role: ${allowedRoles.join(' or ')}. Your role is: ${req.user.role}.`,
      });
    }

    next();
  };
}
