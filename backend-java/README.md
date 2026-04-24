# Spring Boot backend

This is the **Spring Boot** workflow API (REST + WebSocket). It is the only server implementation in this repository.

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

## Key features

- **REST API** under `/api`
- **JWT authentication** and user management
- **SQLite** by default (`workflows.db`); PostgreSQL via configuration
- **WebSocket** streaming for execution updates
- **CORS** configurable for dev and production

## API endpoints (overview)

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

- `server.port=8000` - API port (default local dev)
- `spring.datasource.url=jdbc:sqlite:./workflows.db` - SQLite database
- `jwt.secret` - JWT secret key (set via environment variable)

### Logging (Docker / Kubernetes / Datadog)

Logging uses **SLF4J** with **Logback** (`logback-spring.xml`). Output goes to **stdout/stderr only** so container runtimes and log forwarders (Datadog Agent, `kubectl logs`, Google Cloud Logging, etc.) can collect it. There is **no** default log file under `/app`.

- **Human-readable** (default): standard Spring Boot console layout; in `production` the pattern omits ANSI colors (see `application-production.properties`).
- **JSON** (one line per event): add the Spring profile **`json`**, for example `SPRING_PROFILES_ACTIVE=production,json`. That uses the **Logstash Logback Encoder** for structured parsing in Datadog and similar tools.

Levels are controlled with normal Spring properties, e.g. `logging.level.root=INFO` or env `LOGGING_LEVEL_ROOT`.

## Database

Uses **SQLite** by default (`workflows.db` in the repo root when run from there). Configure **PostgreSQL** via Spring profile/properties for production.

## Implementation notes

The tree contains the full service layer, execution engine, WebSocket support, and tests. Run **`./gradlew test`** before submitting changes. Use **OpenAPI** at `/swagger-ui.html` when the app is up.
