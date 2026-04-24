# Testing guide

## Overview

| Area | Stack | Command |
|------|--------|---------|
| **Java API** | JUnit 5, Spring Boot Test, Mockito | `cd backend-java && ./gradlew test` |
| **Frontend** | Jest, React Testing Library | `cd frontend && CI=true npm test -- --watchAll=false` |
| **Repo scripts** | `unittest` / `pytest` (minimal) | `python3 -m pytest scripts/ -q` or `./run.sh verify` |

Automated tests for the HTTP API live under **`backend-java/src/test`** and **`frontend`** (Jest / React Testing Library). Root **`pytest`** is reserved for small **`scripts/`** utilities—see `pytest.ini`.

## Java backend

```bash
cd backend-java
./gradlew test
./gradlew test --tests "com.workflow.service.WorkflowServiceTest"   # single class example
```

Use `@SpringBootTest`, `@WebMvcTest`, and `@MockBean` per Spring conventions. Reports: `backend-java/build/reports/tests/test/index.html`.

## Frontend

```bash
cd frontend
npm test                    # interactive
CI=true npm test -- --watchAll=false   # CI mode, one run
```

Prefer testing behavior (queries by role/label), not implementation details.

## Scripts directory

```bash
pip install -r requirements.txt   # pytest only
python3 -m pytest scripts/ -q
```

## Philosophy

1. **Fast feedback** — run the smallest suite that covers your change before pushing.  
2. **Isolation** — mock HTTP and LLM providers in unit tests; use integration tests sparingly.  
3. **Regression** — add a test for every bug fix when practical.

## Related

- [Contributing Guide](./CONTRIBUTING_GUIDE.md)  
- [Java backend README](../backend-java/README.md)  
- [Frontend README](../frontend/README.md)  
