import { Request, Response } from 'express';
import { EventService } from '../services/EventService';
import { EventFilter, PaginationOptions } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/errors';

export class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  createEvent = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.eventService.createEvent(req.body);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 400);
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  });

  getEventById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.eventService.getEventById(id);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 404);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  });

  getAllEvents = asyncHandler(async (req: Request, res: Response) => {
    const filter: EventFilter = {
      name: req.query.name as string,
      type: req.query.type as any,
      description: req.query.description as string
    };

    const pagination: PaginationOptions = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };

    const result = await this.eventService.getAllEvents(filter, pagination);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 500);
    }

    res.status(200).json({
      success: true,
      data: result.data?.data,
      pagination: result.data?.pagination
    });
  });

  updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.eventService.updateEvent(id, req.body);
    
    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  });

  deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.eventService.deleteEvent(id);
    
    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode);
    }

    res.status(204).send();
  });

  searchEvents = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    
    if (!q) {
      throw new AppError('Search query parameter "q" is required', 400);
    }

    const result = await this.eventService.searchEvents(q as string);
    
    if (!result.success) {
      throw new AppError(result.error!.message, 500);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  });
} 