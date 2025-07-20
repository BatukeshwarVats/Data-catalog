import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PropertyService } from '../../../src/services/PropertyService';
import { PropertyRepository } from '../../../src/repositories/PropertyRepository';
import { mockPropertyRepository, createMockProperty } from '../../mocks/repositories';
import { CreatePropertyDto, PropertyType } from '../../../src/types';
import { ConflictError, UniqueConstraintError, ValidationError } from '../../../src/utils/errors';

// Mock the PropertyRepository
vi.mock('../../../src/repositories/PropertyRepository');

describe('PropertyService - Complex Business Logic', () => {
  let propertyService: PropertyService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PropertyRepository).mockImplementation(() => mockPropertyRepository as any);
    propertyService = new PropertyService();
  });

  describe('findOrCreateProperty - Auto-Creation Logic', () => {
    it('should create new property when it does not exist', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'new_property',
        type: PropertyType.STRING,
        description: 'New property description',
        validation_rules: { min: 3, max: 50 },
      };

      const createdProperty = createMockProperty({
        name: 'new_property',
        type: PropertyType.STRING,
        description: 'New property description',
        validation_rules: { min: 3, max: 50 },
      });

      mockPropertyRepository.findByNameAndType.mockResolvedValue(null);
      mockPropertyRepository.create.mockResolvedValue(createdProperty);

      // Act
      const result = await propertyService.findOrCreateProperty(propertyDto);

      // Assert
      expect(result).toBe(createdProperty);
      expect(mockPropertyRepository.findByNameAndType).toHaveBeenCalledWith(
        'new_property',
        PropertyType.STRING
      );
      expect(mockPropertyRepository.create).toHaveBeenCalledWith({
        ...propertyDto,
        create_time: expect.any(Date),
      });
    });

    it('should reuse existing property when exact match exists', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'existing_property',
        type: PropertyType.STRING,
        description: 'Existing property description',
        validation_rules: { min: 3, max: 50 },
      };

      const existingProperty = createMockProperty({
        id: 'existing-id',
        name: 'existing_property',
        type: PropertyType.STRING,
        description: 'Existing property description',
        validation_rules: { min: 3, max: 50 },
      });

      mockPropertyRepository.findByNameAndType.mockResolvedValue(existingProperty);

      // Act
      const result = await propertyService.findOrCreateProperty(propertyDto);

      // Assert
      expect(result).toBe(existingProperty);
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateProperty - Conflict Detection', () => {
    it('should throw ConflictError when property exists with different description', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'conflicting_property',
        type: PropertyType.STRING,
        description: 'New description',
        validation_rules: undefined,
      };

      const existingProperty = createMockProperty({
        name: 'conflicting_property',
        type: PropertyType.STRING,
        description: 'Old description', // Different description
        validation_rules: undefined,
      });

      mockPropertyRepository.findByNameAndType.mockResolvedValue(existingProperty);

      // Act & Assert
      await expect(propertyService.findOrCreateProperty(propertyDto)).rejects.toThrow(
        new ConflictError(
          "Property 'conflicting_property' of type 'string' already exists with different description"
        )
      );
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when property exists with different validation rules', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'conflicting_property',
        type: PropertyType.STRING,
        description: 'Same description',
        validation_rules: { min: 5, max: 100 },
      };

      const existingProperty = createMockProperty({
        name: 'conflicting_property',
        type: PropertyType.STRING,
        description: 'Same description',
        validation_rules: { min: 3, max: 50 }, // Different validation rules
      });

      mockPropertyRepository.findByNameAndType.mockResolvedValue(existingProperty);

      // Act & Assert
      await expect(propertyService.findOrCreateProperty(propertyDto)).rejects.toThrow(
        new ConflictError(
          "Property 'conflicting_property' of type 'string' already exists with different validation rules"
        )
      );
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
    });

    it('should handle null vs undefined validation rules correctly', async () => {
      // Arrange - This tests the fixed null/undefined bug
      const propertyDto: CreatePropertyDto = {
        name: 'test_property',
        type: PropertyType.STRING,
        description: 'Test property',
        validation_rules: undefined, // undefined from request
      };

      const existingProperty = createMockProperty({
        name: 'test_property',
        type: PropertyType.STRING,
        description: 'Test property',
        validation_rules: null, // null from database
      });

      mockPropertyRepository.findByNameAndType.mockResolvedValue(existingProperty);

      // Act
      const result = await propertyService.findOrCreateProperty(propertyDto);

      // Assert - Should not throw error, should reuse existing property
      expect(result).toBe(existingProperty);
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
    });

    it('should handle complex validation rules comparison correctly', async () => {
      // Arrange
      const complexValidationRules = {
        min: 5,
        max: 100,
        regex: '^[A-Za-z]+$',
        enum: ['option1', 'option2', 'option3'],
      };

      const propertyDto: CreatePropertyDto = {
        name: 'complex_property',
        type: PropertyType.STRING,
        description: 'Complex property',
        validation_rules: complexValidationRules,
      };

      const existingProperty = createMockProperty({
        name: 'complex_property',
        type: PropertyType.STRING,
        description: 'Complex property',
        validation_rules: complexValidationRules, // Exact same complex rules
      });

      mockPropertyRepository.findByNameAndType.mockResolvedValue(existingProperty);

      // Act
      const result = await propertyService.findOrCreateProperty(propertyDto);

      // Assert
      expect(result).toBe(existingProperty);
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Validation Rules Validation', () => {
    it('should validate string property validation rules', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'string_property',
        type: PropertyType.STRING,
        description: 'String property with validation',
        validation_rules: {
          min: 'invalid' as any, // Should be number
          regex: '^[A-Za-z]+$',
        },
      };

      mockPropertyRepository.findByNameAndType.mockResolvedValue(null);

      // Act & Assert
      const result = await propertyService.createProperty(propertyDto);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('min length must be a number');
    });

    it('should validate number property validation rules', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'number_property',
        type: PropertyType.NUMBER,
        description: 'Number property with validation',
        validation_rules: {
          min: 'invalid' as any, // Should be number
          max: 100,
        },
      };

      mockPropertyRepository.findByNameAndType.mockResolvedValue(null);

      // Act & Assert
      const result = await propertyService.createProperty(propertyDto);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('min value must be a number');
    });

    it('should validate regex patterns in validation rules', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'regex_property',
        type: PropertyType.STRING,
        description: 'Property with invalid regex',
        validation_rules: {
          regex: '[invalid-regex(', // Invalid regex pattern
        },
      };

      mockPropertyRepository.findByNameAndType.mockResolvedValue(null);

      // Act & Assert
      const result = await propertyService.createProperty(propertyDto);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid regex pattern');
    });

    it('should accept valid validation rules', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'valid_property',
        type: PropertyType.STRING,
        description: 'Property with valid validation rules',
        validation_rules: {
          min: 3,
          max: 50,
          regex: '^[A-Za-z0-9]+$',
        },
      };

      const createdProperty = createMockProperty(propertyDto);

      mockPropertyRepository.findByNameAndType.mockResolvedValue(null);
      mockPropertyRepository.create.mockResolvedValue(createdProperty);

      // Act
      const result = await propertyService.createProperty(propertyDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(createdProperty);
      expect(mockPropertyRepository.create).toHaveBeenCalledWith({
        ...propertyDto,
        create_time: expect.any(Date),
      });
    });
  });

  describe('Unique Constraint Handling', () => {
    it('should throw UniqueConstraintError when creating property with existing name and type', async () => {
      // Arrange
      const propertyDto: CreatePropertyDto = {
        name: 'existing_property',
        type: PropertyType.STRING,
        description: 'Property description',
      };

      const existingProperty = createMockProperty(propertyDto);

      mockPropertyRepository.findByNameAndType.mockResolvedValue(existingProperty);

      // Act
      const result = await propertyService.createProperty(propertyDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('already exists');
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
    });

    it('should allow creating property with same name but different type', async () => {
      // Arrange
      const stringPropertyDto: CreatePropertyDto = {
        name: 'shared_name',
        type: PropertyType.STRING,
        description: 'String property',
      };

      const numberPropertyDto: CreatePropertyDto = {
        name: 'shared_name',
        type: PropertyType.NUMBER, // Different type
        description: 'Number property',
      };

      const createdProperty = createMockProperty(numberPropertyDto);

      mockPropertyRepository.findByNameAndType.mockResolvedValue(null); // No existing property with this type
      mockPropertyRepository.create.mockResolvedValue(createdProperty);

      // Act
      const result = await propertyService.createProperty(numberPropertyDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(createdProperty);
      expect(mockPropertyRepository.findByNameAndType).toHaveBeenCalledWith(
        'shared_name',
        PropertyType.NUMBER
      );
    });
  });
}); 