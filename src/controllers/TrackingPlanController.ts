import { Request, Response } from 'express';
import { TrackingPlanService } from '../services/TrackingPlanService';
import { TrackingPlanFilter, PaginationOptions } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/errors';

export class TrackingPlanController {
  private trackingPlanService: TrackingPlanService;

  constructor() {
    this.trackingPlanService = new TrackingPlanService();
  }

  createTrackingPlan = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.trackingPlanService.createTrackingPlan(req.body);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 400);
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  });

  getTrackingPlanById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.trackingPlanService.getTrackingPlanById(id);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 404);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  });

  getAllTrackingPlans = asyncHandler(async (req: Request, res: Response) => {
    const filter: TrackingPlanFilter = {
      name: req.query.name as string,
      description: req.query.description as string
    };

    const pagination: PaginationOptions = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };

    const result = await this.trackingPlanService.getAllTrackingPlans(filter, pagination);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 500);
    }

    res.status(200).json({
      success: true,
      data: result.data?.data,
      pagination: result.data?.pagination
    });
  });

  updateTrackingPlan = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.trackingPlanService.updateTrackingPlan(id, req.body);
    
    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  });

  deleteTrackingPlan = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.trackingPlanService.deleteTrackingPlan(id);
    
    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode);
    }

    res.status(204).send();
  });
} 