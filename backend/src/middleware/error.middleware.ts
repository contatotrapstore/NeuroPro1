import { Request, Response, NextFunction } from 'express';
import { isDevelopment } from '../config/env.validation';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string, 
    statusCode: number = 500, 
    isOperational: boolean = true, 
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handling middleware
 * Eliminates duplicated error handling across controllers
 */
export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let details: any = undefined;

  // Handle operational errors (known errors)
  if (error instanceof AppError && error.isOperational) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  }
  
  // Handle specific error types
  else if (error.name === 'ValidationError') {
    statusCode = 422;
    message = 'Dados de entrada inválidos';
    details = error.message;
  }
  
  else if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
    statusCode = 401;
    message = 'Não autorizado';
  }
  
  else if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
    statusCode = 403;
    message = 'Acesso negado';
  }
  
  else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
    statusCode = 404;
    message = 'Recurso não encontrado';
  }
  
  else if (error.name === 'ConflictError' || error.message.includes('conflict')) {
    statusCode = 409;
    message = 'Conflito de dados';
  }
  
  else if (error.name === 'TooManyRequestsError' || error.message.includes('too many')) {
    statusCode = 429;
    message = 'Muitas tentativas';
  }

  // Log error for debugging
  console.error('Error Handler:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    statusCode,
    message: error.message,
    stack: isDevelopment ? error.stack : undefined,
    userId: (req as any).user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Send response
  const response: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  // Include additional details in development
  if (isDevelopment) {
    response.details = details;
    response.stack = error.stack;
    response.originalMessage = error.message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Async error wrapper to catch async errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Endpoint não encontrado: ${req.method} ${req.originalUrl}`,
    404,
    true
  );
  next(error);
};

/**
 * Process exit handler for uncaught exceptions
 */
export const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', (err: Error) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err);
    console.error('Stack:', err.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (err: Error) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...', err);
    console.error('Stack:', err.stack);
    process.exit(1);
  });
};

// Export commonly used error constructors
export const createValidationError = (message: string, details?: any) => 
  new AppError(message, 422, true, details);

export const createUnauthorizedError = (message: string = 'Não autorizado') => 
  new AppError(message, 401, true);

export const createForbiddenError = (message: string = 'Acesso negado') => 
  new AppError(message, 403, true);

export const createNotFoundError = (message: string = 'Recurso não encontrado') => 
  new AppError(message, 404, true);

export const createConflictError = (message: string = 'Conflito de dados') => 
  new AppError(message, 409, true);

export const createTooManyRequestsError = (message: string = 'Muitas tentativas') => 
  new AppError(message, 429, true);