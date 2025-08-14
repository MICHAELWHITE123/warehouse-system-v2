import { Request, Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/database';

export abstract class BaseController {
  protected success<T>(res: Response, data: T, message?: string): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    res.json(response);
  }

  protected successPaginated<T>(res: Response, data: T[], pagination: any, message?: string): void {
    const response: PaginatedResponse<T> = {
      data,
      pagination
    };
    res.json(response);
  }

  protected error(res: Response, message: string, statusCode: number = 400, error?: string): void {
    const response: ApiResponse = {
      success: false,
      message,
      error
    };
    res.status(statusCode).json(response);
  }

  protected serverError(res: Response, error: Error): void {
    console.error('Controller error:', error);
    this.error(res, 'Internal server error', 500, error.message);
  }

  protected notFound(res: Response, resource: string = 'Resource'): void {
    this.error(res, `${resource} not found`, 404);
  }

  protected unauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.error(res, message, 401);
  }

  protected forbidden(res: Response, message: string = 'Forbidden'): void {
    this.error(res, message, 403);
  }

  protected getPagination(req: Request) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }
}
