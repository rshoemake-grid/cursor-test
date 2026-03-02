# API Reference

**Base URL:** `/api`  
**Last Updated:** 2026-02-23

## Overview

All API endpoints use the `/api` prefix. Interactive OpenAPI documentation is available at `/docs` (Swagger UI) when the server is running.

## Key Endpoints

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/token`, `POST /api/auth/refresh`, `GET /api/auth/me` |
| **Workflows** | `GET/POST /api/workflows`, `GET/PUT/DELETE /api/workflows/{id}`, `POST /api/workflows/{id}/execute` |
| **Executions** | `GET /api/executions`, `GET /api/executions/{id}`, `POST /api/executions/{id}/cancel` |
| **Templates** | `GET /api/templates`, `GET /api/templates/{id}`, `POST /api/templates/{id}/use` |
| **Marketplace** | `GET /api/marketplace/discover`, `GET /api/marketplace/agents` |
| **Settings** | `GET/POST /api/settings/llm` |
| **Sharing** | `POST /api/sharing/share`, `GET /api/sharing/shared-with-me`, `GET /api/sharing/shared-by-me` |
| **Health** | `GET /health`, `GET /metrics` |

## Notes

- **Templates:** Use `/api/templates` (no trailing slash). Query params: `category`, `difficulty`, `search`, `sort_by`, `limit`, `offset`.
- **Auth:** Login supports `remember_me` for extended token lifetime. Register returns 201.
- **Backend parity:** Python and Java backends expose the same endpoints. Path variable names may differ internally (e.g. `template_id` vs `templateId`); URLs are identical.

## Related Documentation

- [API Workflow Execution](./API_WORKFLOW_EXECUTION.md) - Execution API details
- [WebSocket API Guide](./WEBSOCKET_API_GUIDE.md) - Real-time updates
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Architecture and development
