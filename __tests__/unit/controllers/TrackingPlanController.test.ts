import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrackingPlanController } from '../../../src/controllers/TrackingPlanController';
import { CreateTrackingPlanDto, EventType, PropertyType } from '../../../src/types';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup';
import { AppError } from '../../../src/utils/errors';

// Mock the TrackingPlanService
const mockTrackingPlanService = {
  createTrackingPlan: vi.fn(),
  getTrackingPlanById: vi.fn(),
  getAllTrackingPlans: vi.fn(),
  updateTrackingPlan: vi.fn(),
  deleteTrackingPlan: vi.fn(),
};

vi.mock('../../../src/services/TrackingPlanService', () => ({
  TrackingPlanService: vi.fn(() => mockTrackingPlanService),
}));

describe('TrackingPlanController', () => {
  let trackingPlanController: TrackingPlanController;
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    trackingPlanController = new TrackingPlanController();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('createTrackingPlan', () => {
    it('should create tracking plan successfully', async () => {
      // Arrange
      const trackingPlanDto: CreateTrackingPlanDto = {
        name: 'Test Plan',
        description: 'Test Description',
        events: [
          {
            name: 'Test Event',
            type: EventType.TRACK,
            description: 'Test event description',
            additionalProperties: false,
            properties: [
              {
                name: 'test_property',
                type: PropertyType.STRING,
                description: 'Test property description',
                required: true,
              },
            ],
          },
        ],
      };

      const mockResponseData = {
        id: 'test-plan-id',
        name: 'Test Plan',
        description: 'Test Description',
        create_time: new Date(),
        update_time: new Date(),
        is_deleted: false,
        events: [
          {
            id: 'test-event-id',
            name: 'Test Event',
            type: EventType.TRACK,
            description: 'Test event description',
            additionalProperties: false,
            properties: [
              {
                id: 'test-property-id',
                name: 'test_property',
                type: PropertyType.STRING,
                description: 'Test property description',
                required: true,
              },
            ],
          },
        ],
      };

      mockReq.body = trackingPlanDto;
      mockTrackingPlanService.createTrackingPlan.mockResolvedValue({
        success: true,
        data: mockResponseData,
      });

      // Act
      await trackingPlanController.createTrackingPlan(mockReq, mockRes, mockNext);

      // Assert
      expect(mockTrackingPlanService.createTrackingPlan).toHaveBeenCalledWith(trackingPlanDto);
      expect(mockNext).not.toHaveBeenCalled();
    });

  });

  describe('getAllTrackingPlans', () => {

    it('should use default pagination values when not provided', async () => {
      // Arrange
      mockReq.query = {};
      mockTrackingPlanService.getAllTrackingPlans.mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } },
      });

      // Act
      await trackingPlanController.getAllTrackingPlans(mockReq, mockRes, mockNext);

      // Assert
      expect(mockTrackingPlanService.getAllTrackingPlans).toHaveBeenCalledWith(
        { name: undefined, description: undefined },
        { page: 1, limit: 10 }
      );
    });
  });
}); 