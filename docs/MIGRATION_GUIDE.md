# Migration Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This guide covers migrating between different versions of the workflow engine, upgrading databases, and handling breaking changes.

## Real-World Migration Scenarios

### Scenario 1: Migrating from SQLite to PostgreSQL

**Context:** Startup company, moving from development to production

**Timeline:** 2 hours downtime window

**Steps:**
```bash
# 1. Backup SQLite database (5 minutes)
cp workflows.db workflows.db.backup-$(date +%Y%m%d)

# 2. Set up PostgreSQL (10 minutes)
docker run --name postgres-prod \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=workflows \
  -p 5432:5432 \
  -d postgres:15

# 3. Update connection string (1 minute)
# .env
DATABASE_URL=postgresql+asyncpg://postgres:secure_password@localhost:5432/workflows

# 4. Run migration script (30 minutes)
python scripts/migrate_sqlite_to_postgres.py

# 5. Verify data (10 minutes)
python scripts/verify_migration.py

# 6. Restart application (1 minute)
# Total: ~57 minutes, well within 2-hour window
```

**Result:** Successful migration, zero data loss, minimal downtime

### Scenario 2: Adding New Column to Workflows Table

**Context:** Need to add `tags` field to workflows

**Migration:**
```python
# alembic/versions/002_add_tags_to_workflows.py
def upgrade():
    op.add_column('workflows', 
        sa.Column('tags', sa.JSON(), nullable=True)
    )

def downgrade():
    op.drop_column('workflows', 'tags')
```

**Data Migration:**
```python
# Migrate existing workflows
async def migrate_workflow_tags():
    async for db in get_db():
        workflows = await db.execute(select(WorkflowDB))
        for workflow in workflows.scalars():
            # Extract tags from description or set default
            if not workflow.tags:
                workflow.tags = []
            await db.commit()
```

**Rollback Plan:**
```bash
# If issues occur
alembic downgrade -1
# Restore from backup
psql workflows < backup_before_migration.sql
```

## Version Compatibility

### Current Version

**Backend:** 1.0.0  
**Frontend:** 1.0.0  
**API Version:** v1

### Breaking Changes

Breaking changes are documented in release notes and marked with `[BREAKING]` in changelog.

## Database Migrations

### SQLite to PostgreSQL

#### 1. Export Data

```bash
# Export SQLite data
sqlite3 workflows.db .dump > backup.sql
```

#### 2. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE workflows;
CREATE USER workflow_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE workflows TO workflow_user;
\q
```

#### 3. Update Connection String

```bash
# .env file
DATABASE_URL=postgresql+asyncpg://workflow_user:password@localhost:5432/workflows
```

#### 4. Initialize Schema

```python
# Run schema creation
python -c "from backend.database.db import init_db; import asyncio; asyncio.run(init_db())"
```

#### 5. Import Data (Manual)

**Note:** Direct SQL import may require adjustments for:
- Data type differences
- Auto-increment IDs
- Timestamp formats

**Recommended:** Use data migration script:

```python
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from backend.database.models import WorkflowDB

# SQLite source
sqlite_engine = create_engine('sqlite:///workflows.db')
SQLiteSession = sessionmaker(bind=sqlite_engine)

# PostgreSQL destination
pg_engine = create_async_engine('postgresql+asyncpg://user:pass@host:5432/workflows')
PGSession = async_sessionmaker(pg_engine)

async def migrate_data():
    sqlite_session = SQLiteSession()
    async with PGSession() as pg_session:
        # Migrate workflows
        workflows = sqlite_session.query(WorkflowDB).all()
        for workflow in workflows:
            # Create new workflow object with same data
            new_workflow = WorkflowDB(
                id=workflow.id,
                name=workflow.name,
                description=workflow.description,
                definition=workflow.definition,
                owner_id=workflow.owner_id,
                is_public=workflow.is_public,
                created_at=workflow.created_at,
                updated_at=workflow.updated_at
            )
            pg_session.add(new_workflow)
        
        await pg_session.commit()
    sqlite_session.close()
```

### Schema Updates

#### Automatic Schema Creation

The application automatically creates tables on startup:

```python
# backend/database/db.py
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

**Note:** This only creates missing tables. It doesn't modify existing tables.

#### Manual Schema Updates

For production, use Alembic migrations:

**1. Install Alembic:**
```bash
pip install alembic
```

**2. Initialize Alembic:**
```bash
alembic init alembic
```

**3. Configure (`alembic/env.py`):**
```python
from backend.database.db import Base
from backend.database.models import WorkflowDB, ExecutionDB, UserDB, SettingsDB

target_metadata = Base.metadata
```

**4. Create Migration:**
```bash
alembic revision --autogenerate -m "Add new column"
```

**5. Review Migration:**
```python
# alembic/versions/xxx_add_new_column.py
def upgrade():
    op.add_column('workflows', sa.Column('new_column', sa.String()))

def downgrade():
    op.drop_column('workflows', 'new_column')
```

**6. Apply Migration:**
```bash
alembic upgrade head
```

**7. Rollback (if needed):**
```bash
alembic downgrade -1
```

## API Version Migration

### API Versioning

**Current:** `/api/v1/...`

**Future Versions:**
- `/api/v2/...` - New version
- `/api/v1/...` - Maintained for backward compatibility

### Migrating API Clients

#### Version Detection

```python
# Check API version
response = requests.get('http://api.example.com/api/version')
version = response.json()['version']
```

#### Gradual Migration

**1. Support Both Versions:**
```python
def get_workflow(workflow_id: str, api_version: str = 'v1'):
    if api_version == 'v2':
        return requests.get(f'/api/v2/workflows/{workflow_id}')
    else:
        return requests.get(f'/api/v1/workflows/{workflow_id}')
```

**2. Update to New Version:**
```python
# Update to v2
response = requests.get('/api/v2/workflows/123')
```

**3. Remove Old Version Support:**
```python
# After migration complete
def get_workflow(workflow_id: str):
    return requests.get(f'/api/v2/workflows/{workflow_id}')
```

## Configuration Migration

### Environment Variables

**Old Format:**
```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=sqlite:///workflows.db
```

**New Format:**
```bash
# LLM providers now configured via Settings API
# DATABASE_URL format unchanged
DATABASE_URL=postgresql+asyncpg://...
```

### Settings Migration

**Migrate API Keys to Settings:**

```python
import os
import asyncio
from backend.database.db import get_db
from backend.database.models import SettingsDB

async def migrate_api_keys():
    async for db in get_db():
        # Get API key from environment
        api_key = os.getenv("OPENAI_API_KEY")
        
        if api_key:
            # Create settings record
            settings = SettingsDB(
                user_id="anonymous",
                settings_data={
                    "providers": [{
                        "id": "openai-1",
                        "name": "OpenAI",
                        "type": "openai",
                        "apiKey": api_key,
                        "enabled": True
                    }]
                }
            )
            db.add(settings)
            await db.commit()
```

## Data Migration

### Workflow Definition Updates

**Example: Adding New Fields:**

```python
async def migrate_workflow_definitions():
    async for db in get_db():
        workflows = await db.execute(select(WorkflowDB))
        
        for workflow in workflows.scalars():
            definition = workflow.definition
            
            # Add new field if missing
            if 'version' not in definition:
                definition['version'] = '1.0'
            
            # Update node structure
            if 'nodes' in definition:
                for node in definition['nodes']:
                    if 'metadata' not in node:
                        node['metadata'] = {}
            
            workflow.definition = definition
        
        await db.commit()
```

### Execution State Migration

**Example: Updating Execution Format:**

```python
async def migrate_execution_states():
    async for db in get_db():
        executions = await db.execute(select(ExecutionDB))
        
        for execution in executions.scalars():
            state = execution.state
            
            # Migrate old format to new format
            if 'nodes' in state:
                # Old format: nodes as dict
                # New format: nodes as array
                nodes_array = [
                    {"id": k, **v} 
                    for k, v in state['nodes'].items()
                ]
                state['nodes'] = nodes_array
            
            execution.state = state
        
        await db.commit()
```

## Backup and Recovery

### Pre-Migration Backup

**SQLite:**
```bash
cp workflows.db workflows.db.backup
```

**PostgreSQL:**
```bash
pg_dump -U user workflows > backup_$(date +%Y%m%d).sql
```

**MySQL:**
```bash
mysqldump -u user workflows > backup_$(date +%Y%m%d).sql
```

### Recovery Procedure

**1. Stop Application:**
```bash
# Stop backend and frontend
```

**2. Restore Database:**
```bash
# PostgreSQL
psql -U user workflows < backup.sql

# MySQL
mysql -u user workflows < backup.sql

# SQLite
cp workflows.db.backup workflows.db
```

**3. Verify Data:**
```python
# Verify critical data
from sqlalchemy import select, func
from backend.database.db import get_db
from backend.database.models import WorkflowDB
import asyncio

async def verify():
    async for db in get_db():
        result = await db.execute(select(func.count(WorkflowDB.id)))
        count = result.scalar()
        print(f'Workflows: {count}')

asyncio.run(verify())
```

**4. Restart Application:**
```bash
# Start backend and frontend
```

## Rollback Procedures

### Code Rollback

**1. Git Rollback:**
```bash
# Checkout previous version
git checkout v1.0.0

# Or revert specific commit
git revert <commit-hash>
```

**2. Database Rollback:**

**If using Alembic:**
```bash
alembic downgrade -1
```

**Manual Rollback:**
```python
# Run reverse migration script
python scripts/rollback_migration.py
```

### Configuration Rollback

**1. Restore Environment:**
```bash
# Restore .env from backup
cp .env.backup .env
```

**2. Restart Services:**
```bash
# Restart application
```

## Migration Checklist

### Pre-Migration

- [ ] Review migration documentation
- [ ] Backup database
- [ ] Backup configuration files
- [ ] Test migration on staging environment
- [ ] Notify users of downtime (if needed)
- [ ] Prepare rollback plan

### During Migration

- [ ] Stop application services
- [ ] Backup current state
- [ ] Run migration scripts
- [ ] Verify migration success
- [ ] Test critical functionality
- [ ] Monitor for errors

### Post-Migration

- [ ] Verify all data migrated
- [ ] Test API endpoints
- [ ] Test frontend functionality
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Update documentation

## Troubleshooting

### Common Issues

**Migration Fails:**
- Check error logs
- Verify database permissions
- Ensure sufficient disk space
- Check database version compatibility

**Data Loss:**
- Stop migration immediately
- Restore from backup
- Investigate cause
- Fix migration script
- Retry migration

**Performance Degradation:**
- Check database indexes
- Review query performance
- Monitor resource usage
- Optimize as needed

**API Compatibility Issues:**
- Check API version
- Verify request/response formats
- Update client code
- Test thoroughly

## Migration Scripts

### Example: Full Migration Script

```python
#!/usr/bin/env python3
"""
Migration script for version X.Y.Z
"""
import asyncio
import sys
from sqlalchemy import select
from backend.database.db import get_db, init_db
from backend.database.models import WorkflowDB, ExecutionDB

async def migrate():
    """Run migration"""
    print("Starting migration...")
    
    # Initialize database
    await init_db()
    
    # Migrate workflows
    async for db in get_db():
        result = await db.execute(select(WorkflowDB))
        workflows = result.scalars().all()
        count = 0
        
        for workflow in workflows:
            # Migration logic here
            count += 1
        
        await db.commit()
        print(f"Migrated {count} workflows")
    
    print("Migration complete!")

if __name__ == "__main__":
    try:
        asyncio.run(migrate())
        sys.exit(0)
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
```

## Related Documentation

- [Storage Integration Guide](./STORAGE_INTEGRATION_GUIDE.md) - Database setup
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Database models
- [API Reference](./API_REFERENCE.md) - API versioning
- [Real-World Scenarios](#real-world-migration-scenarios) - Practical migration examples
