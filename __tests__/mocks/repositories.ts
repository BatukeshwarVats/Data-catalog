import { vi } from 'vitest';
import { Event } from '../../src/entities/Event';
import { Property } from '../../src/entities/Property';
import { TrackingPlan } from '../../src/entities/TrackingPlan';
import { EventType, PropertyType } from '../../src/types';

// Mock Event Repository
export const mockEventRepository = {
  findById: vi.fn(),
  findByNameAndType: vi.fn(),
  findByFilter: vi.fn(),
  findByNameAndTypeExcludingId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  searchByName: vi.fn(),
  exists: vi.fn(),
  findAll: vi.fn(),
  count: vi.fn(),
};

// Mock Property Repository
export const mockPropertyRepository = {
  findById: vi.fn(),
  findByNameAndType: vi.fn(),
  findByFilter: vi.fn(),
  findByNameAndTypeExcludingId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  searchByName: vi.fn(),
  exists: vi.fn(),
  findAll: vi.fn(),
  count: vi.fn(),
};

// Mock TrackingPlan Repository
export const mockTrackingPlanRepository = {
  findById: vi.fn(),
  findByName: vi.fn(),
  findByFilter: vi.fn(),
  findByNameExcludingId: vi.fn(),
  findWithEvents: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  searchByName: vi.fn(),
  exists: vi.fn(),
  findAll: vi.fn(),
  count: vi.fn(),
};

// Mock data factories
export const createMockEvent = (overrides = {}): Event => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Event',
  type: EventType.TRACK,
  description: 'Test event description',
  create_time: new Date('2023-01-01'),
  update_time: new Date('2023-01-01'),
  is_deleted: false,
  deleted_at: null,
  trackingPlanEvents: [],
  eventProperties: [],
  ...overrides,
});

export const createMockProperty = (overrides = {}): Property => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'test_property',
  type: PropertyType.STRING,
  description: 'Test property description',
  validation_rules: null,
  create_time: new Date('2023-01-01'),
  update_time: new Date('2023-01-01'),
  is_deleted: false,
  deleted_at: null,
  eventProperties: [],
  ...overrides,
});

export const createMockTrackingPlan = (overrides = {}): TrackingPlan => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  name: 'Test Tracking Plan',
  description: 'Test tracking plan description',
  create_time: new Date('2023-01-01'),
  update_time: new Date('2023-01-01'),
  is_deleted: false,
  deleted_at: null,
  trackingPlanEvents: [],
  ...overrides,
}); 