# API Reference

**Base URL:** `/api`  
**Last Updated:** 2026-04-20

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
| **Workflow Chat** | `POST /api/workflow-chat/chat` |
| **Sharing** | `POST /api/sharing/share`, `GET /api/sharing/shared-with-me`, `GET /api/sharing/shared-by-me` |
| **Storage explorer** | See [Storage explorer](#storage-explorer-authenticated) (workflow builder pickers) |
| **Health** | `GET /health`, `GET /metrics` |

## Storage explorer (authenticated)

These **POST** routes live under **`/api/storage`** (same prefix as the rest of the API). They power **Browse…** dialogs in the workflow builder (GCS buckets/objects, AWS, local paths, Pub/Sub, BigQuery, Firestore). Callers must send a valid **Authorization** header (Bearer JWT), same as other protected endpoints.

| Path | Purpose |
|------|---------|
| `POST /api/storage/gcp/list-objects` | GCS prefixes and objects under a prefix |
| `POST /api/storage/gcp/list-buckets` | GCS buckets in a project |
| `POST /api/storage/gcp/list-projects` | GCP projects visible to the credentials |
| `POST /api/storage/gcp/default-project` | Resolve default GCP project from credentials / ADC |
| `POST /api/storage/gcp/pubsub/list-topics` | Pub/Sub topics |
| `POST /api/storage/gcp/pubsub/list-subscriptions` | Pub/Sub subscriptions |
| `POST /api/storage/bigquery/list-datasets` | BigQuery datasets in a project (`project_id`, optional `credentials`) |
| `POST /api/storage/bigquery/list-tables` | Tables in a dataset (`project_id`, `dataset_id`, optional `credentials`) |
| `POST /api/storage/firestore/list-collections` | Firestore **root** collection IDs (`project_id`, optional `credentials`) |
| `POST /api/storage/aws/list-objects` | S3 keys under a prefix |
| `POST /api/storage/aws/list-buckets` | S3 buckets |
| `POST /api/storage/aws/list-regions` | AWS regions |
| `POST /api/storage/local/list-directory` | Server directory listing (respects `LOCAL_FILE_BASE_PATH`) |

**Responses:** List-style endpoints return JSON with an **`objects`** array of `{ name, display_name, size?, updated? }`, matching the shared picker UI. **503** may be returned if an optional Python dependency is missing on the server (message includes install hint).

**Dependencies (Python API):** BigQuery and Firestore listing require `google-cloud-bigquery` and `google-cloud-firestore` (listed in `requirements.txt`). Credential resolution matches workflow GCS nodes (inline service account JSON, or Application Default Credentials on the server).

## Workflow Chat

`POST /api/workflow-chat/chat` accepts JSON:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User message |
| `workflow_id` | string | No | Current workflow id for context and tools |
| `conversation_history` | array | No | `{ "role": "user"\|"assistant", "content": string }[]` |
| `iteration_limit` | integer | No | Optional **1–100**. Overrides saved LLM **iteration limit** for this request only. If omitted, server uses user settings, else default **20** tool–LLM cycles |

Response includes `message` (assistant text) and optional `workflow_changes` for the UI to apply.

## Access control (anonymous vs signed-in)

- **`GET /api/workflows`** — Returns **only the signed-in user’s workflows**. For anonymous requests the list is **empty**; browse public templates via **Marketplace** / templates APIs instead.
- **`GET /api/workflows/{id}`** — Without auth, only **public** workflows are readable; private or owner-only workflows return **403**.
- **Auth:** Login supports `remember_me` for extended token lifetime. Register returns 201.

## Notes

- **Templates:** Use `/api/templates` (no trailing slash). Query params: `category`, `difficulty`, `search`, `sort_by`, `limit`, `offset`.
- **Backend parity:** Python and Java backends expose the same core endpoints. Path variable names may differ internally (e.g. `template_id` vs `templateId`); URLs are identical. **Exception:** the Python API adds **BigQuery** and **Firestore** storage-explorer routes above; the Java `StorageExplorerController` may not implement those paths yet—use Python or extend Java for full picker parity.

## Related Documentation

- [API Workflow Execution](./API_WORKFLOW_EXECUTION.md) - Execution API details
- [WebSocket API Guide](./WEBSOCKET_API_GUIDE.md) - Real-time updates
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Architecture and development
