export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}

export class UniqueConstraintError extends ConflictError {
  constructor(field: string, value: string) {
    super(`${field} '${value}' already exists`);
  }
}

export class EntityConflictError extends ConflictError {
  constructor(entity: string, field: string) {
    super(`${entity} with different ${field} already exists`);
  }
} 