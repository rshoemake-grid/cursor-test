# Spring Boot Backend Implementation Guide

This guide provides details on completing the Spring Boot backend implementation to match the Python FastAPI backend.

## Completed Components

✅ **Project Structure**
- Gradle `build.gradle` with all dependencies
- `application.properties` configuration
- Main application class

✅ **Entity Models**
- User, Workflow, Execution, Settings, WorkflowTemplate
- PasswordResetToken, RefreshToken
- All match Python SQLAlchemy models

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
@RequestMapping("/api/v1")
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
@RequestMapping("/api/v1/settings")
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
@RequestMapping("/api/v1/marketplace")
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
@RequestMapping("/api/v1/templates")
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
- POST /api/v1/auth/password-reset-request
- POST /api/v1/auth/password-reset

**Import/Export**
- POST /api/v1/workflows/import
- GET /api/v1/workflows/{id}/export

**Workflow Chat**
- POST /api/v1/workflow-chat/generate

**Sharing**
- POST /api/v1/workflows/{id}/share
- GET /api/v1/workflows/shared

## Database Compatibility

The Java backend uses the same SQLite database file (`workflows.db`) as the Python backend. The JPA entities are configured to match the Python SQLAlchemy models exactly.

## API Compatibility

All endpoints match the Python backend:
- Same URL paths (`/api/v1/*`)
- Same request/response formats
- Same error response format
- Same authentication (JWT tokens)

## Testing

Add tests matching Python backend tests:

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

## Migration Path

1. **Phase 1**: Deploy Java backend alongside Python backend
2. **Phase 2**: Test with same database
3. **Phase 3**: Switch frontend to Java backend
4. **Phase 4**: Decommission Python backend

## Notes

- The Java backend is synchronous by default (Spring Boot)
- Use `@Async` for async operations if needed
- WebSocket support uses Spring WebSocket (different from Python's websockets library)
- LLM API calls can use Spring WebFlux (reactive) or RestTemplate/WebClient
