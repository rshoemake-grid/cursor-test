# Technical design (summary)

**Status:** The authoritative HTTP implementation is **Spring Boot** in `backend-java/`.

## Where to read instead

| Topic | Document |
|-------|-----------|
| System shape (UI + API + DB) | [Architecture overview](../ARCHITECTURE.md) |
| Execution pipeline (concepts + Java mapping note) | [Execution system architecture](./EXECUTION_SYSTEM_ARCHITECTURE.md) |
| HTTP routes and payloads | [API Reference](./API_REFERENCE.md) |
| Env vars and Spring properties | [Configuration Reference](./CONFIGURATION_REFERENCE.md) |
| Kubernetes / containers | [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md) |

## Stack (current)

- **Frontend:** React 18 (CRA), React Flow, Redux Toolkit, styled-components.  
- **Backend:** Java 17, Spring Boot, Spring Security (JWT), JPA/Hibernate, WebSocket execution streaming.  
- **Data:** SQLite file by default; PostgreSQL for production deployments.

If you need a long-form design narrative again, open an issue and we can rebuild it from the Java sources (`com.workflow.*`) so it stays accurate.
