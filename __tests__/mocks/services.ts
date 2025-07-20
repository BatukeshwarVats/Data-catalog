import { vi } from 'vitest';
import { ServiceResponse } from '../../src/types';

// Mock Event Service
export const mockEventService = {
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  getAllEvents: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  searchEvents: vi.fn(),
  findOrCreateEvent: vi.fn(),
};

// Mock Property Service
export const mockPropertyService = {
  createProperty: vi.fn(),
  getPropertyById: vi.fn(),
  getAllProperties: vi.fn(),
  updateProperty: vi.fn(),
  deleteProperty: vi.fn(),
  searchProperties: vi.fn(),
  findOrCreateProperty: vi.fn(),
};

// Mock TrackingPlan Service
export const mockTrackingPlanService = {
  createTrackingPlan: vi.fn(),
  getTrackingPlanById: vi.fn(),
  getAllTrackingPlans: vi.fn(),
  updateTrackingPlan: vi.fn(),
  deleteTrackingPlan: vi.fn(),
};

// Mock response factories
export const createSuccessResponse = <T>(data: T): ServiceResponse<T> => ({
  success: true,
  data,
});

export const createErrorResponse = (message: string, code = 'TEST_ERROR'): ServiceResponse<any> => ({
  success: false,
  error: {
    code,
    message,
  },
});

// Mock database transaction
export const mockQueryRunner = {
  connect: vi.fn(),
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  rollbackTransaction: vi.fn(),
  release: vi.fn(),
  manager: {
    getRepository: vi.fn(),
  },
};

export const mockAppDataSource = {
  createQueryRunner: vi.fn(() => mockQueryRunner),
  getRepository: vi.fn(),
  isInitialized: true,
  initialize: vi.fn(),
  destroy: vi.fn(),
}; 