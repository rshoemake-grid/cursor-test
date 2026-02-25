# Testing Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This guide covers testing strategies, tools, and best practices for the workflow engine. The project uses pytest for backend testing and Jest for frontend testing.

## Real-World Testing Examples

### Example 1: Testing Workflow Creation

**Scenario:** User creates a new workflow via API

```python
@pytest.mark.asyncio
async def test_create_workflow_real_world():
    """Real-world workflow creation test"""
    # Arrange: User wants to create a research workflow
    workflow_data = {
        "name": "Research Assistant",
        "description": "Automated research workflow",
        "definition": {
            "nodes": [
                {
                    "id": "node-1",
                    "type": "agent",
                    "agent_config": {
                        "model": "gpt-4",
                        "prompt": "Research topic: {{topic}}"
                    }
                }
            ],
            "edges": []
        }
    }
    
    # Act: Create workflow
    response = await client.post("/api/workflows", json=workflow_data)
    
    # Assert: Verify workflow created correctly
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Research Assistant"
    assert len(data["definition"]["nodes"]) == 1
    assert data["definition"]["nodes"][0]["type"] == "agent"
```

### Example 2: Testing Execution with WebSocket Updates

**Scenario:** User executes workflow and receives real-time updates

```python
@pytest.mark.asyncio
async def test_execution_with_websocket_updates():
    """Test execution with WebSocket streaming"""
    # Arrange: Create workflow and start execution
    workflow = await create_test_workflow()
    execution = await start_execution(workflow.id)
    
    # Act: Connect WebSocket and monitor execution
    messages_received = []
    async with websockets.connect(
        f"ws://localhost:8000/api/ws/executions/{execution.id}"
    ) as ws:
        # Wait for status updates
        async for message in ws:
            data = json.loads(message)
            messages_received.append(data)
            
            if data["type"] == "completion":
                break
    
    # Assert: Verify all expected messages received
    assert len(messages_received) > 0
    assert messages_received[0]["type"] == "status"
    assert messages_received[0]["status"] == "running"
    
    # Verify node updates received
    node_updates = [m for m in messages_received if m["type"] == "node_update"]
    assert len(node_updates) > 0
    
    # Verify completion message
    completion = messages_received[-1]
    assert completion["type"] == "completion"
    assert completion["result"]["status"] == "completed"
```

### Example 3: Testing Error Handling

**Scenario:** Workflow execution fails due to invalid API key

```python
@pytest.mark.asyncio
async def test_execution_failure_handling():
    """Test execution failure with proper error handling"""
    # Arrange: Workflow with invalid API key configured
    workflow = await create_test_workflow()
    await set_invalid_api_key()
    
    # Act: Start execution
    execution = await start_execution(workflow.id)
    
    # Wait for execution to fail
    await asyncio.sleep(2)
    
    # Assert: Verify execution failed with proper error
    execution = await get_execution(execution.id)
    assert execution["status"] == "failed"
    assert "API key" in execution["error"].lower()
    assert execution["error_code"] == "INVALID_API_KEY"
```

**Testing Stack:**
- **Backend**: pytest, pytest-asyncio, pytest-cov
- **Frontend**: Jest, React Testing Library
- **Coverage**: Aim for >80% on critical paths

**Quick Start:**
```bash
# Backend tests
pytest

# Frontend tests  
cd frontend && npm test

# With coverage
pytest --cov=backend
npm test -- --coverage
```

## Testing Philosophy

### Principles

1. **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E tests
2. **Fast Feedback**: Tests should run quickly during development
3. **Isolation**: Tests should be independent and not rely on external services
4. **Coverage**: Aim for >80% code coverage on critical paths
5. **Maintainability**: Tests should be easy to read and update

## Backend Testing

### Setup

**Install Dependencies:**
```bash
pip install pytest pytest-asyncio pytest-cov pytest-mock
```

**Configuration (`pytest.ini`):**
```ini
[pytest]
testpaths = backend/tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
addopts = 
    -v
    --tb=short
    --strict-markers
    --disable-warnings
```

### Running Tests

**Run All Tests:**
```bash
pytest
```

**Run Specific Test File:**
```bash
pytest backend/tests/test_workflow_service.py
```

**Run Specific Test:**
```bash
pytest backend/tests/test_workflow_service.py::test_create_workflow
```

**Run with Coverage:**
```bash
pytest --cov=backend --cov-report=html --cov-report=term
```

**Run with Verbose Output:**
```bash
pytest -v
```

**Run Tests Matching Pattern:**
```bash
pytest -k "test_workflow"
```

### Test Structure

**Example Test File:**
```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.services.workflow_service import WorkflowService
from backend.exceptions import WorkflowNotFoundError

@pytest.fixture
def mock_db():
    """Mock database session"""
    db = AsyncMock()
    return db

@pytest.fixture
def workflow_service(mock_db):
    """Workflow service instance"""
    return WorkflowService(mock_db)

@pytest.mark.asyncio
async def test_create_workflow(workflow_service, mock_db):
    """Test workflow creation"""
    # Arrange
    workflow_data = {"name": "Test Workflow", "definition": {}}
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    
    # Act
    result = await workflow_service.create_workflow(workflow_data)
    
    # Assert
    assert result.name == "Test Workflow"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_get_workflow_not_found(workflow_service, mock_db):
    """Test workflow not found error"""
    # Arrange
    mock_db.execute.return_value.scalar_one_or_none.return_value = None
    
    # Act & Assert
    with pytest.raises(WorkflowNotFoundError):
        await workflow_service.get_workflow("non-existent-id")
```

### Test Patterns

#### Async Testing

```python
@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result is not None
```

#### Mocking Database

```python
from unittest.mock import AsyncMock, MagicMock

@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    return db
```

#### Mocking External Services

```python
from unittest.mock import patch

@patch('backend.services.llm_client_factory.LLMClientFactory')
async def test_with_mocked_llm(mock_factory):
    mock_client = AsyncMock()
    mock_factory.create_client.return_value = mock_client
    # Test code
```

#### Testing Exceptions

```python
import pytest
from backend.exceptions import WorkflowNotFoundError

async def test_raises_exception():
    with pytest.raises(WorkflowNotFoundError) as exc_info:
        await function_that_raises()
    assert "Workflow not found" in str(exc_info.value)
```

### Test Fixtures

**Common Fixtures (`conftest.py`):**
```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock

@pytest.fixture
def db_session():
    """Database session fixture"""
    return AsyncMock(spec=AsyncSession)

@pytest.fixture
def sample_workflow():
    """Sample workflow data"""
    return {
        "id": "wf-123",
        "name": "Test Workflow",
        "definition": {
            "nodes": [],
            "edges": []
        }
    }
```

### Coverage Goals

**Target Coverage:**
- Critical paths: >90%
- Business logic: >80%
- Utilities: >70%
- Overall: >80%

**Check Coverage:**
```bash
pytest --cov=backend --cov-report=term-missing
```

## Frontend Testing

### Setup

**Install Dependencies:**
```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Configuration (`jest.config.cjs`):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-jest.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
};
```

### Running Tests

**Run All Tests:**
```bash
npm test
```

**Run in Watch Mode:**
```bash
npm test -- --watch
```

**Run with Coverage:**
```bash
npm test -- --coverage
```

**Run Specific Test:**
```bash
npm test -- useDataFetching.test.ts
```

**Run Tests Matching Pattern:**
```bash
npm test -- --testNamePattern="should fetch data"
```

### Test Structure

**Example Test File:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDataFetching } from './useDataFetching';

describe('useDataFetching', () => {
  it('should fetch data successfully', async () => {
    // Arrange
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    });
    global.fetch = mockFetch;

    // Act
    const { result } = renderHook(() => useDataFetching('/api/data'));

    // Assert
    await waitFor(() => {
      expect(result.current.data).toEqual({ data: 'test' });
    });
  });

  it('should handle errors', async () => {
    // Arrange
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    // Act
    const { result } = renderHook(() => useDataFetching('/api/data'));

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

### Test Patterns

#### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { WorkflowCard } from './WorkflowCard';

describe('WorkflowCard', () => {
  it('should render workflow name', () => {
    const workflow = { id: '1', name: 'Test Workflow' };
    render(<WorkflowCard workflow={workflow} />);
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
  });
});
```

#### Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkflow } from './useWorkflow';

describe('useWorkflow', () => {
  it('should load workflow', async () => {
    const { result } = renderHook(() => useWorkflow('wf-123'));
    
    await waitFor(() => {
      expect(result.current.workflow).toBeTruthy();
    });
  });
});
```

#### Mocking API Calls

```typescript
import { jest } from '@jest/globals';

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

#### Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react';

it('should handle async operations', async () => {
  const { result } = renderHook(() => useAsyncOperation());
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  
  expect(result.current.data).toBeTruthy();
});
```

### Test Utilities

**Setup File (`src/test/setup-jest.ts`):**
```typescript
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Integration Testing

### API Integration Tests

```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_create_workflow_api():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/workflows",
            json={"name": "Test", "definition": {}}
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Test"
```

### Database Integration Tests

```python
import pytest
from backend.database.db import get_db
from backend.database.models import WorkflowDB

@pytest.mark.asyncio
async def test_workflow_persistence():
    async for db in get_db():
        workflow = WorkflowDB(name="Test", definition={})
        db.add(workflow)
        await db.commit()
        
        result = await db.get(WorkflowDB, workflow.id)
        assert result.name == "Test"
```

## End-to-End Testing

### Manual E2E Testing

**Test Scenarios:**
1. Create workflow via UI
2. Execute workflow
3. View execution results
4. Edit workflow
5. Delete workflow

**Checklist:**
- [ ] Workflow creation works
- [ ] Execution starts and completes
- [ ] Results display correctly
- [ ] Error handling works
- [ ] WebSocket updates received

### Automated E2E Testing (Future)

Consider using:
- **Playwright**: Browser automation
- **Cypress**: E2E testing framework
- **Selenium**: WebDriver-based testing

## Mutation Testing

### Stryker (Frontend)

**Configuration:**
```json
{
  "mutator": {
    "plugins": ["typescript"],
    "excludedMutations": ["StringLiteral"]
  },
  "testRunner": "jest",
  "coverageAnalysis": "perTest"
}
```

**Run Mutation Tests:**
```bash
npm run test:mutation
```

**Interpretation:**
- High mutation score = good test quality
- Low mutation score = tests may not catch bugs

## Test Organization

### Backend Structure

```
backend/tests/
├── conftest.py              # Shared fixtures
├── test_workflow_service.py  # Workflow service tests
├── test_execution_service.py # Execution service tests
├── test_agents.py           # Agent tests
└── integration/             # Integration tests
    └── test_api.py
```

### Frontend Structure

```
frontend/src/
├── components/
│   └── WorkflowCard.test.tsx
├── hooks/
│   └── useWorkflow.test.ts
└── services/
    └── api.test.ts
```

## Best Practices

### 1. Test Naming

**Good:**
```python
def test_create_workflow_with_valid_data():
def test_create_workflow_raises_error_on_duplicate_name():
```

**Bad:**
```python
def test1():
def test_workflow():
```

### 2. Arrange-Act-Assert Pattern

```python
def test_example():
    # Arrange
    data = {"name": "Test"}
    
    # Act
    result = function(data)
    
    # Assert
    assert result.name == "Test"
```

### 3. Test Isolation

**Good:**
```python
# Each test is independent
def test_a():
    # Uses fresh fixtures
    pass

def test_b():
    # Uses fresh fixtures
    pass
```

**Bad:**
```python
# Tests depend on each other
shared_state = {}

def test_a():
    shared_state['value'] = 1

def test_b():
    assert shared_state['value'] == 1  # Depends on test_a
```

### 4. Mock External Dependencies

```python
@patch('external_service.call')
def test_with_mock(mock_call):
    mock_call.return_value = "mocked"
    # Test code
```

### 5. Test Edge Cases

```python
def test_empty_input():
    result = function([])
    assert result == []

def test_none_input():
    with pytest.raises(ValueError):
        function(None)
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-cov
      - run: pytest --cov=backend --cov-report=xml
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
```

## Troubleshooting

### Common Issues

**Tests Hang:**
- Check for unclosed async operations
- Verify database connections are closed
- Check for infinite loops

**Flaky Tests:**
- Ensure tests are isolated
- Use fixed timestamps/mocks
- Avoid race conditions

**Coverage Not Increasing:**
- Check coverage report for uncovered lines
- Add tests for edge cases
- Verify test execution

## Related Documentation

- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Testing patterns
- [Frontend Developer Guide](./FRONTEND_DEVELOPER_GUIDE.md) - Frontend testing
- [QA Testing Guide](./QA_TESTING_GUIDE.md) - Manual testing procedures
