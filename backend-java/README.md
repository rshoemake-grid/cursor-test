# Spring Boot Backend - Drop-in Replacement for Python FastAPI Backend

This is a Spring Boot Java backend that serves as a drop-in replacement for the Python FastAPI backend.

## Project Structure

```
backend-java/
├── build.gradle                     # Gradle build file
├── settings.gradle                  # Gradle settings
├── gradle.properties               # Gradle properties
├── gradlew                         # Gradle wrapper (Unix)
├── gradlew.bat                     # Gradle wrapper (Windows)
├── src/main/
│   ├── java/com/workflow/
│   │   ├── WorkflowBuilderApplication.java
│   │   ├── config/                  # Configuration classes
│   │   ├── controller/              # REST controllers (API endpoints)
│   │   ├── dto/                     # Data Transfer Objects (request/response models)
│   │   ├── entity/                  # JPA entities (database models)
│   │   ├── repository/              # JPA repositories
│   │   ├── service/                  # Business logic services
│   │   ├── security/                # JWT authentication & security
│   │   └── exception/               # Exception handling
│   └── resources/
│       └── application.properties   # Application configuration
```

## Key Features

- **Drop-in Replacement**: Same API endpoints, request/response formats as Python backend
- **JWT Authentication**: Matches Python backend auth flow
- **SQLite Database**: Uses same database schema and file
- **REST API**: All endpoints under `/api/v1` prefix
- **WebSocket Support**: For real-time execution updates
- **CORS Configuration**: Matches Python backend CORS settings

## API Endpoints

All endpoints match the Python FastAPI backend:

- `/api/v1/workflows` - Workflow CRUD operations
- `/api/v1/workflows/{id}/execute` - Execute workflows
- `/api/v1/executions` - Execution management
- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/settings` - LLM settings management
- `/api/v1/marketplace` - Marketplace operations
- `/api/v1/templates` - Template management
- `/health` - Health check endpoint
- `/metrics` - Metrics endpoint

## Running the Application

### Prerequisites
- Java 17+
- Gradle 8.5+ (or use Gradle wrapper)

### Build and Run

```bash
# Build the project
./gradlew build

# Run the application
./gradlew bootRun

# Or run the JAR
./gradlew bootJar
java -jar build/libs/workflow-builder-backend-1.0.0.jar
```

**Windows users:**
```bash
# Use gradlew.bat instead
gradlew.bat build
gradlew.bat bootRun
```

The API will be available at `http://localhost:8000`

## Configuration

Configuration is in `src/main/resources/application.properties`:

- `server.port=8000` - API port (matches Python backend)
- `spring.datasource.url=jdbc:sqlite:./workflows.db` - SQLite database
- `jwt.secret` - JWT secret key (set via environment variable)

## Database

Uses SQLite database (`workflows.db`) - same file as Python backend for compatibility.

## Next Steps

To complete the implementation:

1. **Implement Service Layer**: Create service classes in `service/` package
   - `WorkflowService` - Workflow business logic
   - `ExecutionService` - Execution orchestration
   - `AuthService` - Authentication logic
   - `SettingsService` - LLM settings management

2. **Complete Controllers**: Finish implementing all controller endpoints
   - `WorkflowController` - Workflow CRUD
   - `ExecutionController` - Execution management
   - `AuthController` - Authentication
   - `SettingsController` - Settings management
   - `MarketplaceController` - Marketplace operations
   - `TemplateController` - Template management

3. **Add Exception Handling**: Create global exception handler
   - Match Python backend error response format
   - Handle validation errors (422)
   - Handle not found errors (404)

4. **Implement WebSocket**: Add WebSocket support for real-time updates
   - Match Python backend WebSocket implementation

5. **Add Execution Engine**: Implement workflow execution logic
   - Node execution (agents, conditions, loops)
   - LLM integration (OpenAI, Anthropic, Gemini)
   - Tool execution

6. **Testing**: Add unit and integration tests

## Migration Notes

- The Java backend uses the same database file (`workflows.db`) as the Python backend
- API endpoints match exactly (same paths, request/response formats)
- JWT tokens are compatible (same secret key)
- CORS configuration matches Python backend

## Differences from Python Backend

- **Synchronous by default**: Spring Boot is synchronous, but can use `@Async` for async operations
- **Type safety**: Java provides compile-time type checking
- **Spring Security**: Uses Spring Security instead of custom auth middleware
- **JPA**: Uses JPA/Hibernate instead of SQLAlchemy
