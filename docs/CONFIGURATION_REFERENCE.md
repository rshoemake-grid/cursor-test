# Configuration Reference

Complete reference for all configuration options, environment variables, and settings in the Agentic Workflow Engine.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Database Configuration](#database-configuration)
3. [LLM Provider Configuration](#llm-provider-configuration)
4. [Server Configuration](#server-configuration)
5. [Security Configuration](#security-configuration)
6. [Execution Configuration](#execution-configuration)
7. [WebSocket Configuration](#websocket-configuration)
8. [Frontend Configuration](#frontend-configuration)
9. [Production Settings](#production-settings)
10. [Workflow builder storage explorer](#workflow-builder-storage-explorer)
11. [Configuration Examples](#configuration-examples)

---

## Environment Variables

All configuration is managed through environment variables, loaded from `.env` file or system environment.

### Database configuration (Java API)

The Spring Boot app reads **`spring.datasource.*`** from `backend-java/src/main/resources/application.properties` (and profile-specific files). Use **JDBC** URLs only.

| Spring property | Typical local value |
|-----------------|---------------------|
| `spring.datasource.url` | `jdbc:sqlite:./workflows.db` |
| `spring.datasource.driver-class-name` | `org.sqlite.JDBC` |

**PostgreSQL:** use `application-postgresql.properties` / env such as `POSTGRES_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

### LLM Provider API Keys

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENAI_API_KEY` | string | `None` | OpenAI API key (fallback if not in user settings) |
| `ANTHROPIC_API_KEY` | string | `None` | Anthropic API key (fallback if not in user settings) |
| `GEMINI_API_KEY` | string | `None` | Google Gemini API key (fallback if not in user settings) |

**Note:** These are fallback keys. Users can configure their own API keys in Settings, which take precedence.

### Logging Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LOG_LEVEL` | string | `INFO` | Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` |
| `LOG_FILE` | string | `app.log` | Log file path (optional, set to `None` to disable file logging) |

**Examples:**
```bash
LOG_LEVEL=DEBUG          # Verbose logging for development
LOG_LEVEL=INFO           # Standard logging (default)
LOG_LEVEL=WARNING        # Only warnings and errors
LOG_FILE=/var/log/app.log  # Custom log file location
```

### CORS Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CORS_ORIGINS` | JSON array | `["*"]` | Allowed CORS origins |
| `CORS_ALLOW_CREDENTIALS` | boolean | `true` | Allow credentials in CORS requests |

**Development:**
```bash
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

**Production:**
```bash
CORS_ORIGINS=["https://yourdomain.com", "https://app.yourdomain.com"]
```

**Multiple Origins:**
```bash
CORS_ORIGINS=["https://app1.example.com", "https://app2.example.com"]
```

### Application environment

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ENVIRONMENT` | string | `development` | Use `production` in live deployments (stricter CORS defaults, etc.). |

### Development user bootstrap (optional)

When `ENVIRONMENT=development`, you can set a fixed dev account on every backend startup: **create the user if missing** and **reset the password** to the given value.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DEV_BOOTSTRAP_USERNAME` | string | `None` | Username (or lookup by this value as email) to create/update |
| `DEV_BOOTSTRAP_PASSWORD` | string | `None` | Password to set (required with username) |
| `DEV_BOOTSTRAP_EMAIL` | string | `None` | Optional email when **creating** the user; default is `<username>@dev-bootstrap.local` |

Copy from `.env.example` into project root `.env`. Restart the API after changes.

### API Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `API_VERSION` | string | (unused) | Legacy; API uses `/api` prefix (no version in path) |
| `MAX_REQUEST_SIZE` | integer | `10485760` | Maximum request body size in bytes (10MB) |

**Examples:**
```bash
# API uses /api prefix; API_VERSION is deprecated
MAX_REQUEST_SIZE=20971520  # 20MB
```

### Server Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `HOST` | string | `0.0.0.0` | Server host (use `0.0.0.0` to accept all connections) |
| `PORT` | integer | `8000` | Server port |
| `RELOAD` | boolean | `true` | Enable auto-reload on code changes (development only) |

**Development:**
```bash
HOST=0.0.0.0
PORT=8000
RELOAD=true
```

**Production:**
```bash
HOST=0.0.0.0
PORT=8000
RELOAD=false  # Disable auto-reload in production
```

### Execution Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `EXECUTION_TIMEOUT` | integer | `300` | Maximum execution time in seconds (5 minutes) |
| `MAX_CONCURRENT_EXECUTIONS` | integer | `10` | Maximum concurrent workflow executions |

**Examples:**
```bash
EXECUTION_TIMEOUT=600        # 10 minutes
MAX_CONCURRENT_EXECUTIONS=20  # Allow 20 concurrent executions
```

### WebSocket Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `WEBSOCKET_PING_INTERVAL` | integer | `20` | WebSocket ping interval in seconds |
| `WEBSOCKET_TIMEOUT` | integer | `60` | WebSocket connection timeout in seconds |

**Examples:**
```bash
WEBSOCKET_PING_INTERVAL=30   # Ping every 30 seconds
WEBSOCKET_TIMEOUT=120        # 2 minute timeout
```

---

## Database configuration

Set **`spring.datasource.url`**, username, password, and driver in `backend-java/src/main/resources/application.properties` (or profile-specific files). Optional: **`SPRING_DATASOURCE_URL`** when your deployment maps env into Spring.

### SQLite (default — development)

**Pros:**
- No setup required
- File-based, easy to backup
- Perfect for development

**Cons:**
- Not suitable for production
- Limited concurrency
- No network access

**Spring (equivalent idea):**
```properties
spring.datasource.url=jdbc:sqlite:./workflows.db
spring.datasource.driver-class-name=org.sqlite.JDBC
```

### PostgreSQL (recommended for production)

**Pros:**
- Production-ready
- High concurrency
- Advanced features (JSON queries, full-text search)
- Better performance

**Cons:**
- Requires separate database server
- More complex setup

**Spring / env (see `application-postgresql.properties`):**
```bash
export POSTGRES_URL=jdbc:postgresql://localhost:5432/workflow
export POSTGRES_USER=workflow
export POSTGRES_PASSWORD=workflow
```

**JDBC URL format (PostgreSQL):**
```
jdbc:postgresql://[host]:[port]/[database]?[params]
```

**Environment variables** (when wired in `application-postgresql.properties`):

- `POSTGRES_USER` — database user
- `POSTGRES_PASSWORD` — database password
- `POSTGRES_HOST` — host (default `localhost`)
- `POSTGRES_PORT` — port (default `5432`)
- `POSTGRES_DB` — database name

### MySQL (alternative)

Use a **`jdbc:mysql://...`** URL, the MySQL driver class name, and matching credentials if you standardize on MySQL instead of PostgreSQL.

---

## LLM Provider Configuration

### User-Level Configuration (Recommended)

Users configure LLM providers through the Settings API (`/api/settings/llm`). This allows:
- Per-user API keys
- Multiple provider configurations
- Provider switching without restart

### Fallback Configuration (Environment Variables)

If user settings are not configured, the system falls back to environment variables:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

**Note:** User-configured settings take precedence over environment variables.

### Provider-Specific Configuration

#### OpenAI

**Required:**
- API key (starts with `sk-`)

**Models Available:**
- `gpt-4o` - Latest GPT-4 model
- `gpt-4o-mini` - Faster, cheaper GPT-4 model
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-3.5-turbo` - GPT-3.5 Turbo

**Configuration via Settings API:**
```json
{
  "type": "openai",
  "api_key": "sk-...",
  "model": "gpt-4o-mini",
  "is_active": true
}
```

#### Anthropic (Claude)

**Required:**
- API key (starts with `sk-ant-`)

**Models Available:**
- `claude-3-5-sonnet-20241022` - Latest Claude 3.5 Sonnet
- `claude-3-opus-20240229` - Claude 3 Opus
- `claude-3-sonnet-20240229` - Claude 3 Sonnet
- `claude-3-haiku-20240307` - Claude 3 Haiku

**Configuration via Settings API:**
```json
{
  "type": "anthropic",
  "api_key": "sk-ant-...",
  "model": "claude-3-5-sonnet-20241022",
  "is_active": true
}
```

#### Google Gemini

**Required:**
- API key (from Google Cloud Console)

**Models Available:**
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash
- `gemini-pro` - Gemini Pro

**Configuration via Settings API:**
```json
{
  "type": "gemini",
  "api_key": "...",
  "model": "gemini-1.5-pro",
  "is_active": true
}
```

---

## Server Configuration

### Development Server

**Configuration:**
```bash
HOST=0.0.0.0
PORT=8000
RELOAD=true
LOG_LEVEL=DEBUG
```

**Start (Java):**
```bash
cd backend-java && ./gradlew bootRun
```

### Production server (Java)

Package and run the Spring Boot jar, or use your container image / Kubernetes manifests. Tune `SPRING_PROFILES_ACTIVE`, datasource URLs, and JVM flags for your environment (see [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md)).

### Workflow builder storage explorer

The authenticated **`/api/storage/*`** routes power **Browse…** in node editors (GCS, S3, local paths, Pub/Sub, **BigQuery**, **Firestore**, etc.). Required **Google Cloud** client libraries are pulled in via **`backend-java/build.gradle`** (not the root `requirements.txt`, which is only for `scripts/` tests).

---

## Security Configuration

### CORS Settings

**Development (Allow All):**
```bash
CORS_ORIGINS=["*"]
CORS_ALLOW_CREDENTIALS=true
```

**Production (Restricted):**
```bash
CORS_ORIGINS=["https://yourdomain.com"]
CORS_ALLOW_CREDENTIALS=true
```

**Multiple Domains:**
```bash
CORS_ORIGINS=["https://app.example.com", "https://admin.example.com"]
```

### API Key Security

**Best Practices:**
1. Never commit API keys to version control
2. Use environment variables or secure secret management
3. Rotate keys regularly
4. Use user-level API keys (via Settings API) instead of global keys
5. Restrict API key permissions in provider dashboards

### Database Security

**PostgreSQL:**
- Use strong passwords
- Restrict network access (firewall rules)
- Use SSL connections in production
- Regular backups

**JDBC URL with SSL (PostgreSQL example):**
```properties
spring.datasource.url=jdbc:postgresql://host:5432/db?sslmode=require
```

---

## Execution Configuration

### Timeout Settings

**Short Workflows (< 1 minute):**
```bash
EXECUTION_TIMEOUT=60
```

**Medium Workflows (1-5 minutes):**
```bash
EXECUTION_TIMEOUT=300  # Default
```

**Long Workflows (5-15 minutes):**
```bash
EXECUTION_TIMEOUT=900
```

**Very Long Workflows (15+ minutes):**
```bash
EXECUTION_TIMEOUT=1800  # 30 minutes
```

### Concurrency Limits

**Low Traffic (< 10 concurrent users):**
```bash
MAX_CONCURRENT_EXECUTIONS=10  # Default
```

**Medium Traffic (10-50 concurrent users):**
```bash
MAX_CONCURRENT_EXECUTIONS=50
```

**High Traffic (50+ concurrent users):**
```bash
MAX_CONCURRENT_EXECUTIONS=100
```

**Note:** Adjust based on server resources and database capacity.

---

## WebSocket Configuration

### Connection Settings

**Standard:**
```bash
WEBSOCKET_PING_INTERVAL=20   # Ping every 20 seconds
WEBSOCKET_TIMEOUT=60         # 60 second timeout
```

**High Latency Networks:**
```bash
WEBSOCKET_PING_INTERVAL=30   # Ping every 30 seconds
WEBSOCKET_TIMEOUT=120        # 2 minute timeout
```

**Low Latency Networks:**
```bash
WEBSOCKET_PING_INTERVAL=10   # Ping every 10 seconds
WEBSOCKET_TIMEOUT=30         # 30 second timeout
```

---

## Frontend Configuration

The UI under `frontend/` is a **Create React App** project. Variables must be prefixed with **`REACT_APP_`** and are read from `frontend/.env.development`, `frontend/.env.development.local`, `frontend/.env.production`, etc.

### `REACT_APP_API_BASE_URL`

| Value | Behavior |
|-------|----------|
| **Empty / unset** (recommended local default) | Browser calls same-origin **`/api`**. The CRA dev server uses **`setupProxy.js`** to forward `/api` and `/ws` to the **Java API** (see `PROXY_TARGET`, default `http://127.0.0.1:8000`). Avoids CORS and `localhost` vs `127.0.0.1` mismatches. |
| **`http://127.0.0.1:8000`** (or similar origin) | Direct calls to the API. The app normalizes an origin-only URL to **`…/api`** for route paths. Ensure CORS allows your dev page origin if you use this. |

Override per machine in **`frontend/.env.development.local`** (not committed).

### Development commands

```bash
cd frontend
npm install
npm start          # dev server (default http://localhost:3000)
```

### Production build

```bash
cd frontend
REACT_APP_API_BASE_URL=https://api.yourdomain.com npm run build
```

Use an API base that already includes the `/api` path segment when required (see normalization in `frontend/src/config/constants.jsx`), or an origin-only URL so `/api` is appended automatically.

---

## Production Settings

### Complete Production Configuration

**`.env` file (example — map into Spring as needed):**
```bash
# Database (JDBC — prefer spring.datasource.* in application-production.properties)
SPRING_DATASOURCE_URL=jdbc:postgresql://db-host:5432/workflows
SPRING_DATASOURCE_USERNAME=workflow
SPRING_DATASOURCE_PASSWORD=change-me

# Server
HOST=0.0.0.0
PORT=8000
RELOAD=false

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/workflow-engine/app.log

# CORS
CORS_ORIGINS=["https://yourdomain.com"]
CORS_ALLOW_CREDENTIALS=true

# Execution
EXECUTION_TIMEOUT=300
MAX_CONCURRENT_EXECUTIONS=50

# WebSocket
WEBSOCKET_PING_INTERVAL=20
WEBSOCKET_TIMEOUT=60

# API
# API uses /api prefix; API_VERSION is deprecated
MAX_REQUEST_SIZE=10485760

# Security (don't set fallback keys in production - use user settings)
# OPENAI_API_KEY=...
# ANTHROPIC_API_KEY=...
# GEMINI_API_KEY=...
```

### Kubernetes Configuration

See `k8s/configmap.yaml` and `k8s/secrets.yaml.example` for Kubernetes configuration.

**ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: workflow-builder-config
data:
  SPRING_DATASOURCE_URL: "jdbc:postgresql://db:5432/workflows"
  HOST: "0.0.0.0"
  PORT: "8000"
  LOG_LEVEL: "INFO"
  CORS_ORIGINS: '["https://yourdomain.com"]'
  EXECUTION_TIMEOUT: "300"
  MAX_CONCURRENT_EXECUTIONS: "50"
```

**Secrets (use sealed-secrets or external-secrets in production):**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: workflow-builder-secrets
type: Opaque
stringData:
  POSTGRES_PASSWORD: "your-password"
  # Don't store API keys here - use user settings instead
```

---

## Configuration Examples

### Development Setup

**Root `.env` (keys consumed by Spring where wired):** use `OPENAI_API_KEY`, optional `DEV_BOOTSTRAP_*`, and any vars your `application*.properties` references. Configure the database with **`spring.datasource.*`** or mapped env vars such as **`SPRING_DATASOURCE_URL`**.

```bash
OPENAI_API_KEY=sk-...
# Optional local dev user
DEV_BOOTSTRAP_USERNAME=devuser
DEV_BOOTSTRAP_PASSWORD=change-me
```

### Production Setup

**Production:** configure the Spring Boot service via environment variables and/or `application-production.properties` (PostgreSQL JDBC URL, `JWT_SECRET`, CORS, execution limits). See [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md).

### Docker Setup

**`docker-compose.yml` example:**
```yaml
version: '3.8'
services:
  backend:
    image: workflow-engine:latest
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/workflows
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - SPRING_PROFILES_ACTIVE=production,postgresql
    ports:
      - "8000:8000"
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=workflows
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Configuration Validation

### Checking configuration

**Verify the API is up and env-sensitive pieces work:**
```bash
curl -sf http://localhost:8000/health
# Compare with values in backend-java/src/main/resources/application.properties
```

**Check environment variables:**
```bash
# Linux/Mac
env | grep -E "SPRING_|POSTGRES_|LOG_LEVEL|CORS"

# Windows
set | findstr "SPRING_ POSTGRES_ LOG_LEVEL CORS"
```

---

## Troubleshooting Configuration

### Common Issues

**1. Configuration not loading:**
- Check `.env` file exists in project root
- Verify environment variable names match exactly
- Check for typos in variable names

**2. Database connection errors:**
- Verify **`spring.datasource.url`** (JDBC) and credentials
- Check database server is running
- Verify credentials are correct
- Check network connectivity

**3. CORS errors:**
- Verify `CORS_ORIGINS` includes your frontend URL
- Check for trailing slashes in URLs
- Ensure `CORS_ALLOW_CREDENTIALS` is set correctly

**4. API key errors:**
- Verify API keys are valid
- Check API keys are configured in Settings (user-level)
- Verify fallback environment variables if using them

---

## Related Documentation

- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md) - Production deployment
- [Java backend README](../backend-java/README.md) - Development setup

---

## Summary

- **Development**: Use SQLite, enable reload, DEBUG logging
- **Production**: Use PostgreSQL, disable reload, INFO logging, restrict CORS
- **API Keys**: Prefer user-level settings over environment variables
- **Security**: Restrict CORS origins, use strong passwords, enable SSL
- **Performance**: Adjust timeouts and concurrency based on workload
