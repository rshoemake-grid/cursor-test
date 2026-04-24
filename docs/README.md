# Documentation index

**Last updated:** 2026-04-24  

The production API is **Spring Boot** in `backend-java/`. Optional **Python** under `scripts/` is for small utilities and tests only (not the HTTP service).

**Highlights:** Storage explorer (BigQuery, Firestore, GCS, …) is documented in [API Reference](./API_REFERENCE.md#storage-explorer-authenticated) and [Node Types](./NODE_TYPES_REFERENCE.md#workflow-builder-datastore-pickers). API paths use the `/api` prefix. **Workflow chat:** `POST /api/workflow-chat/chat` accepts optional `iteration_limit` (1–100). **Frontend dev:** same-origin `/api` via CRA `setupProxy` — [Configuration Reference](./CONFIGURATION_REFERENCE.md#frontend-configuration). **Dev bootstrap:** optional `DEV_BOOTSTRAP_*` in root `.env` — [Configuration Reference](./CONFIGURATION_REFERENCE.md#development-user-bootstrap-optional).

---

## Quick navigation

### Getting started

- [Getting Started](../GETTING_STARTED.md)
- [Quick Start](../QUICKSTART.md)
- [Architecture](../ARCHITECTURE.md)

### Developer guides

- [Java backend README](../backend-java/README.md) — run, build, test the API
- [Testing Guide](./TESTING_GUIDE.md) — Java, frontend, and `scripts/` tests
- [API Reference](./API_REFERENCE.md)
- [Frontend Developer Guide](./FRONTEND_DEVELOPER_GUIDE.md)

### Configuration and operations

- [Configuration Reference](./CONFIGURATION_REFERENCE.md)
- [Storage Integration Guide](./STORAGE_INTEGRATION_GUIDE.md)
- [LLM Provider Setup Guide](./LLM_PROVIDER_SETUP_GUIDE.md)
- [Node Types Reference](./NODE_TYPES_REFERENCE.md)
- [WebSocket API Guide](./WEBSOCKET_API_GUIDE.md)
- [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md)
- [Apigee Integration Guide](./APIGEE_INTEGRATION_GUIDE.md)

### Security and quality

- [Security Guide](./SECURITY_GUIDE.md)
- [Error Codes Reference](./ERROR_CODES_REFERENCE.md)
- [Performance Tuning Guide](./PERFORMANCE_TUNING_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Contributing

- [Contributing Guide](./CONTRIBUTING_GUIDE.md)

### Technical references

- [Technical Design](./TECHNICAL_DESIGN.md)
- [Execution System Architecture](./EXECUTION_SYSTEM_ARCHITECTURE.md)
- [Business Requirements](./BUSINESS_REQUIREMENTS.md)

---

## By role

**Application developers:** [Java backend README](../backend-java/README.md) → [API Reference](./API_REFERENCE.md) → [Frontend Developer Guide](./FRONTEND_DEVELOPER_GUIDE.md)

**DevOps:** [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md) → [Configuration Reference](./CONFIGURATION_REFERENCE.md)

**Admins:** [Getting Started](../GETTING_STARTED.md) → [LLM Provider Setup Guide](./LLM_PROVIDER_SETUP_GUIDE.md)

---

## Related resources

- [Project README](../README.md)
- [Architecture overview](../ARCHITECTURE.md)

## Quick links (local dev)

- [OpenAPI / Swagger UI](http://localhost:8000/swagger-ui.html) — when `backend-java` is running
- [Frontend Developer Guide](./FRONTEND_DEVELOPER_GUIDE.md)
- [Contributing Guide](./CONTRIBUTING_GUIDE.md)
