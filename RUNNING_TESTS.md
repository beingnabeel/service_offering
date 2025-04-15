# Running Tests for Service Offering Microservice

This guide provides step-by-step instructions for running tests in the Service Offering Microservice.

## Initial Setup

Before running tests, ensure you have installed all the necessary dependencies:

```bash
npm install
npm install --save-dev jest supertest @types/jest @babel/preset-env babel-jest
```

## Running the First Test

1. Let's verify our setup by running a simple test for the `AppError` utility:

```bash
npx jest src/utils/__tests__/appError.test.js
```

You should see output showing that the tests are running and passing.

## Running All Tests

To run all tests in the project:

```bash
npm test
```

The output will show a summary of test results, including:

- Total number of tests run
- Number of tests passed
- Time taken to run the tests

## Generating Coverage Reports

To run tests with code coverage:

```bash
npm run test:coverage
```

This will:

1. Run all tests
2. Generate a coverage report showing how much of your code is covered by tests
3. Create an HTML report in `coverage/lcov-report/index.html` for detailed viewing

Open this HTML file in a browser to see:

- Line coverage
- Branch coverage
- Function coverage
- Statements covered

## Interpreting Coverage Reports

When viewing the coverage report:

- Green: Code that is covered by tests
- Red: Code that is not covered by tests
- Yellow: Branches that are partially covered

Click on individual files to see exactly which lines are covered.

## Running Tests in Watch Mode

During development, it's helpful to run tests in watch mode, which automatically reruns tests when files change:

```bash
npm run test:watch
```

This allows you to:

- See immediate feedback as you make changes
- Focus on specific tests by pressing `p` and entering a pattern
- Run only failed tests by pressing `f`

## Testing a Specific Component

If you want to focus on testing a specific component or file:

```bash
# Test a specific file
npx jest src/controllers/__tests__/serviceCategoryController.test.js

# Test files matching a pattern
npx jest src/services

# Run tests with names matching a pattern
npx jest -t "should create a service category"
```

## Troubleshooting

If you encounter issues:

1. **"Cannot find module" errors**:

   - Ensure all dependencies are installed
   - Check file paths in import/require statements

2. **Timeout errors**:

   - Async tests might be taking too long
   - Add `jest.setTimeout(10000)` to increase timeout

3. **Mock issues**:
   - Verify mock implementations are set up correctly
   - Use `console.log` to debug mock behavior

## Example Test Run Output

A successful test run should look something like this:

```
PASS  src/utils/__tests__/appError.test.js
PASS  src/utils/__tests__/catchAsync.test.js
PASS  src/utils/__tests__/responseFormatter.test.js
PASS  src/middlewares/__tests__/requestIdMiddleware.test.js
PASS  src/services/__tests__/serviceCategoryService.test.js
PASS  src/controllers/__tests__/serviceCategoryController.test.js
PASS  src/routes/__tests__/serviceCategoryRoutes.test.js
PASS  src/middlewares/__tests__/uploadMiddleware.test.js
PASS  src/controllers/__tests__/errorController.test.js

Test Suites: 9 passed, 9 total
Tests:       58 passed, 58 total
Snapshots:   0 total
Time:        3.52 s
Ran all test suites.
```

And a coverage report summary:

```
-----------------------------|---------|----------|---------|---------|--------------------
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------|---------|----------|---------|---------|--------------------
All files                    |   85.32 |    76.92 |   83.87 |   85.42 |
 controllers                 |   91.17 |    85.71 |   88.89 |   91.17 |
  errorController.js         |   88.23 |    78.95 |   85.71 |   88.23 | 45,87,108,152,178
  serviceCategoryController.js |   95.24 |   100.00 |  100.00 |   95.24 | 90,99
 middlewares                 |   87.50 |    77.78 |   87.50 |   87.50 |
  loggerMiddleware.js        |   80.00 |    66.67 |   75.00 |   80.00 | 28,39
  requestIdMiddleware.js     |  100.00 |   100.00 |  100.00 |  100.00 |
  uploadMiddleware.js        |   86.36 |    75.00 |   90.00 |   86.36 | 45,71,118
  validationMiddlewares.js   |   83.33 |    75.00 |   83.33 |   83.33 | 31,65,78
 services                    |   84.61 |    75.00 |   80.00 |   84.61 |
  serviceCategoryService.js  |   86.95 |    76.92 |   83.33 |   86.95 | 102,154,175,209
  serviceTypeService.js      |   78.57 |    66.67 |   66.67 |   78.57 | 26,29,37
 utils                       |   78.00 |    69.23 |   78.95 |   78.00 |
  appError.js                |   85.71 |    78.95 |   88.89 |   85.71 | 108,155,187
  catchAsync.js              |  100.00 |   100.00 |  100.00 |  100.00 |
  responseFormatter.js       |   87.50 |    75.00 |   85.71 |   87.50 | 45,98
  validators.js              |   66.67 |    50.00 |   66.67 |   66.67 | 12,22,30
-----------------------------|---------|----------|---------|---------|--------------------
```
