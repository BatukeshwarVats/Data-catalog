import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.constructor.name,
        message: error.message
      }
    });
  }

  // Handle specific database errors
  if (error.name === 'QueryFailedError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database query failed'
      }
    });
  }

  // Handle TypeORM unique constraint violations
  if (error.message.includes('duplicate key value') || error.message.includes('UNIQUE constraint')) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'UNIQUE_CONSTRAINT_ERROR',
        message: 'Resource already exists'
      }
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 