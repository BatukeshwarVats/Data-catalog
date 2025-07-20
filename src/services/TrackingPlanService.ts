import { AppDataSource } from '../config/database';
import { TrackingPlanRepository } from '../repositories/TrackingPlanRepository';
import { EventService } from './EventService';
import { PropertyService } from './PropertyService';
import { TrackingPlan } from '../entities/TrackingPlan';
import { TrackingPlanEvent } from '../entities/TrackingPlanEvent';
import { EventProperty } from '../entities/EventProperty';
import { 
  CreateTrackingPlanDto, 
  UpdateTrackingPlanDto, 
  TrackingPlanFilter, 
  PaginationOptions, 
  PaginatedResponse,
  ServiceResponse,
  TrackingPlanResponseDto 
} from '../types';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError, 
  UniqueConstraintError 
} from '../utils/errors';
import logger from '../config/logger';

export class TrackingPlanService {
  private trackingPlanRepository: TrackingPlanRepository;
  private eventService: EventService;
  private propertyService: PropertyService;

  constructor() {
    this.trackingPlanRepository = new TrackingPlanRepository();
    this.eventService = new EventService();
    this.propertyService = new PropertyService();
  }

  async createTrackingPlan(data: CreateTrackingPlanDto): Promise<ServiceResponse<TrackingPlanResponseDto>> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if tracking plan with same name already exists
      const existingPlan = await this.trackingPlanRepository.findByName(data.name);
      if (existingPlan) {
        throw new UniqueConstraintError('TrackingPlan', data.name);
      }

      // Create tracking plan
      const trackingPlanData = {
        name: data.name,
        description: data.description,
        create_time: data.create_time || new Date()
      };

      const trackingPlan = await this.trackingPlanRepository.create(trackingPlanData);

      // Process events and their properties
      const createdEvents = [];
      
      for (const eventData of data.events) {
        // Find or create event
        const event = await this.eventService.findOrCreateEvent({
          name: eventData.name,
          type: eventData.type,
          description: eventData.description,
          create_time: data.create_time
        });

        // Create tracking plan event relationship
        const trackingPlanEventRepo = queryRunner.manager.getRepository(TrackingPlanEvent);
        const trackingPlanEvent = trackingPlanEventRepo.create({
          tracking_plan_id: trackingPlan.id,
          event_id: event.id,
          additional_properties: eventData.additionalProperties
        });
        await trackingPlanEventRepo.save(trackingPlanEvent);

        // Process properties for this event
        const createdProperties = [];
        
        for (const propertyData of eventData.properties) {
          // Find or create property
          const property = await this.propertyService.findOrCreateProperty({
            name: propertyData.name,
            type: propertyData.type,
            description: propertyData.description,
            validation_rules: propertyData.validation_rules,
            create_time: data.create_time
          });

          // Create event property relationship
          const eventPropertyRepo = queryRunner.manager.getRepository(EventProperty);
          const eventProperty = eventPropertyRepo.create({
            tracking_plan_event_id: trackingPlanEvent.id,
            property_id: property.id,
            required: propertyData.required
          });
          await eventPropertyRepo.save(eventProperty);

          createdProperties.push({
            id: property.id,
            name: property.name,
            type: property.type,
            description: property.description,
            required: propertyData.required,
            validation_rules: property.validation_rules || undefined
          });
        }

        createdEvents.push({
          id: event.id,
          name: event.name,
          type: event.type,
          description: event.description,
          additionalProperties: eventData.additionalProperties,
          properties: createdProperties
        });
      }

      await queryRunner.commitTransaction();

      const response: TrackingPlanResponseDto = {
        id: trackingPlan.id,
        name: trackingPlan.name,
        description: trackingPlan.description,
        create_time: trackingPlan.create_time,
        update_time: trackingPlan.update_time,
        is_deleted: trackingPlan.is_deleted,
        deleted_at: trackingPlan.deleted_at || undefined,
        events: createdEvents
      };

      logger.info(`TrackingPlan created successfully: ${trackingPlan.id}`, {
        trackingPlanId: trackingPlan.id,
        name: trackingPlan.name,
        eventsCount: createdEvents.length
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Error creating tracking plan:', error);
      return {
        success: false,
        error: {
          code: 'CREATE_TRACKING_PLAN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    } finally {
      await queryRunner.release();
    }
  }

  async getTrackingPlanById(id: string): Promise<ServiceResponse<TrackingPlanResponseDto>> {
    try {
      const trackingPlan = await this.trackingPlanRepository.findWithEvents(id);
      
      if (!trackingPlan) {
        throw new NotFoundError('TrackingPlan');
      }

      const response = this.mapToResponseDto(trackingPlan);

      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error(`Error getting tracking plan by ID: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'GET_TRACKING_PLAN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async getAllTrackingPlans(
    filter: TrackingPlanFilter = {}, 
    pagination: PaginationOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<TrackingPlanResponseDto>>> {
    try {
      const trackingPlans = await this.trackingPlanRepository.findByFilter(filter);
      
      // Manual pagination since we're using filter
      const { page = 1, limit = 10 } = pagination;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPlans = trackingPlans.slice(startIndex, endIndex);
      
      // Load events for paginated plans
      const plansWithEvents = await Promise.all(
        paginatedPlans.map(async (plan) => {
          const fullPlan = await this.trackingPlanRepository.findWithEvents(plan.id);
          return fullPlan ? this.mapToResponseDto(fullPlan) : null;
        })
      );

      const result: PaginatedResponse<TrackingPlanResponseDto> = {
        data: plansWithEvents.filter(Boolean) as TrackingPlanResponseDto[],
        pagination: {
          page,
          limit,
          total: trackingPlans.length,
          pages: Math.ceil(trackingPlans.length / limit)
        }
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Error getting all tracking plans:', error);
      return {
        success: false,
        error: {
          code: 'GET_ALL_TRACKING_PLANS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async updateTrackingPlan(id: string, data: UpdateTrackingPlanDto): Promise<ServiceResponse<TrackingPlanResponseDto>> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingPlan = await this.trackingPlanRepository.findById(id);
      
      if (!existingPlan) {
        throw new NotFoundError('TrackingPlan');
      }

      // Check for unique constraint if name is being updated
      if (data.name && data.name !== existingPlan.name) {
        const conflictingPlan = await this.trackingPlanRepository.findByNameExcludingId(data.name, id);
        if (conflictingPlan) {
          throw new UniqueConstraintError('TrackingPlan', data.name);
        }
      }

      // Update tracking plan basic info
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.description) updateData.description = data.description;

      if (Object.keys(updateData).length > 0) {
        await this.trackingPlanRepository.update(id, updateData);
      }

      // If events are provided, update the relationships
      if (data.events) {
        // Soft delete existing relationships
        const trackingPlanEventRepo = queryRunner.manager.getRepository(TrackingPlanEvent);
        const eventPropertyRepo = queryRunner.manager.getRepository(EventProperty);

        await trackingPlanEventRepo.update(
          { tracking_plan_id: id },
          { is_deleted: true, deleted_at: new Date() }
        );

        // Process new events
        for (const eventData of data.events) {
          const event = await this.eventService.findOrCreateEvent({
            name: eventData.name,
            type: eventData.type,
            description: eventData.description
          });

          const trackingPlanEvent = trackingPlanEventRepo.create({
            tracking_plan_id: id,
            event_id: event.id,
            additional_properties: eventData.additionalProperties
          });
          await trackingPlanEventRepo.save(trackingPlanEvent);

          // Process properties
          for (const propertyData of eventData.properties) {
            const property = await this.propertyService.findOrCreateProperty({
              name: propertyData.name,
              type: propertyData.type,
              description: propertyData.description,
              validation_rules: propertyData.validation_rules
            });

            const eventProperty = eventPropertyRepo.create({
              tracking_plan_event_id: trackingPlanEvent.id,
              property_id: property.id,
              required: propertyData.required
            });
            await eventPropertyRepo.save(eventProperty);
          }
        }
      }

      await queryRunner.commitTransaction();

      // Fetch updated tracking plan
      const updatedPlan = await this.trackingPlanRepository.findWithEvents(id);
      const response = this.mapToResponseDto(updatedPlan!);

      logger.info(`TrackingPlan updated successfully: ${id}`, {
        trackingPlanId: id,
        updatedFields: Object.keys(data)
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error(`Error updating tracking plan: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'UPDATE_TRACKING_PLAN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTrackingPlan(id: string): Promise<ServiceResponse<void>> {
    try {
      const trackingPlan = await this.trackingPlanRepository.findById(id);
      
      if (!trackingPlan) {
        throw new NotFoundError('TrackingPlan');
      }

      await this.trackingPlanRepository.softDelete(id);
      
      logger.info(`TrackingPlan deleted successfully: ${id}`, {
        trackingPlanId: id,
        name: trackingPlan.name
      });

      return {
        success: true
      };
    } catch (error) {
      logger.error(`Error deleting tracking plan: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'DELETE_TRACKING_PLAN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  private mapToResponseDto(trackingPlan: TrackingPlan): TrackingPlanResponseDto {
    const events = trackingPlan.trackingPlanEvents
      ?.filter(tpe => !tpe.is_deleted)
      .map(tpe => ({
        id: tpe.event.id,
        name: tpe.event.name,
        type: tpe.event.type,
        description: tpe.event.description,
        additionalProperties: tpe.additional_properties,
        properties: tpe.eventProperties
          ?.filter(ep => !ep.is_deleted)
          .map(ep => ({
            id: ep.property.id,
            name: ep.property.name,
            type: ep.property.type,
            description: ep.property.description,
            required: ep.required,
            validation_rules: ep.property.validation_rules || undefined
          })) || []
      })) || [];

    return {
      id: trackingPlan.id,
      name: trackingPlan.name,
      description: trackingPlan.description,
      create_time: trackingPlan.create_time,
      update_time: trackingPlan.update_time,
      is_deleted: trackingPlan.is_deleted,
      deleted_at: trackingPlan.deleted_at || undefined,
      events
    };
  }
} 