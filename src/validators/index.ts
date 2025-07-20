import { z } from 'zod';
import { EventType, PropertyType } from '../types';

// Event validators
export const CreateEventSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(EventType),
  description: z.string().min(1),
  create_time: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
});

export const UpdateEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.nativeEnum(EventType).optional(),
  description: z.string().min(1).optional()
});

// Property validators
export const PropertyValidationRulesSchema = z.object({
  regex: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  enum: z.array(z.string()).optional(),
  custom: z.string().optional()
}).optional();

export const CreatePropertySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(PropertyType),
  description: z.string().min(1),
  validation_rules: PropertyValidationRulesSchema,
  create_time: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
});

export const UpdatePropertySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  description: z.string().min(1).optional(),
  validation_rules: PropertyValidationRulesSchema
});

// TrackingPlan validators
export const EventPropertySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(PropertyType),
  required: z.boolean(),
  description: z.string().min(1),
  validation_rules: PropertyValidationRulesSchema
});

export const TrackingPlanEventSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(EventType),
  description: z.string().min(1),
  properties: z.array(EventPropertySchema),
  additionalProperties: z.boolean()
});

export const CreateTrackingPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  events: z.array(TrackingPlanEventSchema),
  create_time: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
});

export const UpdateTrackingPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  events: z.array(TrackingPlanEventSchema).optional()
});

// Pagination and filtering validators
export const PaginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
});

export const EventFilterSchema = z.object({
  name: z.string().optional(),
  type: z.nativeEnum(EventType).optional(),
  description: z.string().optional()
});

export const PropertyFilterSchema = z.object({
  name: z.string().optional(),
  type: z.nativeEnum(PropertyType).optional(),
  description: z.string().optional()
});

export const TrackingPlanFilterSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional()
});

// Query parameters validation
export const IdParamSchema = z.object({
  id: z.string().uuid()
});

export const NameParamSchema = z.object({
  name: z.string().min(1)
});

// Type inference for TypeScript
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;
export type CreateTrackingPlanInput = z.infer<typeof CreateTrackingPlanSchema>;
export type UpdateTrackingPlanInput = z.infer<typeof UpdateTrackingPlanSchema>;
export type EventFilterInput = z.infer<typeof EventFilterSchema>;
export type PropertyFilterInput = z.infer<typeof PropertyFilterSchema>;
export type TrackingPlanFilterInput = z.infer<typeof TrackingPlanFilterSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>; 