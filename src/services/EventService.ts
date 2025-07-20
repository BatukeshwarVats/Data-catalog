import { EventRepository } from '../repositories/EventRepository';
import { Event } from '../entities/Event';
import { 
  CreateEventDto, 
  UpdateEventDto, 
  EventFilter, 
  PaginationOptions, 
  PaginatedResponse,
  ServiceResponse 
} from '../types';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError, 
  UniqueConstraintError 
} from '../utils/errors';
import logger from '../config/logger';

export class EventService {
  private eventRepository: EventRepository;

  constructor() {
    this.eventRepository = new EventRepository();
  }

  async createEvent(data: CreateEventDto): Promise<ServiceResponse<Event>> {
    try {
      // Check if event with same name and type already exists
      const existingEvent = await this.eventRepository.findByNameAndType(data.name, data.type);
      
      if (existingEvent) {
        throw new UniqueConstraintError('Event', `${data.name}:${data.type}`);
      }

      // Set create_time if not provided
      const eventData = {
        ...data,
        create_time: data.create_time || new Date()
      };

      const event = await this.eventRepository.create(eventData);
      
      logger.info(`Event created successfully: ${event.id}`, {
        eventId: event.id,
        name: event.name,
        type: event.type
      });

      return {
        success: true,
        data: event
      };
    } catch (error) {
      logger.error('Error creating event:', error);
      return {
        success: false,
        error: {
          code: 'CREATE_EVENT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async getEventById(id: string): Promise<ServiceResponse<Event>> {
    try {
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        throw new NotFoundError('Event');
      }

      return {
        success: true,
        data: event
      };
    } catch (error) {
      logger.error(`Error getting event by ID: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'GET_EVENT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async getAllEvents(
    filter: EventFilter = {}, 
    pagination: PaginationOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<Event>>> {
    try {
      const events = await this.eventRepository.findByFilter(filter);
      
      // Manual pagination since we're using filter
      const { page = 1, limit = 10 } = pagination;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = events.slice(startIndex, endIndex);
      
      const result: PaginatedResponse<Event> = {
        data: paginatedEvents,
        pagination: {
          page,
          limit,
          total: events.length,
          pages: Math.ceil(events.length / limit)
        }
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Error getting all events:', error);
      return {
        success: false,
        error: {
          code: 'GET_ALL_EVENTS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async updateEvent(id: string, data: UpdateEventDto): Promise<ServiceResponse<Event>> {
    try {
      const existingEvent = await this.eventRepository.findById(id);
      
      if (!existingEvent) {
        throw new NotFoundError('Event');
      }

      // Check for unique constraint if name or type is being updated
      if (data.name || data.type) {
        const nameToCheck = data.name || existingEvent.name;
        const typeToCheck = data.type || existingEvent.type;
        
        const conflictingEvent = await this.eventRepository.findByNameAndTypeExcludingId(
          nameToCheck, 
          typeToCheck, 
          id
        );
        
        if (conflictingEvent) {
          throw new UniqueConstraintError('Event', `${nameToCheck}:${typeToCheck}`);
        }
      }

      const updatedEvent = await this.eventRepository.update(id, data);
      
      logger.info(`Event updated successfully: ${id}`, {
        eventId: id,
        updatedFields: Object.keys(data)
      });

      return {
        success: true,
        data: updatedEvent!
      };
    } catch (error) {
      logger.error(`Error updating event: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'UPDATE_EVENT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async deleteEvent(id: string): Promise<ServiceResponse<void>> {
    try {
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        throw new NotFoundError('Event');
      }

      await this.eventRepository.softDelete(id);
      
      logger.info(`Event deleted successfully: ${id}`, {
        eventId: id,
        name: event.name,
        type: event.type
      });

      return {
        success: true
      };
    } catch (error) {
      logger.error(`Error deleting event: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'DELETE_EVENT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async searchEvents(searchTerm: string): Promise<ServiceResponse<Event[]>> {
    try {
      const events = await this.eventRepository.searchByName(searchTerm);
      
      return {
        success: true,
        data: events
      };
    } catch (error) {
      logger.error(`Error searching events: ${searchTerm}`, error);
      return {
        success: false,
        error: {
          code: 'SEARCH_EVENTS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  // Internal method used by TrackingPlanService
  async findOrCreateEvent(data: CreateEventDto): Promise<Event> {
    const existingEvent = await this.eventRepository.findByNameAndType(data.name, data.type);
    
    if (existingEvent) {
      // Check if description matches
      if (existingEvent.description !== data.description) {
        throw new ConflictError(
          `Event '${data.name}' of type '${data.type}' already exists with different description`
        );
      }
      return existingEvent;
    }

    return this.eventRepository.create({
      ...data,
      create_time: data.create_time || new Date()
    });
  }
} 