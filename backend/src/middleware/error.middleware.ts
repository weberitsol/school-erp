import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  errors?: any[];
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

// Custom error class
export class AppError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error creators
export const BadRequestError = (message: string, errors?: any[]) =>
  new AppError(message, 400, errors);

export const UnauthorizedError = (message: string = 'Unauthorized') =>
  new AppError(message, 401);

export const ForbiddenError = (message: string = 'Forbidden') =>
  new AppError(message, 403);

export const NotFoundError = (message: string = 'Resource not found') =>
  new AppError(message, 404);

export const ConflictError = (message: string) =>
  new AppError(message, 409);

export const InternalError = (message: string = 'Internal server error') =>
  new AppError(message, 500);
