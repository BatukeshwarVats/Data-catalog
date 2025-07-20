import { Request, Response } from 'express';
import { PropertyService } from '../services/PropertyService';
import { PropertyFilter, PaginationOptions } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/errors';

export class PropertyController {
  private propertyService: PropertyService;

  constructor() {
    this.propertyService = new PropertyService();
  }

  createProperty = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.propertyService.createProperty(req.body);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 400);
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  });

  getPropertyById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.propertyService.getPropertyById(id);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 404);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  });

  getAllProperties = asyncHandler(async (req: Request, res: Response) => {
    const filter: PropertyFilter = {
      name: req.query.name as string,
      type: req.query.type as any,
      description: req.query.description as string
    };

    const pagination: PaginationOptions = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };

    const result = await this.propertyService.getAllProperties(filter, pagination);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 500);
    }

    res.status(200).json({
      success: true,
      data: result.data?.data,
      pagination: result.data?.pagination
    });
  });

  updateProperty = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.propertyService.updateProperty(id, req.body);
    
    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  });

  deleteProperty = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.propertyService.deleteProperty(id);
    
    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode);
    }

    res.status(204).send();
  });

  searchProperties = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    
    if (!q) {
      throw new AppError('Search query parameter "q" is required', 400);
    }

    const result = await this.propertyService.searchProperties(q as string);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 500);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  });
} 