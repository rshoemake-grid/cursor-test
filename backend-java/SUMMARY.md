# Spring Boot backend — summary

## Overview

Spring Boot service exposing the workflow **REST** and **WebSocket** API, with **JPA** persistence and **JWT** security.

## What is in the tree

### Core infrastructure
- **Gradle** project (`build.gradle`, wrapper)
- **`application.properties`** (SQLite default, logging, CORS, execution limits)
- **Main application** entry class

### Database layer
- **JPA entities** for users, workflows, executions, settings, templates, tokens
- **Repositories** with query methods
- **SQLite** default (`workflows.db`); **PostgreSQL** optional via profile/env

### DTOs and API
- Request/response DTOs for workflows, executions, nodes, auth, settings
- Enums such as `NodeType`, execution status values

### Security
- **Spring Security**, JWT access/refresh flow, BCrypt passwords

### Controllers and errors
- REST controllers under `com.workflow.controller`
- **Global exception handler** returning consistent JSON error bodies

### Health
- **`/health`** for load balancers and local checks

## API Endpoints Implemented

### Workflows
- ✅ `POST /api/workflows` - Create workflow
- ✅ `GET /api/workflows` - List workflows
- ✅ `GET /api/workflows/{id}` - Get workflow
- ✅ `PUT /api/workflows/{id}` - Update workflow
- ✅ `DELETE /api/workflows/{id}` - Delete workflow

### Authentication
- ✅ `POST /api/auth/register` - Register user
- ✅ `POST /api/auth/login` - Login
- ✅ `POST /api/auth/refresh` - Refresh token

### Health
- ✅ `GET /health` - Health check

## Remaining Work

See `IMPLEMENTATION_GUIDE.md` for detailed instructions on completing:

1. **Execution Controller** - Workflow execution endpoints
2. **Settings Controller** - LLM settings management
3. **Marketplace Controller** - Marketplace operations
4. **Template Controller** - Template management
5. **Service Layer** - Business logic implementation
6. **Execution Engine** - Workflow execution logic
7. **WebSocket Support** - Real-time updates
8. **Metrics Endpoint** - Prometheus-compatible metrics

## Key Features

### API surface
- REST under `/api/*` with JSON request/response bodies
- SQLite default (`workflows.db`); PostgreSQL supported
- JWT access/refresh and BCrypt passwords
- Consistent JSON error payloads from the global handler

### Defaults
- Listens on **port 8000** in local `application.properties`
- Permissive CORS for development; tighten via env/properties for production

## Running the Application

```bash
# Build
./gradlew build

# Run
./gradlew bootRun

# Or build and run JAR
./gradlew bootJar
java -jar build/libs/workflow-builder-backend-1.0.0.jar
```

**Windows users:** Use `gradlew.bat` instead of `./gradlew`

The API will be available at `http://localhost:8000`

## Configuration

Key configuration in `application.properties`:
- `server.port=8000` — local default
- `spring.datasource.url=jdbc:sqlite:./workflows.db` — SQLite dev DB
- `jwt.secret` — set via environment / properties (never commit secrets)
- `cors.allowed-origins` — restrict in production

## Architecture

```
┌─────────────────┐
│   Controllers   │  REST API endpoints
├─────────────────┤
│    Services     │  Business logic
├─────────────────┤
│  Repositories   │  Data access
├─────────────────┤
│    Entities     │  Database models
└─────────────────┘
```

## Next Steps

1. Complete remaining controllers (see IMPLEMENTATION_GUIDE.md)
2. Implement service layer with business logic
3. Add execution engine for workflow execution
4. Add WebSocket support for real-time updates
5. Add comprehensive tests
6. Deploy and test with frontend

## Notes

- The Java backend is synchronous by default (can use `@Async` for async)
- Uses Spring Security instead of custom auth middleware
- Uses JPA/Hibernate for persistence
- Type-safe at compile time (Java benefits)
