import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { AppDataSource } from '../src/config/database';

// Global test setup
beforeAll(async () => {
  // Initialize test database connection
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  // Close test database connection
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

beforeEach(async () => {
  // Clean database before each test in correct order to avoid foreign key violations
  try {
    // Delete junction tables first (child tables)
    await AppDataSource.query('DELETE FROM event_properties;');
    await AppDataSource.query('DELETE FROM tracking_plan_events;');
    
    // Then delete main tables (parent tables)
    await AppDataSource.query('DELETE FROM properties;');
    await AppDataSource.query('DELETE FROM events;');
    await AppDataSource.query('DELETE FROM tracking_plans;');
  } catch (error) {
    console.warn('Database cleanup warning:', error);
  }
});

afterEach(() => {
  // Reset all mocks after each test
  vi.clearAllMocks();
});

// Global test utilities
export const createMockRequest = (body: any = {}, params: any = {}, query: any = {}) => ({
  body,
  params,
  query,
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = () => vi.fn(); 