# Storage Integration Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This guide explains how to configure and integrate different storage backends for the workflow engine. The system currently supports SQLite (default) and can be configured to use PostgreSQL, MySQL, or other SQLAlchemy-supported databases.

## Database Schema Diagram

```mermaid
erDiagram
    users ||--o{ workflows : owns
    users ||--o{ executions : creates
    users ||--o{ settings : has
    workflows ||--o{ executions : generates
    workflows ||--o{ workflow_versions : versions
    workflows ||--o{ workflow_shares : shares
    
    users {
        string id PK
        string username UK
        string email UK
        string password_hash
        datetime created_at
    }
    
    workflows {
        string id PK
        string name
        string description
        json definition
        string owner_id FK
        boolean is_public
        datetime created_at
        datetime updated_at
    }
    
    executions {
        string id PK
        string workflow_id FK
        string user_id FK
        string status
        json state
        datetime started_at
        datetime completed_at
    }
    
    settings {
        string id PK
        string user_id FK
        json settings_data
        datetime created_at
        datetime updated_at
    }
    
    workflow_versions {
        string id PK
        string workflow_id FK
        integer version_number
        json definition
        text change_notes
        string created_by FK
        datetime created_at
    }
    
    workflow_shares {
        string id PK
        string workflow_id FK
        string shared_with_user_id FK
        string permission
        datetime created_at
    }
```

**Quick Start:**
1. Choose your database (SQLite for development, PostgreSQL for production)
2. Set `DATABASE_URL` environment variable
3. Run the application - tables are created automatically
4. For production, configure connection pooling and backups

**See Also:**
- [Migration Guide](./MIGRATION_GUIDE.md) - Moving between databases
- [Performance Tuning Guide](./PERFORMANCE_TUNING_GUIDE.md) - Database optimization

## Supported Storage Backends

### SQLite (Default)
- **Use Case**: Development, testing, small deployments
- **Pros**: No setup required, file-based, portable
- **Cons**: Limited concurrency, not suitable for production scale

### PostgreSQL (Recommended for Production)
- **Use Case**: Production deployments, high concurrency
- **Pros**: Excellent performance, ACID compliance, advanced features
- **Cons**: Requires separate database server

### MySQL/MariaDB
- **Use Case**: Production deployments, existing MySQL infrastructure
- **Pros**: Widely supported, good performance
- **Cons**: Requires separate database server

## Configuration

### Environment Variables

Configure storage via the `DATABASE_URL` environment variable:

```bash
# SQLite (default)
DATABASE_URL=sqlite+aiosqlite:///./workflows.db

# PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/workflows

# MySQL
DATABASE_URL=mysql+aiomysql://user:password@localhost:3306/workflows
```

### Connection String Format

```
{driver}://{user}:{password}@{host}:{port}/{database}?{options}
```

**Components:**
- `driver`: Database driver (`sqlite+aiosqlite`, `postgresql+asyncpg`, `mysql+aiomysql`)
- `user`: Database username
- `password`: Database password
- `host`: Database hostname
- `port`: Database port
- `database`: Database name
- `options`: Additional connection options (optional)

### Connection Options

#### PostgreSQL Options
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db?pool_size=20&max_overflow=10&pool_timeout=30
```

**Common Options:**
- `pool_size`: Number of connections to maintain (default: 5)
- `max_overflow`: Maximum overflow connections (default: 10)
- `pool_timeout`: Seconds to wait for connection (default: 30)
- `pool_recycle`: Seconds before recycling connection (default: 3600)

#### MySQL Options
```bash
DATABASE_URL=mysql+aiomysql://user:pass@host:3306/db?charset=utf8mb4&pool_size=20
```

**Common Options:**
- `pool_size`: Connection pool size
- `charset`: Character set (recommend: `utf8mb4`)
- `connect_timeout`: Connection timeout in seconds

## Setup Instructions

### SQLite Setup

No setup required! SQLite is the default and works out of the box.

```bash
# Database file will be created automatically at ./workflows.db
# No additional configuration needed
```

**Real-World Example:**
```bash
# Development environment
# .env file
DATABASE_URL=sqlite+aiosqlite:///./workflows.db

# Start application - database created automatically
python main.py

# Database file appears at ./workflows.db
# Contains: users, workflows, executions, settings tables
```

### PostgreSQL Setup

#### 1. Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Docker:**
```bash
docker run --name postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=workflows \
  -p 5432:5432 \
  -d postgres:15
```

#### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE workflows;
CREATE USER workflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE workflows TO workflow_user;
\q
```

#### 3. Install Python Driver

```bash
pip install asyncpg
```

#### 4. Configure Connection

```bash
# .env file
DATABASE_URL=postgresql+asyncpg://workflow_user:your_password@localhost:5432/workflows
```

#### 5. Initialize Database

```bash
# Run migrations or create tables
python -c "from backend.database.db import init_db; import asyncio; asyncio.run(init_db())"
```

**Real-World Example:**
```bash
# Production PostgreSQL setup
# 1. Create database and user
psql -U postgres
CREATE DATABASE workflows_prod;
CREATE USER app_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE workflows_prod TO app_user;
\q

# 2. Configure connection
# .env file
DATABASE_URL=postgresql+asyncpg://app_user:secure_password_123@db.example.com:5432/workflows_prod?pool_size=20&max_overflow=10&ssl=require

# 3. Initialize schema
python -c "from backend.database.db import init_db; import asyncio; asyncio.run(init_db())"

# 4. Verify tables created
psql -U app_user -d workflows_prod -c "\dt"
# Should show: users, workflows, executions, settings, workflow_versions, workflow_shares
```

### MySQL Setup

#### 1. Install MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
```

**Docker:**
```bash
docker run --name mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=workflows \
  -e MYSQL_USER=workflow_user \
  -e MYSQL_PASSWORD=your_password \
  -p 3306:3306 \
  -d mysql:8.0
```

#### 2. Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE workflows CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'workflow_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON workflows.* TO 'workflow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Install Python Driver

```bash
pip install aiomysql
```

#### 4. Configure Connection

```bash
# .env file
DATABASE_URL=mysql+aiomysql://workflow_user:your_password@localhost:3306/workflows?charset=utf8mb4
```

## Database Schema

The application uses SQLAlchemy ORM models defined in `backend/database/models.py`. See the [Database Schema Diagram](#database-schema-diagram) above for a visual representation.

### Core Tables

**users**
- `id`: Primary key (UUID or integer)
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Bcrypt-hashed password
- `created_at`: Timestamp

**workflows**
- `id`: Primary key
- `name`: Workflow name
- `description`: Workflow description
- `definition`: JSON workflow definition
- `owner_id`: Foreign key to users
- `is_public`: Boolean visibility flag
- `created_at`, `updated_at`: Timestamps

**executions**
- `id`: Primary key
- `workflow_id`: Foreign key to workflows
- `user_id`: Foreign key to users
- `status`: Execution status (pending, running, completed, failed)
- `state`: JSON execution state
- `started_at`, `completed_at`: Timestamps

**settings**
- `id`: Primary key
- `user_id`: Foreign key to users
- `settings_data`: JSON settings (LLM providers, etc.)
- `created_at`, `updated_at`: Timestamps

## Migration and Schema Updates

### Automatic Schema Creation

The application automatically creates tables on startup:

```python
# backend/database/db.py
async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### Manual Migration (Future)

For production deployments, consider using Alembic for migrations:

```bash
# Install Alembic
pip install alembic

# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

## Connection Pooling

### Configuration

Connection pooling is handled by SQLAlchemy. Configure via connection string:

```python
# backend/config.py
database_url: str = "postgresql+asyncpg://user:pass@host:5432/db?pool_size=20&max_overflow=10"
```

### Recommended Pool Sizes

**Development:**
- `pool_size=5`
- `max_overflow=10`

**Production:**
- `pool_size=20`
- `max_overflow=10`
- Adjust based on concurrent request load

### Monitoring Pool Usage

```python
from backend.database.db import engine

# Check pool status
pool = engine.pool
print(f"Pool size: {pool.size()}")
print(f"Checked out: {pool.checkedout()}")
print(f"Overflow: {pool.overflow()}")
```

## Backup and Recovery

### SQLite Backup

```bash
# Simple file copy
cp workflows.db workflows.db.backup

# Using SQLite backup command
sqlite3 workflows.db ".backup workflows.db.backup"
```

### PostgreSQL Backup

```bash
# Full database backup
pg_dump -U workflow_user workflows > backup.sql

# Restore
psql -U workflow_user workflows < backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U workflow_user workflows > "backup_${DATE}.sql"
```

### MySQL Backup

```bash
# Full database backup
mysqldump -u workflow_user -p workflows > backup.sql

# Restore
mysql -u workflow_user -p workflows < backup.sql
```

## Performance Optimization

### Indexes

The application creates indexes on frequently queried fields:

- `users.username` (unique)
- `users.email` (unique)
- `workflows.owner_id`
- `executions.workflow_id`
- `executions.user_id`
- `executions.status`

### Query Optimization

**Use async queries:**
```python
# Good: Async query
result = await db.execute(select(WorkflowDB).where(WorkflowDB.owner_id == user_id))
workflows = result.scalars().all()

# Avoid: Synchronous operations
# workflows = db.query(WorkflowDB).filter_by(owner_id=user_id).all()
```

**Batch operations:**
```python
# Batch insert
workflows = [WorkflowDB(...), WorkflowDB(...)]
db.add_all(workflows)
await db.commit()
```

### Monitoring

**Enable query logging:**
```python
# backend/config.py
log_level: str = "DEBUG"  # Shows SQL queries
```

**Database metrics:**
- Connection pool usage
- Query execution time
- Slow query logging (PostgreSQL/MySQL)

## Troubleshooting

### Connection Issues

**Error: "Connection refused"**
- Verify database server is running
- Check host and port configuration
- Verify firewall rules

**Error: "Authentication failed"**
- Verify username and password
- Check user permissions
- Verify database exists

**Error: "Database does not exist"**
- Create database manually
- Verify database name in connection string

### Performance Issues

**Slow queries:**
- Check indexes are created
- Analyze query plans
- Consider connection pool size
- Monitor database load

**Connection pool exhaustion:**
- Increase `pool_size`
- Increase `max_overflow`
- Check for connection leaks
- Monitor connection usage

### Migration Issues

**Schema mismatch:**
- Verify models match database schema
- Run `init_db()` to create missing tables
- Check for manual schema changes

**Data type issues:**
- Verify JSON columns support JSON type (PostgreSQL 9.4+, MySQL 5.7+)
- Use `TEXT` type for JSON in older databases

## Security Considerations

### Connection Security

**Use SSL/TLS in production:**
```bash
# PostgreSQL with SSL
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db?ssl=require

# MySQL with SSL
DATABASE_URL=mysql+aiomysql://user:pass@host:3306/db?ssl=true
```

### Credential Management

**Never commit credentials:**
- Use environment variables
- Use secret management systems (Kubernetes secrets, AWS Secrets Manager)
- Rotate credentials regularly

**Example:**
```bash
# .env file (not committed)
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# Or use secrets manager
DATABASE_URL=${SECRETS_MANAGER_DATABASE_URL}
```

## Production Checklist

- [ ] Use PostgreSQL or MySQL (not SQLite)
- [ ] Configure connection pooling appropriately
- [ ] Enable SSL/TLS connections
- [ ] Set up automated backups
- [ ] Monitor connection pool usage
- [ ] Configure database indexes
- [ ] Set up database replication (if needed)
- [ ] Use read replicas for read-heavy workloads
- [ ] Implement connection retry logic
- [ ] Set up database monitoring and alerts

## Related Documentation

- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Database models and patterns
- [Technical Design](./TECHNICAL_DESIGN.md) - Database schema details
- [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md) - Production deployment with databases
