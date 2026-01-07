# Test Suite

This directory contains unit tests for the workflow engine backend.

## Running Tests

```bash
# Run all tests
pytest backend/tests/

# Run with coverage
pytest backend/tests/ --cov=backend --cov-report=html

# Run specific test file
pytest backend/tests/test_services.py

# Run with verbose output
pytest backend/tests/ -v
```

## Test Structure

- `conftest.py` - Pytest fixtures and configuration
- `test_config.py` - Configuration management tests
- `test_logger.py` - Logging infrastructure tests
- `test_exceptions.py` - Custom exception classes tests
- `test_repositories.py` - Repository pattern tests
- `test_services.py` - Service layer tests
- `test_dependencies.py` - Dependency injection tests

## Test Coverage

The test suite covers:

1. **Configuration Management** - Settings loading, environment variables, defaults
2. **Logging Infrastructure** - Logger setup, log levels, file output
3. **Exception Classes** - All custom exception types and their properties
4. **Repository Pattern** - CRUD operations, query methods, data access
5. **Service Layer** - Business logic, workflow operations, validation
6. **Dependency Injection** - Service and repository dependencies

## Fixtures

- `db_session` - In-memory SQLite database session (cleaned after each test)
- `sample_workflow_data` - Sample workflow data for testing
- `sample_user` - Sample user data for testing

## Notes

- Tests use an in-memory SQLite database for fast execution
- Each test gets a fresh database session
- All async tests are properly configured with pytest-asyncio

