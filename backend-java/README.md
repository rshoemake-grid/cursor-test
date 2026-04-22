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
│       ├── application.properties   # Application configuration
│       └── logback-spring.xml        # SLF4J/Logback: stdout-only; optional JSON profile for Datadog
```

## Key Features

- **Drop-in Replacement**: Same API endpoints, request/response formats as Python backend
- **JWT Authentication**: Matches Python backend auth flow
- **SQLite Database**: Uses same database schema and file
- **REST API**: All endpoints under `/api` prefix
- **WebSocket Support**: For real-time execution updates
- **CORS Configuration**: Matches Python backend CORS settings

## API Endpoints

All endpoints match the Python FastAPI backend:

- `/api/workflows` - Workflow CRUD operations
- `/api/workflows/{id}/execute` - Execute workflows
- `/api/executions` - Execution management
- `/api/auth/*` - Authentication endpoints
- `/api/settings` - LLM settings management
- `/api/marketplace` - Marketplace operations
- `/api/templates` - Template management
- `/health` - Health check endpoint
- `/metrics` - Metrics endpoint

## Running the Application

### Prerequisites
- **JDK 17** (required; Gradle toolchain enforces this)
- Gradle 8.5+ (or use Gradle wrapper)

**Installing and using JDK 17:**
```bash
# macOS (Homebrew)
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# SDKMAN
sdk install java 17.0.9-tem
sdk use java 17.0.9-tem   # or run 'sdk env' in backend-java/ (uses .sdkmanrc)

# asdf
asdf plugin add java
asdf install java temurin-17.0.9
asdf local java temurin-17.0.9
```

Then run `./gradlew build` with `JAVA_HOME` pointing to JDK 17.

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

### Logging (Docker / Kubernetes / Datadog)

Logging uses **SLF4J** with **Logback** (`logback-spring.xml`). Output goes to **stdout/stderr only** so container runtimes and log forwarders (Datadog Agent, `kubectl logs`, Google Cloud Logging, etc.) can collect it. There is **no** default log file under `/app`.

- **Human-readable** (default): standard Spring Boot console layout; in `production` the pattern omits ANSI colors (see `application-production.properties`).
- **JSON** (one line per event): add the Spring profile **`json`**, for example `SPRING_PROFILES_ACTIVE=production,json`. That uses the **Logstash Logback Encoder** for structured parsing in Datadog and similar tools.

Levels are controlled with normal Spring properties, e.g. `logging.level.root=INFO` or env `LOGGING_LEVEL_ROOT`.

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
