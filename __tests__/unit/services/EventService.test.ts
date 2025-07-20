import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventService } from '../../../src/services/EventService';
import { EventRepository } from '../../../src/repositories/EventRepository';
import { mockEventRepository, createMockEvent } from '../../mocks/repositories';
import { CreateEventDto, EventType } from '../../../src/types';
import { ConflictError, UniqueConstraintError } from '../../../src/utils/errors';

// Mock the EventRepository
vi.mock('../../../src/repositories/EventRepository');

describe('EventService - Complex Business Logic', () => {
  let eventService: EventService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(EventRepository).mockImplementation(() => mockEventRepository as any);
    eventService = new EventService();
  });

  describe('findOrCreateEvent - Auto-Creation Logic', () => {
    it('should create new event when it does not exist', async () => {
      // Arrange
      const eventDto: CreateEventDto = {
        name: 'New Event',
        type: EventType.TRACK,
        description: 'New event description',
      };

      const createdEvent = createMockEvent({
        name: 'New Event',
        type: EventType.TRACK,
        description: 'New event description',
      });

      mockEventRepository.findByNameAndType.mockResolvedValue(null);
      mockEventRepository.create.mockResolvedValue(createdEvent);

      // Act
      const result = await eventService.findOrCreateEvent(eventDto);

      // Assert
      expect(result).toBe(createdEvent);
      expect(mockEventRepository.findByNameAndType).toHaveBeenCalledWith(
        'New Event',
        EventType.TRACK
      );
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ...eventDto,
        create_time: expect.any(Date),
      });
    });

    it('should reuse existing event when exact match exists', async () => {
      // Arrange
      const eventDto: CreateEventDto = {
        name: 'Existing Event',
        type: EventType.TRACK,
        description: 'Existing event description',
      };

      const existingEvent = createMockEvent({
        id: 'existing-event-id',
        name: 'Existing Event',
        type: EventType.TRACK,
        description: 'Existing event description',
      });

      mockEventRepository.findByNameAndType.mockResolvedValue(existingEvent);

      // Act
      const result = await eventService.findOrCreateEvent(eventDto);

      // Assert
      expect(result).toBe(existingEvent);
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateEvent - Conflict Detection', () => {
    it('should throw ConflictError when event exists with different description', async () => {
      // Arrange
      const eventDto: CreateEventDto = {
        name: 'Conflicting Event',
        type: EventType.TRACK,
        description: 'New description',
      };

      const existingEvent = createMockEvent({
        name: 'Conflicting Event',
        type: EventType.TRACK,
        description: 'Old description', // Different description
      });

      mockEventRepository.findByNameAndType.mockResolvedValue(existingEvent);

      // Act & Assert
      await expect(eventService.findOrCreateEvent(eventDto)).rejects.toThrow(
        new ConflictError(
          "Event 'Conflicting Event' of type 'track' already exists with different description"
        )
      );
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should reuse event when description matches exactly', async () => {
      // Arrange
      const eventDto: CreateEventDto = {
        name: 'Matching Event',
        type: EventType.IDENTIFY,
        description: 'Same description',
      };

      const existingEvent = createMockEvent({
        id: 'existing-event-id',
        name: 'Matching Event',
        type: EventType.IDENTIFY,
        description: 'Same description', // Same description
      });

      mockEventRepository.findByNameAndType.mockResolvedValue(existingEvent);

      // Act
      const result = await eventService.findOrCreateEvent(eventDto);

      // Assert
      expect(result).toBe(existingEvent);
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should allow same name with different type', async () => {
      // Arrange
      const trackEventDto: CreateEventDto = {
        name: 'User Action',
        type: EventType.TRACK,
        description: 'Track event description',
      };

      const pageEventDto: CreateEventDto = {
        name: 'User Action',
        type: EventType.PAGE, // Different type
        description: 'Page event description',
      };

      const createdEvent = createMockEvent(pageEventDto);

      mockEventRepository.findByNameAndType.mockResolvedValue(null); // No existing event with this type
      mockEventRepository.create.mockResolvedValue(createdEvent);

      // Act
      const result = await eventService.findOrCreateEvent(pageEventDto);

      // Assert
      expect(result).toBe(createdEvent);
      expect(mockEventRepository.findByNameAndType).toHaveBeenCalledWith(
        'User Action',
        EventType.PAGE
      );
      expect(mockEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('Event Type Validation', () => {
    it('should accept all valid event types', async () => {
      // Test all valid EventType enum values
      const validTypes = [
        EventType.TRACK,
        EventType.IDENTIFY,
        EventType.ALIAS,
        EventType.SCREEN,
        EventType.PAGE,
      ];

      for (const eventType of validTypes) {
        // Arrange
        const eventDto: CreateEventDto = {
          name: `Test ${eventType} Event`,
          type: eventType,
          description: `Test ${eventType} event description`,
        };

        const createdEvent = createMockEvent(eventDto);

        mockEventRepository.findByNameAndType.mockResolvedValue(null);
        mockEventRepository.create.mockResolvedValue(createdEvent);

        // Act
        const result = await eventService.createEvent(eventDto);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data?.type).toBe(eventType);
      }
    });
  });

  describe('Unique Constraint Handling', () => {
    it('should throw UniqueConstraintError when creating event with existing name and type', async () => {
      // Arrange
      const eventDto: CreateEventDto = {
        name: 'Existing Event',
        type: EventType.TRACK,
        description: 'Event description',
      };

      const existingEvent = createMockEvent(eventDto);

      mockEventRepository.findByNameAndType.mockResolvedValue(existingEvent);

      // Act
      const result = await eventService.createEvent(eventDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('already exists');
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should create event successfully when no conflicts exist', async () => {
      // Arrange
      const eventDto: CreateEventDto = {
        name: 'New Event',
        type: EventType.TRACK,
        description: 'New event description',
      };

      const createdEvent = createMockEvent(eventDto);

      mockEventRepository.findByNameAndType.mockResolvedValue(null);
      mockEventRepository.create.mockResolvedValue(createdEvent);

      // Act
      const result = await eventService.createEvent(eventDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(createdEvent);
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ...eventDto,
        create_time: expect.any(Date),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const eventDto: CreateEventDto = {
        name: 'Test Event',
        type: EventType.TRACK,
        description: 'Test description',
      };

      mockEventRepository.findByNameAndType.mockResolvedValue(null);
      mockEventRepository.create.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await eventService.createEvent(eventDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Database error');
    });
  });
}); 