# Contributing Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

Thank you for your interest in contributing to the workflow engine! This guide will help you get started with contributing code, documentation, bug reports, or feature requests.

## Real-World Contribution Examples

### Example 1: Adding a New Node Type

**Scenario:** Contributor wants to add a "Data Transform" node type

**Steps:**
1. **Create Agent Class:**
```python
# backend/agents/data_transform_agent.py
from .base import BaseAgent

class DataTransformAgent(BaseAgent):
    async def execute(self, inputs: Dict[str, Any]) -> Any:
        # Transform input data
        return transformed_data
```

2. **Register Agent:**
```python
# backend/agents/registry.py
from .data_transform_agent import DataTransformAgent

AgentRegistry.register_agent(NodeType.DATA_TRANSFORM, DataTransformAgent)
```

3. **Add Tests:**
```python
# backend/tests/test_data_transform_agent.py
@pytest.mark.asyncio
async def test_data_transform_agent():
    agent = DataTransformAgent(node_config)
    result = await agent.execute({"data": [1, 2, 3]})
    assert result == [2, 4, 6]  # Doubled values
```

4. **Update Documentation:**
- Add to Node Types Reference
- Add example workflow
- Update API documentation

### Example 2: Fixing a Bug

**Scenario:** Workflow execution fails silently when node has invalid config

**Bug Report:**
```markdown
## Description
Workflow execution fails silently when agent node has missing model config.

## Steps to Reproduce
1. Create workflow with agent node
2. Don't set model in agent_config
3. Execute workflow
4. Execution shows "failed" but no error message

## Expected Behavior
Should show clear error: "Model not configured for agent node"
```

**Fix:**
```python
# backend/agents/unified_llm_agent.py
def __init__(self, node: Node, ...):
    if not agent_config or not agent_config.model:
        raise ValueError(
            f"Node {node.id} requires model configuration. "
            "Please set model in agent_config."
        )
```

**Test:**
```python
def test_agent_without_model_raises_error():
    node = Node(id="node-1", type="agent", agent_config={})
    with pytest.raises(ValueError, match="requires model"):
        UnifiedLLMAgent(node)
```

**Contributing Process:**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request
6. Address review feedback

**Need Help?**
- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Review [Testing Guide](./TESTING_GUIDE.md) for test requirements
- See [Real-World Examples](#real-world-contribution-examples) for practical scenarios

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

### Reporting Issues

If you experience or witness unacceptable behavior, please report it to the project maintainers.

## Getting Started

### Prerequisites

- Python 3.12+ for backend development
- Node.js 18+ for frontend development
- Git for version control
- Basic understanding of FastAPI, React, and TypeScript

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/cursor-test.git
   cd cursor-test
   ```

2. **Set Up Backend**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Install development dependencies (if available)
   # pip install pytest pytest-asyncio pytest-cov pytest-mock
   ```

3. **Set Up Frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure Environment**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run Tests**
   ```bash
   # Backend
   pytest
   
   # Frontend
   cd frontend
   npm test
   ```

## Development Workflow

### 1. Create a Branch

```bash
# Create feature branch from main
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b bugfix/issue-description
```

**Branch Naming:**
- `feature/` - New features
- `bugfix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Make Changes

**Follow Code Style:**
- Backend: Follow PEP 8, use type hints
- Frontend: Follow ESLint rules, use TypeScript
- Write clear, descriptive commit messages

**Code Quality:**
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass
- Check code coverage

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add workflow validation endpoint"
```

**Commit Message Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add workflow execution cancellation

Add endpoint to cancel running executions with proper cleanup
and status updates.

Closes #123
```

```
fix: handle null workflow definition gracefully

Prevent crashes when workflow definition is null or missing.
Add validation and default empty definition.

Fixes #456
```

### 4. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub
# Fill out PR template
# Request review
```

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Commit messages follow format
- [ ] PR description is clear and complete

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated Checks**: CI runs tests and linting
2. **Code Review**: Maintainers review code
3. **Feedback**: Address review comments
4. **Approval**: After approval, PR is merged

## Coding Standards

### Backend (Python)

**Style:**
- Follow PEP 8
- Use type hints
- Maximum line length: 100 characters
- Use `black` for formatting (if configured)

**Example:**
```python
from typing import Optional, Dict, Any
from fastapi import HTTPException, status

async def get_workflow(
    workflow_id: str,
    db: AsyncSession
) -> Optional[WorkflowDB]:
    """Get workflow by ID"""
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    return result.scalar_one_or_none()
```

**Naming:**
- Functions: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private: `_leading_underscore`

### Frontend (TypeScript/React)

**Style:**
- Use TypeScript strict mode
- Follow ESLint rules
- Use functional components with hooks
- Prefer named exports

**Example:**
```typescript
import { useState, useEffect } from 'react';

interface WorkflowCardProps {
  workflow: Workflow;
  onSelect: (id: string) => void;
}

export function WorkflowCard({ workflow, onSelect }: WorkflowCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <div onClick={() => onSelect(workflow.id)}>
      {workflow.name}
    </div>
  );
}
```

**Naming:**
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `PascalCase.tsx` (components), `camelCase.ts` (utilities)

## Testing Requirements

### Backend Tests

**Required:**
- Unit tests for new functions/methods
- Integration tests for API endpoints
- Test coverage >80% for new code

**Example:**
```python
@pytest.mark.asyncio
async def test_create_workflow():
    workflow_data = {"name": "Test", "definition": {}}
    result = await workflow_service.create_workflow(workflow_data)
    assert result.name == "Test"
```

### Frontend Tests

**Required:**
- Component tests for new components
- Hook tests for custom hooks
- Service tests for API calls

**Example:**
```typescript
describe('WorkflowCard', () => {
  it('should render workflow name', () => {
    const workflow = { id: '1', name: 'Test' };
    render(<WorkflowCard workflow={workflow} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Documentation

### Code Documentation

**Docstrings (Python):**
```python
def create_workflow(
    workflow_data: Dict[str, Any],
    user_id: Optional[str] = None
) -> WorkflowDB:
    """
    Create a new workflow.
    
    Args:
        workflow_data: Workflow data including name and definition
        user_id: Optional user ID for ownership
        
    Returns:
        Created workflow object
        
    Raises:
        WorkflowValidationError: If workflow data is invalid
    """
```

**Comments (TypeScript):**
```typescript
/**
 * Fetches workflow data from the API
 * @param workflowId - The ID of the workflow to fetch
 * @returns Promise resolving to workflow data
 */
async function fetchWorkflow(workflowId: string): Promise<Workflow> {
  // Implementation
}
```

### Documentation Updates

When adding features, update:
- README.md (if applicable)
- API documentation (OpenAPI/Swagger)
- Developer guides
- User documentation

## Bug Reports

### Reporting Bugs

**Use GitHub Issues:**
1. Check if bug already reported
2. Create new issue
3. Fill out bug report template

**Bug Report Template:**
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 13.0]
- Python: [e.g., 3.12.0]
- Node: [e.g., 18.17.0]
- Version: [e.g., 1.0.0]

## Additional Context
Screenshots, logs, etc.
```

## Feature Requests

### Suggesting Features

**Feature Request Template:**
```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches considered

## Additional Context
Mockups, examples, etc.
```

## Architecture Guidelines

### Adding New Features

**Backend:**
1. Follow SOLID principles
2. Use repository pattern for data access
3. Use service layer for business logic
4. Add proper error handling
5. Write tests

**Frontend:**
1. Follow component composition
2. Use custom hooks for logic
3. Keep components focused
4. Use TypeScript types
5. Write tests

### Extending Existing Features

**Before Modifying:**
1. Understand existing code
2. Check for related issues/PRs
3. Consider backward compatibility
4. Update tests
5. Update documentation

## Code Review Guidelines

### For Contributors

**Before Requesting Review:**
- Self-review your code
- Ensure tests pass
- Check for typos/comments
- Update documentation

**During Review:**
- Be open to feedback
- Ask questions if unclear
- Address all comments
- Be patient

### For Reviewers

**Review Checklist:**
- [ ] Code follows style guidelines
- [ ] Logic is correct
- [ ] Tests are adequate
- [ ] Documentation updated
- [ ] No security issues
- [ ] Performance considered

**Provide Feedback:**
- Be constructive and respectful
- Explain reasoning
- Suggest improvements
- Approve when ready

## Release Process

### Versioning

Follow [Semantic Versioning](https://semver.org/):
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared

## Getting Help

### Resources

- **Documentation**: Check `docs/` directory
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Email**: Contact maintainers

### Questions

Don't hesitate to ask:
- Clarification on requirements
- Help with implementation
- Code review feedback
- Architecture decisions

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉

## Related Documentation

- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Backend development
- [Frontend Developer Guide](./FRONTEND_DEVELOPER_GUIDE.md) - Frontend development
- [Testing Guide](./TESTING_GUIDE.md) - Testing practices
- [Architecture](./ARCHITECTURE.md) - System architecture
