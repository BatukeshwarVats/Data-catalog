import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../src/config/database';
import { initializeDatabase } from '../../src/config/database';
import eventRoutes from '../../src/routes/eventRoutes';
import propertyRoutes from '../../src/routes/propertyRoutes';
import trackingPlanRoutes from '../../src/routes/trackingPlanRoutes';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';

// Setup test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/properties', propertyRoutes);
  app.use('/api/v1/tracking-plans', trackingPlanRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('TrackingPlan E2E Tests - Complex Business Logic', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Initialize database and clear all data
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }
    
    // Clear all data
    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName};`);
    }

    app = createTestApp();
  });

  describe('Auto-Creation Logic', () => {
    it('should auto-create new events and properties when creating tracking plan', async () => {
      // Arrange - Create tracking plan with completely new entities
      const trackingPlanData = {
        name: 'E2E Auto Creation Plan',
        description: 'Test auto-creation of entities',
        events: [
          {
            name: 'User Registration E2E',
            type: 'identify',
            description: 'User completed registration process',
            additionalProperties: false,
            properties: [
              {
                name: 'user_email_e2e',
                type: 'string',
                description: 'User email address',
                required: true,
                validation_rules: {
                  regex: '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$',
                },
              },
              {
                name: 'signup_source_e2e',
                type: 'string',
                description: 'Source of signup',
                required: false,
              },
            ],
          },
        ],
      };

      // Act
      const response = await request(app)
        .post('/api/v1/tracking-plans')
        .send(trackingPlanData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('E2E Auto Creation Plan');
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.events[0].name).toBe('User Registration E2E');
      expect(response.body.data.events[0].properties).toHaveLength(2);

      // Verify the entities were actually created
      const eventResponse = await request(app)
        .get('/api/v1/events')
        .expect(200);
      
      expect(eventResponse.body.data).toHaveLength(1);
      expect(eventResponse.body.data[0].name).toBe('User Registration E2E');

      const propertyResponse = await request(app)
        .get('/api/v1/properties')
        .expect(200);
      
      expect(propertyResponse.body.data).toHaveLength(2);
      const propertyNames = propertyResponse.body.data.map((p: any) => p.name);
      expect(propertyNames).toContain('user_email_e2e');
      expect(propertyNames).toContain('signup_source_e2e');
    });

    it('should reuse existing events and properties when exact match exists', async () => {
      // Arrange - First create individual entities
      const eventData = {
        name: 'Existing Event E2E',
        type: 'track',
        description: 'Pre-existing event',
      };

      const propertyData = {
        name: 'existing_prop_e2e',
        type: 'string',
        description: 'Pre-existing property',
      };

      await request(app).post('/api/v1/events').send(eventData).expect(201);
      await request(app).post('/api/v1/properties').send(propertyData).expect(201);

      // Act - Create tracking plan that should reuse these entities
      const trackingPlanData = {
        name: 'Entity Reuse Plan',
        description: 'Test entity reuse',
        events: [
          {
            name: 'Existing Event E2E',
            type: 'track',
            description: 'Pre-existing event', // Exact match
            additionalProperties: true,
            properties: [
              {
                name: 'existing_prop_e2e',
                type: 'string',
                description: 'Pre-existing property', // Exact match
                required: true,
              },
            ],
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/tracking-plans')
        .send(trackingPlanData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);

      // Verify no duplicate entities were created
      const eventResponse = await request(app).get('/api/v1/events').expect(200);
      expect(eventResponse.body.data).toHaveLength(1); // Still only 1 event

      const propertyResponse = await request(app).get('/api/v1/properties').expect(200);
      expect(propertyResponse.body.data).toHaveLength(1); // Still only 1 property
    });
  });

  describe('Conflict Detection Logic', () => {
    it('should fail when trying to create tracking plan with conflicting event descriptions', async () => {
      // Arrange - First create an event
      await request(app)
        .post('/api/v1/events')
        .send({
          name: 'Conflicting Event E2E',
          type: 'track',
          description: 'Original description',
        })
        .expect(201);

      // Act - Try to create tracking plan with same event but different description
      const trackingPlanData = {
        name: 'Conflict Test Plan',
        description: 'This should fail',
        events: [
          {
            name: 'Conflicting Event E2E',
            type: 'track',
            description: 'Different description', // Conflict!
            additionalProperties: false,
            properties: [],
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/tracking-plans')
        .send(trackingPlanData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists with different description');
    });

    it('should fail when trying to create tracking plan with conflicting property validation rules', async () => {
      // Arrange - First create a property with specific validation rules
      await request(app)
        .post('/api/v1/properties')
        .send({
          name: 'conflicting_prop_e2e',
          type: 'string',
          description: 'Same description',
          validation_rules: { min: 3, max: 50 },
        })
        .expect(201);

      // Act - Try to create tracking plan with same property but different validation rules
      const trackingPlanData = {
        name: 'Property Conflict Plan',
        description: 'This should fail',
        events: [
          {
            name: 'Test Event',
            type: 'track',
            description: 'Test event',
            additionalProperties: false,
            properties: [
              {
                name: 'conflicting_prop_e2e',
                type: 'string',
                description: 'Same description',
                required: true,
                validation_rules: { min: 5, max: 100 }, // Different validation rules!
              },
            ],
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/tracking-plans')
        .send(trackingPlanData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists with different validation rules');
    });

    it('should succeed when property has null vs undefined validation rules (bug fix test)', async () => {
      // Arrange - Create property with null validation rules (from database)
      await request(app)
        .post('/api/v1/properties')
        .send({
          name: 'null_validation_prop',
          type: 'string',
          description: 'Property with null validation',
          // validation_rules not provided (will be null in DB)
        })
        .expect(201);

      // Act - Create tracking plan with undefined validation rules (from request)
      const trackingPlanData = {
        name: 'Null Validation Test',
        description: 'Test null vs undefined handling',
        events: [
          {
            name: 'Test Event',
            type: 'track',
            description: 'Test event',
            additionalProperties: false,
            properties: [
              {
                name: 'null_validation_prop',
                type: 'string',
                description: 'Property with null validation',
                required: true,
                // validation_rules undefined in request
              },
            ],
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/tracking-plans')
        .send(trackingPlanData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.events[0].properties[0].name).toBe('null_validation_prop');
    });
  });

  describe('Property Reuse Within Same Tracking Plan', () => {
    it('should reuse the same property across multiple events in the same tracking plan', async () => {
      // Act - Create tracking plan with two events sharing the same property
      const trackingPlanData = {
        name: 'E-commerce Flow E2E',
        description: 'Multi-event tracking plan with shared properties',
        events: [
          {
            name: 'Add to Cart E2E',
            type: 'track',
            description: 'Item added to shopping cart',
            additionalProperties: true,
            properties: [
              {
                name: 'product_id_e2e',
                type: 'string',
                description: 'Product identifier',
                required: true,
              },
              {
                name: 'price_e2e',
                type: 'number',
                description: 'Product price',
                required: true,
                validation_rules: { min: 0 },
              },
            ],
          },
          {
            name: 'Checkout Started E2E',
            type: 'track',
            description: 'User initiated checkout process',
            additionalProperties: false,
            properties: [
              {
                name: 'product_id_e2e', // Same property as above
                type: 'string',
                description: 'Product identifier',
                required: true,
              },
              {
                name: 'cart_total_e2e',
                type: 'number',
                description: 'Total cart value',
                required: true,
                validation_rules: { min: 0 },
              },
            ],
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/tracking-plans')
        .send(trackingPlanData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(2);

      // Both events should have the shared property
      const event1Properties = response.body.data.events[0].properties;
      const event2Properties = response.body.data.events[1].properties;

      const sharedProp1 = event1Properties.find((p: any) => p.name === 'product_id_e2e');
      const sharedProp2 = event2Properties.find((p: any) => p.name === 'product_id_e2e');

      expect(sharedProp1).toBeDefined();
      expect(sharedProp2).toBeDefined();
      expect(sharedProp1.id).toBe(sharedProp2.id); // Same property ID

      // Verify only 3 unique properties were created (not 4)
      const propertyResponse = await request(app).get('/api/v1/properties').expect(200);
      expect(propertyResponse.body.data).toHaveLength(3); // product_id_e2e, price_e2e, cart_total_e2e
    });
  });

  describe('Complex Multi-Event Scenarios', () => {
    it('should handle complex tracking plan with mixed new/existing entities', async () => {
      // Arrange - Pre-create some entities
      await request(app)
        .post('/api/v1/events')
        .send({
          name: 'User Login E2E',
          type: 'track',
          description: 'User successfully logged in',
        })
        .expect(201);

      await request(app)
        .post('/api/v1/properties')
        .send({
          name: 'user_id_e2e',
          type: 'string',
          description: 'Unique user identifier',
        })
        .expect(201);

      // Act - Create complex tracking plan
      const trackingPlanData = {
        name: 'Complex Authentication Flow',
        description: 'Mixed new and existing entities',
        events: [
          {
            name: 'User Login E2E', // Existing event
            type: 'track',
            description: 'User successfully logged in',
            additionalProperties: true,
            properties: [
              {
                name: 'user_id_e2e', // Existing property
                type: 'string',
                description: 'Unique user identifier',
                required: true,
              },
              {
                name: 'login_method_e2e', // New property
                type: 'string',
                description: 'Method used for login',
                required: false,
                validation_rules: {
                  enum: ['email', 'social', 'sso'],
                },
              },
            ],
          },
          {
            name: 'Password Reset E2E', // New event
            type: 'track',
            description: 'User initiated password reset',
            additionalProperties: false,
            properties: [
              {
                name: 'user_id_e2e', // Existing property (shared)
                type: 'string',
                description: 'Unique user identifier',
                required: true,
              },
            ],
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/tracking-plans')
        .send(trackingPlanData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(2);

      // Verify entity counts
      const eventResponse = await request(app).get('/api/v1/events').expect(200);
      expect(eventResponse.body.data).toHaveLength(2); // User Login (existing) + Password Reset (new)

      const propertyResponse = await request(app).get('/api/v1/properties').expect(200);
      expect(propertyResponse.body.data).toHaveLength(2); // user_id_e2e (existing) + login_method_e2e (new)
    });
  });

  describe('Unique Constraint Validation', () => {
    it('should prevent duplicate tracking plan names', async () => {
      // Arrange - Create first tracking plan
      await request(app)
        .post('/api/v1/tracking-plans')
        .send({
          name: 'Duplicate Name Test',
          description: 'First plan',
          events: [],
        })
        .expect(201);

      // Act - Try to create second tracking plan with same name
      const response = await request(app)
        .post('/api/v1/tracking-plans')
        .send({
          name: 'Duplicate Name Test', // Same name
          description: 'Second plan',
          events: [],
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });
  });

}); 