# Contributing guide

Thank you for contributing to the workflow engine.

## What to run before a PR

```bash
cd backend-java && ./gradlew test
cd frontend && CI=true npm test -- --watchAll=false
python3 -m pytest scripts/ -q
```

## Project layout

- **`backend-java/`** — Spring Boot API (primary server).  
- **`frontend/`** — React UI.  
- **`scripts/`** — Small Python utilities; keep them stdlib-friendly when possible.

## Guidelines

1. **Focused changes** — one concern per PR when practical.  
2. **Tests** — add or update tests with bug fixes and new behavior.  
3. **Secrets** — never commit keys; use `.env` locally only (gitignored).  
4. **Docs** — update [API Reference](./API_REFERENCE.md) or [Configuration Reference](./CONFIGURATION_REFERENCE.md) when you change user-visible behavior.

## Process

1. Fork / branch from `main`.  
2. Implement with tests.  
3. Open a PR with a clear description of intent and risk.  
4. Address review feedback.

## Code of conduct

Be respectful and constructive. Report unacceptable behavior to maintainers.

## Help

- [Testing Guide](./TESTING_GUIDE.md)  
- [Architecture](../ARCHITECTURE.md)  
- [Java backend README](../backend-java/README.md)  
