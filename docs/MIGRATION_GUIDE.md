# Migration Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This guide covers upgrading the **Java** workflow engine (`backend-java/`), moving between databases (for example SQLite to PostgreSQL), and handling breaking API or schema changes. Use **JDBC**, **JPA/Hibernate**, and **Flyway** or **Liquibase** for schema changes.

## Moving from SQLite to PostgreSQL

**Typical steps**

1. **Backup SQLite** (minutes):
   ```bash
   cp workflows.db "workflows.db.backup-$(date +%Y%m%d)"
   ```

2. **Provision PostgreSQL** (Docker example):
   ```bash
   docker run --name postgres-prod \
     -e POSTGRES_PASSWORD=secure_password \
     -e POSTGRES_DB=workflows \
     -p 5432:5432 \
     -d postgres:15
   ```

3. **Create role and database** (if not using defaults):
   ```bash
   psql -U postgres -c "CREATE USER workflow_user WITH PASSWORD 'your_password';"
   psql -U postgres -c "CREATE DATABASE workflows OWNER workflow_user;"
   ```

4. **Point Spring at PostgreSQL** — set JDBC properties (or env vars your `application-postgresql.properties` maps), for example:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/workflows
   spring.datasource.username=workflow_user
   spring.datasource.password=your_password
   spring.jpa.hibernate.ddl-auto=update
   ```
   Use `validate` plus explicit migrations in production instead of relying on `update` long term.

5. **Move data** — export from SQLite (`sqlite3 workflows.db .dump` or CSV per table) and load into PostgreSQL with adjusted types, or use a dedicated ETL/pgloader-style tool. There is no bundled one-click migrator in this repo; plan a short maintenance window and verify row counts and spot-check JSON columns (`definition`, `state`, settings blobs).

6. **Verify** — start `./gradlew bootRun`, hit health and critical CRUD paths, and compare counts:
   ```bash
   sqlite3 workflows.db.backup-YYYYMMDD 'SELECT COUNT(*) FROM workflows;'
   psql -U workflow_user -d workflows -c 'SELECT COUNT(*) FROM workflows;'
   ```

See [Storage Integration Guide](./STORAGE_INTEGRATION_GUIDE.md) for datasource and pool tuning.

## Schema changes (production)

- Prefer **versioned SQL** (Flyway/Liquibase) committed under `backend-java/`, aligned with JPA entities in `com.workflow.entity`.
- Example Flyway-style change (add nullable column):
  ```sql
  ALTER TABLE workflows ADD COLUMN tags JSONB;
  ```
- Roll back with a companion script or a forward fix—avoid hand-editing production without a backup.

## API and client migration

- Endpoints remain under **`/api/...`** unless release notes say otherwise.
- When response shapes change, update the **React** client and any external consumers together; use integration tests and staging before production.

## Configuration migration

- Database URL for Java is **`spring.datasource.url`** (JDBC), not a legacy async `DATABASE_URL`.
- LLM keys are usually per-user via **Settings**; root `.env` may still supply fallbacks such as `OPENAI_API_KEY`—see [Configuration Reference](./CONFIGURATION_REFERENCE.md).

## Backup and recovery

### Pre-migration backup

**SQLite:**
```bash
cp workflows.db workflows.db.backup
```

**PostgreSQL:**
```bash
pg_dump -U user workflows > "backup_$(date +%Y%m%d).sql"
```

**MySQL:**
```bash
mysqldump -u user workflows > "backup_$(date +%Y%m%d).sql"
```

### Recovery procedure

1. Stop the API (and frontend if needed).
2. Restore:
   ```bash
   psql -U user workflows < backup.sql
   # or
   mysql -u user workflows < backup.sql
   # or
   cp workflows.db.backup workflows.db
   ```
3. Verify table counts and a sample of workflows in the UI or with SQL.
4. Restart services.

## Rollback procedures

### Code rollback

```bash
git checkout v1.0.0
# or
git revert <commit-hash>
```

### Database rollback

- If you use Flyway/Liquibase, use the tool’s **down** or repair workflow only if you have tested it; otherwise restore from **backup** (preferred for production incidents).

### Configuration rollback

```bash
cp .env.backup .env
# Restart the Java API after restoring env files
```

## Migration checklist

### Pre-migration

- [ ] Read release notes for `[BREAKING]` changes
- [ ] Backup database and config
- [ ] Rehearse on staging
- [ ] Plan downtime or read-only window if required

### During migration

- [ ] Stop or drain traffic from the old deployment
- [ ] Apply schema migrations in order
- [ ] Load or transform data as planned
- [ ] Smoke-test auth, workflow CRUD, execution

### Post-migration

- [ ] Verify data integrity and performance
- [ ] Monitor logs and metrics
- [ ] Update internal runbooks

## Troubleshooting

| Symptom | Things to check |
|--------|------------------|
| Migration fails | JDBC URL, credentials, extensions, disk space, Flyway history table |
| Data mismatch | Row counts, JSON columns, timezone columns |
| Slow queries | Indexes, Hibernate fetch graphs, pool sizing |
| API errors | JWT expiry, CORS, changed DTO fields |

## Related documentation

- [Storage Integration Guide](./STORAGE_INTEGRATION_GUIDE.md) — database setup
- [Java backend README](../backend-java/README.md) — build and run
- [API Reference](./API_REFERENCE.md) — HTTP contract
