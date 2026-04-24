# Spring Boot Backend Implementation Guide

This guide provides notes for extending the **Spring Boot** backend (`backend-java/`).

## Completed Components

✅ **Project Structure**
- Gradle `build.gradle` with all dependencies
- `application.properties` configuration
- Main application class

✅ **Entity Models**
- User, Workflow, Execution, Settings, WorkflowTemplate
- PasswordResetToken, RefreshToken
- Schema aligned with the shared `workflows.db` / PostgreSQL layout used by the app

✅ **DTOs**
- Node, Edge, WorkflowDefinition, WorkflowCreate, WorkflowResponse
- ExecutionRequest, ExecutionResponse
- UserCreate, UserResponse, TokenResponse
- All config DTOs (AgentConfig, ADKAgentConfig, ConditionConfig, LoopConfig)

✅ **Repositories**
- All JPA repositories created
- Custom query methods for filtering

✅ **Security**
- JWT authentication
- Spring Security configuration
- Password encoding (BCrypt)
- CORS configuration

✅ **Controllers (Partial)**
- WorkflowController (CRUD operations)
- AuthController (register, login, refresh)
- HealthController

✅ **Exception Handling**
- Global exception handler
- Matches Python error response format

## Remaining Implementation

### 1. Execution Controller

Create `ExecutionController.java` matching Python `execution_routes.py`:

```java
@RestController
@RequestMapping("/api")
public class ExecutionController {
    // POST /workflows/{workflow_id}/execute
    // GET /executions
    // GET /executions/{execution_id}
    // GET /executions/{execution_id}/logs
    // GET /workflows/{workflow_id}/executions
    // GET /users/{user_id}/executions
    // GET /executions/running
}
```

### 2. Settings Controller

Create `SettingsController.java` matching Python `settings_routes.py`:

```java
@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    // GET /settings
    // PUT /settings
    // POST /settings/test
    // GET /settings/providers
}
```

### 3. Marketplace Controller

Create `MarketplaceController.java` matching Python `marketplace_routes.py`:

```java
@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {
    // GET /marketplace/workflows
    // POST /marketplace/workflows/{workflow_id}/publish
    // POST /marketplace/workflows/{workflow_id}/like
    // GET /marketplace/workflows/{workflow_id}
}
```

### 4. Template Controller

Create `TemplateController.java` matching Python `template_routes.py`:

```java
@RestController
@RequestMapping("/api/templates")
public class TemplateController {
    // GET /templates
    // GET /templates/{template_id}
    // POST /templates
    // PUT /templates/{template_id}
    // DELETE /templates/{template_id}
}
```

### 5. Service Layer

Create service classes with business logic:

**WorkflowService.java**
```java
@Service
public class WorkflowService {
    // createWorkflow()
    // updateWorkflow()
    // deleteWorkflow()
    // validateWorkflow()
    // reconstructWorkflowDefinition()
}
```

**ExecutionService.java**
```java
@Service
public class ExecutionService {
    // executeWorkflow()
    // getExecution()
    // listExecutions()
    // getExecutionLogs()
}
```

**ExecutionOrchestrator.java**
```java
@Service
public class ExecutionOrchestrator {
    // Orchestrate workflow execution
    // Handle node execution (agents, conditions, loops)
    // Manage execution state
}
```

### 6. Execution Engine

Implement workflow execution logic:

**NodeExecutor.java** - Execute individual nodes
- Agent nodes (LLM calls)
- Condition nodes (branching logic)
- Loop nodes (iteration)
- Tool nodes

**LLM Integration**
- OpenAI client
- Anthropic client
- Google Gemini client
- Custom provider support

### 7. WebSocket Support

Create WebSocket configuration and handlers:

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    // Configure WebSocket endpoints
    // Handle execution updates
}
```

### 8. Metrics Endpoint

Create metrics controller matching Python `/metrics` endpoint:

```java
@RestController
public class MetricsController {
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        // Return Prometheus-compatible metrics
    }
}
```

### 9. Additional Features

**Password Reset**
- POST /api/auth/password-reset-request
- POST /api/auth/password-reset

**Import/Export**
- POST /api/workflows/import
- GET /api/workflows/{id}/export

**Workflow Chat**
- POST /api/workflow-chat/generate

**Sharing**
- POST /api/workflows/{id}/share
- GET /api/workflows/shared

## Database compatibility

The service uses the SQLite file `workflows.db` for local development and PostgreSQL in production; JPA entities map to that schema (see `application*.properties`).

## API contract

REST endpoints live under `/api/*` with JWT auth; request/response shapes follow the DTOs in this module and the OpenAPI spec when generated.

## Testing

Add integration and unit tests for services and controllers:

```java
@SpringBootTest
@AutoConfigureMockMvc
class WorkflowControllerTest {
    // Test workflow CRUD operations
}

@SpringBootTest
class AuthControllerTest {
    // Test authentication endpoints
}
```

## Deployment

The Spring Boot backend can be deployed as:
- Standalone JAR file
- Docker container
- Traditional WAR file (with modifications)

## Notes

- The Java API is synchronous by default (Spring MVC); use **`@Async`** or dedicated executors when you intentionally offload work from request threads.
- WebSockets use **Spring WebSocket** support.
- Outbound LLM calls typically use **`WebClient`** or **`RestTemplate`** with strict timeouts and retries where appropriate.
