# Test Suite Documentation

This directory contains comprehensive tests for the Data Catalog API, covering all complex business logic and basic functionality.

## 📁 **Test Structure**

```
__tests__/
├── setup.ts                    # Global test setup and utilities
├── mocks/                      # Mock implementations
│   ├── repositories.ts         # Repository mocks and mock data factories
│   └── services.ts            # Service mocks and response factories
├── unit/                      # Unit tests (isolated component testing)
│   ├── services/              # Service layer tests
│   │   ├── TrackingPlanService.test.ts  # Complex auto-creation logic
│   │   ├── PropertyService.test.ts      # Conflict detection & validation
│   │   └── EventService.test.ts         # Event conflict detection
│   └── controllers/           # Controller layer tests
│       └── TrackingPlanController.test.ts # Request/response handling
└── e2e/                       # End-to-end integration tests
    └── tracking-plan.e2e.test.ts # Full API workflow tests
```

## 🧪 **Test Categories**

### **Unit Tests**
- **Services**: Test business logic in isolation with mocked dependencies
- **Controllers**: Test request/response handling with mocked services
- **Focus**: Complex business logic, error handling, edge cases

### **E2E Tests**
- **Full API workflows**: Test complete request-response cycles
- **Database integration**: Real database operations and transactions
- **Focus**: Complex scenarios matching the manual curl tests

## 🎯 **Complex Business Logic Coverage**

### **Auto-Creation Logic** ✅
- Creates new Events/Properties when they don't exist
- Reuses existing Events/Properties when exact matches found
- Handles mixed new/existing entities in same tracking plan

### **Conflict Detection** ✅
- Detects Event description conflicts
- Detects Property validation rules conflicts  
- Handles null vs undefined validation rules (bug fix)

### **Entity Reuse** ✅
- Property reuse across multiple events in same tracking plan
- Proper relationship management in junction tables

### **Transaction Management** ✅
- Rollback on errors during complex operations
- Data integrity maintenance

### **Validation & Error Handling** ✅
- Custom error propagation
- HTTP status code mapping
- Validation rule enforcement

## 🚀 **Running Tests**

### **All Tests**
```bash
npm test
```

### **Unit Tests Only**
```bash
npx vitest __tests__/unit/
```

### **E2E Tests Only** 
```bash
npx vitest __tests__/e2e/
```

### **With Coverage**
```bash
npm run test:coverage
```

### **Watch Mode**
```bash
npm run test:watch
```

### **Specific Test File**
```bash
npx vitest __tests__/unit/services/TrackingPlanService.test.ts
```

## 📊 **Test Data**

### **Mock Factories**
- `createMockEvent()`: Creates test Event entities
- `createMockProperty()`: Creates test Property entities  
- `createMockTrackingPlan()`: Creates test TrackingPlan entities

### **Mock Services**
- `mockEventService`: Mocked EventService methods
- `mockPropertyService`: Mocked PropertyService methods
- `mockTrackingPlanService`: Mocked TrackingPlanService methods

### **Response Factories**
- `createSuccessResponse()`: Mock success responses
- `createErrorResponse()`: Mock error responses

## 🧹 **Test Environment**

### **Database**
- Uses real PostgreSQL database for E2E tests
- Each test starts with clean database state
- Transactions are properly tested

### **Mocking Strategy**
- **Unit tests**: Mock all external dependencies
- **E2E tests**: Real database, real HTTP requests
- **Isolation**: Each test is independent

## 📝 **Test Scenarios Covered**

### **Based on Manual curl Tests** 
1. ✅ Basic CRUD operations (Events, Properties, TrackingPlans)
2. ✅ Auto-creation with new entities
3. ✅ Entity reuse with existing entities  
4. ✅ Event description conflict detection
5. ✅ Property validation rules conflict detection
6. ✅ Property reuse within same tracking plan
7. ✅ Complex multi-event tracking plans
8. ✅ Transaction rollback on errors
9. ✅ Unique constraint validation
10. ✅ Null vs undefined validation rules handling

## 🎯 **Coverage Goals**

- **Business Logic**: 100% of complex auto-creation logic
- **Error Paths**: All conflict detection scenarios
- **Edge Cases**: Null/undefined handling, validation rules
- **Integration**: Full request-response workflows

## 🛠️ **Adding New Tests**

### **Unit Test Template**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YourService } from '../../../src/services/YourService';
import { mockRepository } from '../../mocks/repositories';

vi.mock('../../../src/repositories/YourRepository');

describe('YourService', () => {
  let service: YourService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    service = new YourService();
  });
  
  it('should handle your test case', async () => {
    // Arrange
    // Act  
    // Assert
  });
});
```

### **E2E Test Template**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../setup';

describe('Your E2E Test', () => {
  beforeEach(async () => {
    // Database cleanup handled by setup
  });
  
  it('should handle full workflow', async () => {
    const response = await request(app)
      .post('/api/v1/your-endpoint')
      .send(testData)
      .expect(201);
      
    expect(response.body.success).toBe(true);
  });
});
``` 