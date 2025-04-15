# Testing Guide for Service Offering Microservice

This document provides guidance on how to run tests, understand test coverage, and add new tests to the service offering microservice.

## Table of Contents

1. [Testing Setup](#testing-setup)
2. [Running Tests](#running-tests)
3. [Understanding Test Coverage](#understanding-test-coverage)
4. [Creating New Tests](#creating-new-tests)
5. [Mocking Dependencies](#mocking-dependencies)
6. [Test File Organization](#test-file-organization)
7. [Troubleshooting](#troubleshooting)

## Testing Setup

This project uses Jest as the test runner and assertion library. The setup includes:

- **Jest**: For running tests and assertions
- **Supertest**: For HTTP endpoint testing
- **Babel**: For transpiling code during tests
- **Mock files**: For simulating external dependencies like the database and S3

### Install Dependencies

Make sure your project has all the testing dependencies installed:

```bash
npm install --save-dev jest supertest @types/jest @babel/preset-env babel-jest
```

### Configuration Files

The testing setup uses several configuration files:

1. **jest.config.js**: Main Jest configuration
2. **jest.setup.js**: Sets up environment variables and global mocks for testing
3. **.babelrc**: Configures Babel for transpiling code during tests
4. ****mocks**/**: Directory containing mock implementations of external dependencies

## Running Tests

### Run All Tests

To run all tests in the project:

```bash
npm test
```

### Run Tests in Watch Mode

To run tests in watch mode (tests will rerun when files change):

```bash
npm run test:watch
```

### Run Tests with Coverage

To run tests and generate a coverage report:

```bash
npm run test:coverage
```

### Run a Specific Test File

To run a specific test file:

```bash
npm test -- src/utils/__tests__/appError.test.js
```

### Run Tests Matching a Pattern

To run tests with names matching a pattern:

```bash
npm test -- -t "should create a service category"
```

## Understanding Test Coverage

Test coverage reports show how much of your code is covered by tests. After running `npm run test:coverage`, you can view the coverage report in the following ways:

1. **Terminal**: A summary will be displayed in the terminal
2. **HTML Report**: Open `/coverage/lcov-report/index.html` in a browser for a detailed visual report

The coverage report has several metrics:

- **Statements**: Percentage of statements executed during tests
- **Branches**: Percentage of code branches (if/else statements) executed
- **Functions**: Percentage of functions called
- **Lines**: Percentage of code lines executed

### Understanding Coverage Gaps

Areas with low coverage may indicate:

1. Missing tests for error handling
2. Untested edge cases
3. Code that's difficult to test (may need refactoring)
4. Legacy code without tests

Aim for at least 80% coverage across all metrics, with higher coverage for critical business logic.

## Creating New Tests

### Test File Naming and Location

Test files should:

- Be located in a `__tests__` folder in the same directory as the code being tested
- Have the same name as the file being tested, with a `.test.js` suffix

Example:

```
src/
  └── utils/
      ├── appError.js
      └── __tests__/
          └── appError.test.js
```

### Basic Test Structure

Each test file should follow this structure:

```javascript
// Import the module to test
const moduleToTest = require('../moduleToTest');

// Mock dependencies if needed
jest.mock('../../dependencyModule');

describe('ModuleName', () => {
  // Setup before each test if needed
  beforeEach(() => {
    // Setup code
    jest.clearAllMocks();
  });

  // Group related tests
  describe('functionName', () => {
    it('should describe expected behavior', () => {
      // Arrange - set up test data
      const testData = {
        /* ... */
      };

      // Act - call the function being tested
      const result = moduleToTest.functionName(testData);

      // Assert - verify the results
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors correctly', () => {
      // Test error cases
    });
  });
});
```

### Testing Different Components

#### Testing Utility Functions

For utility functions, focus on input/output and edge cases:

```javascript
it('should handle empty input', () => {
  const result = formatUtils.formatData(null);
  expect(result).toEqual({
    /* expected output */
  });
});
```

#### Testing Services

For services, mock external dependencies and test business logic:

```javascript
it('should call the database with correct parameters', async () => {
  prisma.serviceCategory.findUnique.mockResolvedValue(mockData);

  await serviceToTest.getServiceCategoryById('test-id');

  expect(prisma.serviceCategory.findUnique).toHaveBeenCalledWith({
    where: { serviceCategoryId: 'test-id' },
  });
});
```

#### Testing Controllers

For controllers, test the interaction with request, response, and services:

```javascript
it('should return 200 status with data', async () => {
  serviceCategoryService.getAllServiceCategories.mockResolvedValue(mockData);

  await controller.getAllCategories(req, res, next);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalled();
});
```

#### Testing Middleware

For middleware, test that it modifies the request/response as expected:

```javascript
it('should add requestId to the request object', () => {
  const req = {};
  const res = { setHeader: jest.fn(), on: jest.fn() };
  const next = jest.fn();

  middleware(req, res, next);

  expect(req.requestId).toBeDefined();
  expect(next).toHaveBeenCalled();
});
```

#### Testing Routes (Integration)

For routes, use supertest to test API endpoints:

```javascript
it('should return 200 for a valid request', async () => {
  const response = await request(app)
    .get('/api/v1/categories')
    .set('Authorization', 'Bearer mock-token');

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

## Mocking Dependencies

### Mock Files

Create mock files in a `__mocks__` folder at the root level or adjacent to the modules you want to mock:

```javascript
// __mocks__/aws-sdk.js
const mockS3Instance = {
  upload: jest.fn().mockImplementation((params, callback) => {
    callback(null, { Location: 'https://mock-url.com/file.jpg' });
  }),
  // Other methods...
};

class S3 {
  constructor() {
    return mockS3Instance;
  }
}

module.exports = { S3 };
```

### Inline Mocks

You can also create mocks inline in your test files:

```javascript
jest.mock('../serviceCategoryService', () => ({
  createServiceCategory: jest.fn(),
  getAllServiceCategories: jest.fn(),
}));
```

### Mock Function Implementations

Set up mock implementations for test scenarios:

```javascript
// Success case
serviceCategoryService.getServiceCategoryById.mockResolvedValue({
  id: 'test-id',
  name: 'Test Category',
});

// Error case
serviceCategoryService.getServiceCategoryById.mockRejectedValue(
  new Error('Service error'),
);
```

## Test File Organization

Organize your test files to match your source code structure:

```
src/
  ├── controllers/
  │   ├── __tests__/
  │   │   ├── errorController.test.js
  │   │   └── serviceCategoryController.test.js
  │   ├── errorController.js
  │   └── serviceCategoryController.js
  ├── middlewares/
  │   ├── __tests__/
  │   │   ├── loggerMiddleware.test.js
  │   │   └── requestIdMiddleware.test.js
  │   ├── loggerMiddleware.js
  │   └── requestIdMiddleware.js
  └── ...
```

## Troubleshooting

### Common Issues and Solutions

1. **Tests failing with import/require errors**

   - Check path references
   - Ensure you're using the correct import style (require vs import)

2. **Jest can't find tests**

   - Verify test file naming (should end with `.test.js` or `.spec.js`)
   - Check jest.config.js testMatch patterns

3. **Mock not working**

   - Ensure the mock is defined before it's used
   - Verify mock path is correct
   - Use `jest.clearAllMocks()` in beforeEach to reset mock state

4. **Tests passing individually but failing when run together**

   - Check for shared state between tests
   - Use beforeEach/afterEach to reset state

5. **Timeouts in async tests**
   - Verify your async functions are properly awaited
   - Check for unresolved promises
   - Increase timeout with `jest.setTimeout(10000)`

### Debugging Tests

To debug tests:

1. **Add console logs**: Add `console.log()` statements to see values during test execution
2. **Use debugger**: Add `debugger` statements and run with `node --inspect-brk node_modules/.bin/jest`
3. **Use VSCode debugger**: Create a launch.json configuration for Jest

Example VSCode launch.json:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--detectOpenHandles"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Getting Help

If you're stuck on a testing issue:

1. Check the Jest documentation: https://jestjs.io/docs/getting-started
2. Search for similar issues on Stack Overflow
3. Review the test examples in this codebase
4. Ask for help from team members who have written tests
