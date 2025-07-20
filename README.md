# Data Catalog API

A TypeScript API for managing data catalog with events, properties, and tracking plans. Built for teams who need to maintain consistent data schemas across their analytics stack.

## Why This Architecture?

### Key Design Decisions

**Layered Architecture over DDD**: For this scope, a simple Controller → Service → Repository → Database flow is easier to maintain and faster to develop than complex domain modeling.

**PostgreSQL + TypeORM**: Chose PostgreSQL for ACID compliance and complex relationships. TypeORM provides good TypeScript integration while staying close to SQL.

**Auto-Creation Logic**: The most complex feature - when creating tracking plans, missing events and properties are automatically created. This reduces friction but requires careful conflict detection.

**Soft Deletes Everywhere**: Maintains referential integrity and provides audit trails without cascade delete complexity.

**UUID Primary Keys**: Better for distributed systems and avoids sequential ID guessing attacks.

### Trade-offs Made

- **Complexity vs Flexibility**: Auto-creation adds complexity but dramatically improves developer experience
- **Performance vs Consistency**: Chose strong consistency over performance - every operation is transactional
- **Storage vs Speed**: JSONB validation rules are flexible but slower than separate tables

## Quick Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Docker (optional)

### Option 1: Docker (Recommended)
```bash
git clone <repo-url>
cd data-catalog-api
docker-compose up -d
```

### Option 2: Local Development
```bash
# Install dependencies
npm install

# Setup PostgreSQL database
createdb data_catalog
createuser postgres --createdb  # if user doesn't exist

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations and start
npm run migration:run
npm run dev
```

### Environment Variables
```bash
# .env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=batukeshwar
DB_PASSWORD=
DB_NAME=data_catalog
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Application Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Development Settings
API_VERSION=v1

```

## How to Use

The API manages three core entities that work together:

### 1. Events (Actions you want to track)
```bash
POST /api/v1/events
{
  "name": "user_signup",
  "type": "track",
  "description": "User completed registration"
}
```

### 2. Properties (Data attributes)
```bash
POST /api/v1/properties
{
  "name": "email",
  "type": "string", 
  "description": "User email address",
  "validation_rules": {
    "regex": "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$"
  }
}
```

### 3. Tracking Plans (Complete schema definitions)
```bash
POST /api/v1/tracking-plans
{
  "name": "User Registration Flow",
  "description": "Complete user onboarding tracking",
  "events": [
    {
      "name": "user_signup",
      "type": "track", 
      "description": "User completed registration",
      "properties": [
        {
          "name": "email",
          "type": "string",
          "description": "User email address",
          "required": true
        }
      ]
    }
  ]
}
```

## API Documentation

**Interactive Docs**: Visit `http://localhost:3000/api-docs` after starting the server

### Core Endpoints

#### Events API
- `GET /api/v1/events` - List all events with filtering
- `POST /api/v1/events` - Create new event  
- `GET /api/v1/events/:id` - Get event by ID
- `PUT /api/v1/events/:id` - Update event
- `DELETE /api/v1/events/:id` - Soft delete event

#### Properties API
- `GET /api/v1/properties` - List all properties with filtering
- `POST /api/v1/properties` - Create new property
- `GET /api/v1/properties/:id` - Get property by ID  
- `PUT /api/v1/properties/:id` - Update property
- `DELETE /api/v1/properties/:id` - Soft delete property

#### Tracking Plans API
- `GET /api/v1/tracking-plans` - List all tracking plans
- `POST /api/v1/tracking-plans` - Create tracking plan (with auto-creation)
- `GET /api/v1/tracking-plans/:id` - Get tracking plan with full details
- `PUT /api/v1/tracking-plans/:id` - Update tracking plan
- `DELETE /api/v1/tracking-plans/:id` - Soft delete tracking plan

### Smart Features

**Auto-Creation**: When creating tracking plans, events and properties are automatically created if they don't exist.

**Conflict Detection**: If an event/property exists with different attributes, the API returns a conflict error instead of creating duplicates.

**Property Reuse**: Same properties can be used across multiple events within a tracking plan.

**Transactional Safety**: All operations either succeed completely or fail completely - no partial states.

## Real-World Example

Here's how the auto-creation works:

```bash
# This single request will:
# 1. Create tracking plan "E-commerce Flow"  
# 2. Auto-create "add_to_cart" event (if missing)
# 3. Auto-create "product_id" property (if missing)
# 4. Create all relationships
# 5. Reuse "product_id" in both events

curl -X POST http://localhost:3000/api/v1/tracking-plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-commerce Flow",
    "description": "Shopping cart and checkout tracking",
    "events": [
      {
        "name": "add_to_cart",
        "type": "track",
        "description": "Item added to cart",
        "properties": [
          {
            "name": "product_id", 
            "type": "string",
            "description": "Product identifier",
            "required": true
          }
        ]
      },
      {
        "name": "checkout_started",
        "type": "track", 
        "description": "User began checkout",
        "properties": [
          {
            "name": "product_id",
            "type": "string",
            "description": "Product identifier", 
            "required": true
          }
        ]
      }
    ]
  }'
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test types
npm run test:unit    # Business logic tests
npm run test:e2e     # Full API workflow tests
```

## Common Issues

**Database connection failed**: Make sure PostgreSQL is running and the `postgres` user exists:
```bash
# Create postgres user if needed
createuser postgres --createdb

# Or use Docker
docker-compose up postgres
```

**Port 3000 in use**: Change the `PORT` in your `.env` file or kill the process:
```bash
lsof -ti:3000 | xargs kill
```

## Project Structure

```
src/
├── controllers/    # HTTP request handlers
├── services/      # Business logic (auto-creation, conflict detection)
├── repositories/  # Database operations
├── entities/      # Database models
├── types/         # TypeScript interfaces  
├── validators/    # Request validation schemas
└── routes/        # API endpoint definitions
```

Built with Node.js, TypeScript, Express, PostgreSQL, and TypeORM. 