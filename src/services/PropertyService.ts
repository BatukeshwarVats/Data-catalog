import { PropertyRepository } from '../repositories/PropertyRepository';
import { Property } from '../entities/Property';
import { 
  CreatePropertyDto, 
  UpdatePropertyDto, 
  PropertyFilter, 
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

export class PropertyService {
  private propertyRepository: PropertyRepository;

  constructor() {
    this.propertyRepository = new PropertyRepository();
  }

  async createProperty(data: CreatePropertyDto): Promise<ServiceResponse<Property>> {
    try {
      // Check if property with same name and type already exists
      const existingProperty = await this.propertyRepository.findByNameAndType(data.name, data.type);
      
      if (existingProperty) {
        throw new UniqueConstraintError('Property', `${data.name}:${data.type}`);
      }

      // Validate validation rules if provided
      if (data.validation_rules) {
        this.validatePropertyRules(data.validation_rules, data.type);
      }

      // Set create_time if not provided
      const propertyData = {
        ...data,
        create_time: data.create_time || new Date()
      };

      const property = await this.propertyRepository.create(propertyData);
      
      logger.info(`Property created successfully: ${property.id}`, {
        propertyId: property.id,
        name: property.name,
        type: property.type
      });

      return {
        success: true,
        data: property
      };
    } catch (error) {
      logger.error('Error creating property:', error);
      return {
        success: false,
        error: {
          code: 'CREATE_PROPERTY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async getPropertyById(id: string): Promise<ServiceResponse<Property>> {
    try {
      const property = await this.propertyRepository.findById(id);
      
      if (!property) {
        throw new NotFoundError('Property');
      }

      return {
        success: true,
        data: property
      };
    } catch (error) {
      logger.error(`Error getting property by ID: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'GET_PROPERTY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async getAllProperties(
    filter: PropertyFilter = {}, 
    pagination: PaginationOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<Property>>> {
    try {
      const properties = await this.propertyRepository.findByFilter(filter);
      
      // Manual pagination since we're using filter
      const { page = 1, limit = 10 } = pagination;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProperties = properties.slice(startIndex, endIndex);
      
      const result: PaginatedResponse<Property> = {
        data: paginatedProperties,
        pagination: {
          page,
          limit,
          total: properties.length,
          pages: Math.ceil(properties.length / limit)
        }
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Error getting all properties:', error);
      return {
        success: false,
        error: {
          code: 'GET_ALL_PROPERTIES_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async updateProperty(id: string, data: UpdatePropertyDto): Promise<ServiceResponse<Property>> {
    try {
      const existingProperty = await this.propertyRepository.findById(id);
      
      if (!existingProperty) {
        throw new NotFoundError('Property');
      }

      // Check for unique constraint if name or type is being updated
      if (data.name || data.type) {
        const nameToCheck = data.name || existingProperty.name;
        const typeToCheck = data.type || existingProperty.type;
        
        const conflictingProperty = await this.propertyRepository.findByNameAndTypeExcludingId(
          nameToCheck, 
          typeToCheck, 
          id
        );
        
        if (conflictingProperty) {
          throw new UniqueConstraintError('Property', `${nameToCheck}:${typeToCheck}`);
        }
      }

      // Validate validation rules if provided
      if (data.validation_rules) {
        const typeToCheck = data.type || existingProperty.type;
        this.validatePropertyRules(data.validation_rules, typeToCheck);
      }

      const updatedProperty = await this.propertyRepository.update(id, data);
      
      logger.info(`Property updated successfully: ${id}`, {
        propertyId: id,
        updatedFields: Object.keys(data)
      });

      return {
        success: true,
        data: updatedProperty!
      };
    } catch (error) {
      logger.error(`Error updating property: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PROPERTY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async deleteProperty(id: string): Promise<ServiceResponse<void>> {
    try {
      const property = await this.propertyRepository.findById(id);
      
      if (!property) {
        throw new NotFoundError('Property');
      }

      await this.propertyRepository.softDelete(id);
      
      logger.info(`Property deleted successfully: ${id}`, {
        propertyId: id,
        name: property.name,
        type: property.type
      });

      return {
        success: true
      };
    } catch (error) {
      logger.error(`Error deleting property: ${id}`, error);
      return {
        success: false,
        error: {
          code: 'DELETE_PROPERTY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async searchProperties(searchTerm: string): Promise<ServiceResponse<Property[]>> {
    try {
      const properties = await this.propertyRepository.searchByName(searchTerm);
      
      return {
        success: true,
        data: properties
      };
    } catch (error) {
      logger.error(`Error searching properties: ${searchTerm}`, error);
      return {
        success: false,
        error: {
          code: 'SEARCH_PROPERTIES_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  // Internal method used by TrackingPlanService
  async findOrCreateProperty(data: CreatePropertyDto): Promise<Property> {
    const existingProperty = await this.propertyRepository.findByNameAndType(data.name, data.type);
    
    if (existingProperty) {
      // Check if description and validation rules match
      if (existingProperty.description !== data.description) {
        throw new ConflictError(
          `Property '${data.name}' of type '${data.type}' already exists with different description`
        );
      }
      
      // Normalize validation rules - treat null and undefined as equivalent
      const existingRules = existingProperty.validation_rules || null;
      const newRules = data.validation_rules || null;
      
      // Check validation rules match
      if (JSON.stringify(existingRules) !== JSON.stringify(newRules)) {
        throw new ConflictError(
          `Property '${data.name}' of type '${data.type}' already exists with different validation rules`
        );
      }
      
      return existingProperty;
    }

    // Validate validation rules if provided
    if (data.validation_rules) {
      this.validatePropertyRules(data.validation_rules, data.type);
    }

    return this.propertyRepository.create({
      ...data,
      create_time: data.create_time || new Date()
    });
  }

  private validatePropertyRules(rules: any, type: string): void {
    // Basic validation for property rules based on type
    if (type === 'string') {
      if (rules.min && typeof rules.min !== 'number') {
        throw new ValidationError('String property min length must be a number');
      }
      if (rules.max && typeof rules.max !== 'number') {
        throw new ValidationError('String property max length must be a number');
      }
      if (rules.regex && typeof rules.regex !== 'string') {
        throw new ValidationError('String property regex must be a string');
      }
    } else if (type === 'number') {
      if (rules.min && typeof rules.min !== 'number') {
        throw new ValidationError('Number property min value must be a number');
      }
      if (rules.max && typeof rules.max !== 'number') {
        throw new ValidationError('Number property max value must be a number');
      }
    } else if (type === 'boolean') {
      if (rules.enum && !Array.isArray(rules.enum)) {
        throw new ValidationError('Boolean property enum must be an array');
      }
    }

    // Validate regex if provided
    if (rules.regex) {
      try {
        new RegExp(rules.regex);
      } catch (error) {
        throw new ValidationError('Invalid regex pattern in validation rules');
      }
    }
  }
} 