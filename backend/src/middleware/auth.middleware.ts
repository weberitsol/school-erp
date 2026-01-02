import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        schoolId: string;
        studentId?: string;
        teacherId?: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    // Also check for token in query params (for file downloads where headers can't be set)
    const queryToken = req.query.token as string | undefined;

    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          schoolId: true,
          isActive: true,
          student: { select: { id: true } },
          teacher: { select: { id: true } },
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive.',
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        studentId: user.student?.id,
        teacherId: user.teacher?.id,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

// Middleware to check if user belongs to same school
export const sameSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { schoolId } = req.params;

    if (req.user && req.user.schoolId !== schoolId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your school data.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
