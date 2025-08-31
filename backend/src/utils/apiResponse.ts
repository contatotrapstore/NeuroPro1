import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Utility functions for standardized API responses
 * Eliminates code duplication across controllers
 */

export class ApiResponseHelper {
  /**
   * Send a successful response
   */
  static sendSuccess<T>(
    res: Response, 
    data?: T, 
    message?: string, 
    status: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    return res.status(status).json(response);
  }

  /**
   * Send an error response
   */
  static sendError(
    res: Response, 
    error: string, 
    status: number = 400,
    details?: any
  ): Response {
    const response: ApiResponse<null> = {
      success: false,
      error,
      ...(details && { details })
    };
    return res.status(status).json(response);
  }

  /**
   * Send validation error response
   */
  static sendValidationError(
    res: Response, 
    message: string = 'Dados de entrada inválidos',
    validationErrors?: any
  ): Response {
    return this.sendError(res, message, 422, validationErrors);
  }

  /**
   * Send unauthorized error
   */
  static sendUnauthorized(
    res: Response, 
    message: string = 'Não autorizado'
  ): Response {
    return this.sendError(res, message, 401);
  }

  /**
   * Send forbidden error
   */
  static sendForbidden(
    res: Response, 
    message: string = 'Acesso negado'
  ): Response {
    return this.sendError(res, message, 403);
  }

  /**
   * Send not found error
   */
  static sendNotFound(
    res: Response, 
    message: string = 'Recurso não encontrado'
  ): Response {
    return this.sendError(res, message, 404);
  }

  /**
   * Send internal server error
   */
  static sendInternalError(
    res: Response, 
    message: string = 'Erro interno do servidor',
    error?: any
  ): Response {
    // Log the actual error for debugging
    if (error) {
      console.error('Internal Server Error:', error);
    }
    
    return this.sendError(res, message, 500);
  }

  /**
   * Send conflict error
   */
  static sendConflict(
    res: Response, 
    message: string = 'Conflito de dados'
  ): Response {
    return this.sendError(res, message, 409);
  }

  /**
   * Send too many requests error
   */
  static sendTooManyRequests(
    res: Response, 
    message: string = 'Muitas tentativas'
  ): Response {
    return this.sendError(res, message, 429);
  }
}

// Export shorthand functions for common use cases
export const sendSuccess = ApiResponseHelper.sendSuccess;
export const sendError = ApiResponseHelper.sendError;
export const sendValidationError = ApiResponseHelper.sendValidationError;
export const sendUnauthorized = ApiResponseHelper.sendUnauthorized;
export const sendForbidden = ApiResponseHelper.sendForbidden;
export const sendNotFound = ApiResponseHelper.sendNotFound;
export const sendInternalError = ApiResponseHelper.sendInternalError;
export const sendConflict = ApiResponseHelper.sendConflict;
export const sendTooManyRequests = ApiResponseHelper.sendTooManyRequests;