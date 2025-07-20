// Enums
export enum EventType {
  TRACK = 'track',
  IDENTIFY = 'identify',
  ALIAS = 'alias',
  SCREEN = 'screen',
  PAGE = 'page'
}

export enum PropertyType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean'
}

export enum ValidationRuleType {
  REGEX = 'regex',
  RANGE = 'range',
  ENUM = 'enum',
  CUSTOM = 'custom'
}

// Base interfaces
export interface BaseEntity {
  id: string;
  create_time: Date;
  update_time: Date;
  is_deleted: boolean;
  deleted_at?: Date;
}

// Validation Rules
export interface ValidationRule {
  type: ValidationRuleType;
  value: string | number | string[];
  message?: string;
}

export interface PropertyValidationRules {
  regex?: string;
  min?: number;
  max?: number;
  enum?: string[];
  custom?: string;
}

// DTOs for API requests
export interface CreateEventDto {
  name: string;
  type: EventType;
  description: string;
  create_time?: Date;
}

export interface UpdateEventDto {
  name?: string;
  type?: EventType;
  description?: string;
}

export interface CreatePropertyDto {
  name: string;
  type: PropertyType;
  description: string;
  validation_rules?: PropertyValidationRules;
  create_time?: Date;
}

export interface UpdatePropertyDto {
  name?: string;
  type?: PropertyType;
  description?: string;
  validation_rules?: PropertyValidationRules;
}

export interface EventPropertyDto {
  name: string;
  type: PropertyType;
  required: boolean;
  description: string;
  validation_rules?: PropertyValidationRules;
}

export interface TrackingPlanEventDto {
  name: string;
  type: EventType;
  description: string;
  properties: EventPropertyDto[];
  additionalProperties: boolean;
}

export interface CreateTrackingPlanDto {
  name: string;
  description: string;
  events: TrackingPlanEventDto[];
  create_time?: Date;
}

export interface UpdateTrackingPlanDto {
  name?: string;
  description?: string;
  events?: TrackingPlanEventDto[];
}

// Response DTOs
export interface EventResponseDto extends BaseEntity {
  name: string;
  type: EventType;
  description: string;
}

export interface PropertyResponseDto extends BaseEntity {
  name: string;
  type: PropertyType;
  description: string;
  validation_rules?: PropertyValidationRules;
}

export interface TrackingPlanResponseDto extends BaseEntity {
  name: string;
  description: string;
  events: Array<{
    id: string;
    name: string;
    type: EventType;
    description: string;
    additionalProperties: boolean;
    properties: Array<{
      id: string;
      name: string;
      type: PropertyType;
      description: string;
      required: boolean;
      validation_rules?: PropertyValidationRules;
    }>;
  }>;
}

// Pagination and filtering
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EventFilter {
  name?: string;
  type?: EventType;
  description?: string;
}

export interface PropertyFilter {
  name?: string;
  type?: PropertyType;
  description?: string;
}

export interface TrackingPlanFilter {
  name?: string;
  description?: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Service response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
} 