# Performance Tuning Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This guide covers performance optimization strategies, profiling techniques, and best practices for improving the workflow engine's performance.

## Real-World Performance Optimization Examples

### Example 1: Optimizing Database Queries

**Problem:** Workflow list page loads slowly (2+ seconds)

**Before:**
```python
# N+1 query problem
workflows = await db.execute(select(WorkflowDB))
for workflow in workflows:
    # Separate query for each workflow
    executions = await db.execute(
        select(ExecutionDB).where(ExecutionDB.workflow_id == workflow.id)
    )
```

**After:**
```python
# Single query with join
from sqlalchemy.orm import selectinload

workflows = await db.execute(
    select(WorkflowDB)
    .options(selectinload(WorkflowDB.executions))
    .where(WorkflowDB.owner_id == user_id)
)
# All executions loaded in one query
```

**Result:** Page load time reduced from 2.1s to 0.3s (7x improvement)

### Example 2: Caching LLM Responses

**Problem:** Same prompts executed multiple times, wasting API calls

**Before:**
```python
# No caching - every call hits API
result1 = await llm_client.complete("What is Python?")
result2 = await llm_client.complete("What is Python?")  # Duplicate call
```

**After:**
```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
async def get_cached_llm_response(prompt: str, model: str):
    """Cache LLM responses for identical prompts"""
    return await llm_client.complete(prompt, model)

# First call hits API
result1 = await get_cached_llm_response("What is Python?", "gpt-4")
# Second call uses cache
result2 = await get_cached_llm_response("What is Python?", "gpt-4")
```

**Result:** 40% reduction in API calls, faster response times

### Example 3: Parallel Node Execution

**Problem:** Sequential execution takes too long (3 nodes × 10s = 30s)

**Before:**
```python
# Sequential execution
result1 = await execute_node(node1)
result2 = await execute_node(node2)  # Waits for node1
result3 = await execute_node(node3)  # Waits for node2
```

**After:**
```python
# Parallel execution for independent nodes
independent_nodes = [node1, node2, node3]
results = await asyncio.gather(*[
    execute_node(node) for node in independent_nodes
])
```

**Result:** Execution time reduced from 30s to 10s (3x improvement)

**Performance Optimization Approach:**
1. **Measure First**: Profile to identify bottlenecks
2. **Optimize Database**: Indexes, connection pooling, query optimization
3. **Optimize API**: Async operations, caching, pagination
4. **Optimize Frontend**: Code splitting, memoization, virtualization
5. **Monitor**: Track metrics and adjust as needed

**See Also:**
- [Storage Integration Guide](./STORAGE_INTEGRATION_GUIDE.md) - Database configuration
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Performance patterns
- [Real-World Examples](#real-world-performance-optimization-examples) - Practical optimization scenarios

## Performance Metrics

### Key Metrics

**Response Time:**
- API endpoints: <200ms (p95)
- Workflow execution: Varies by complexity
- Database queries: <50ms (p95)

**Throughput:**
- Requests per second: Target 100+ RPS
- Concurrent executions: Limited by resources
- Database connections: Pool size dependent

**Resource Usage:**
- CPU: <70% average
- Memory: Monitor for leaks
- Database connections: <80% pool usage

## Backend Performance

### Database Optimization

#### Connection Pooling

**Configuration:**
```python
# backend/config.py
database_url: str = (
    "postgresql+asyncpg://user:pass@host:5432/db"
    "?pool_size=20"
    "&max_overflow=10"
    "&pool_timeout=30"
    "&pool_recycle=3600"
)
```

**Recommended Settings:**
- Development: `pool_size=5`, `max_overflow=10`
- Production: `pool_size=20`, `max_overflow=10`
- High load: `pool_size=50`, `max_overflow=20`

#### Query Optimization

**Use Indexes:**
```python
# Add indexes for frequently queried fields
class WorkflowDB(Base):
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True)
    owner_id = Column(String, index=True)  # Indexed
    name = Column(String, index=True)      # Indexed
```

**Avoid N+1 Queries:**
```python
# Bad: N+1 queries
workflows = await db.execute(select(WorkflowDB))
for workflow in workflows:
    executions = await db.execute(
        select(ExecutionDB).where(ExecutionDB.workflow_id == workflow.id)
    )

# Good: Single query with join
from sqlalchemy.orm import selectinload
workflows = await db.execute(
    select(WorkflowDB).options(selectinload(WorkflowDB.executions))
)
```

**Batch Operations:**
```python
# Bad: Individual inserts
for item in items:
    db.add(item)
    await db.commit()

# Good: Batch insert
db.add_all(items)
await db.commit()
```

#### Caching

**Settings Cache:**
```python
# backend/utils/settings_cache.py
_settings_cache: Dict[str, Any] = {}

def get_settings_cache() -> Dict[str, Any]:
    return _settings_cache

# Cache settings on startup
async def load_settings_into_cache(db: AsyncSession):
    # Load from database once
    # Store in memory cache
    pass
```

**Query Result Caching (Future):**
```python
from functools import lru_cache
from datetime import timedelta

@lru_cache(maxsize=100)
def get_workflow_definition(workflow_id: str):
    # Cache workflow definitions
    pass
```

### API Optimization

#### Async Operations

**Use Async Throughout:**
```python
# Good: Async endpoint
@router.get("/workflows")
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowDB))
    return result.scalars().all()

# Bad: Blocking operations
@router.get("/workflows")
def list_workflows():
    result = db.query(WorkflowDB).all()  # Blocking
    return result
```

#### Response Compression

**Enable Gzip:**
```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

#### Pagination

**Implement Pagination:**
```python
@router.get("/workflows")
async def list_workflows(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WorkflowDB)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
```

### Execution Optimization

#### Parallel Execution

**Execute Independent Nodes in Parallel:**
```python
# Execute nodes without dependencies in parallel
independent_nodes = [n for n in nodes if not n.dependencies]
results = await asyncio.gather(*[
    execute_node(node) for node in independent_nodes
])
```

#### LLM Call Optimization

**Batch Requests (when possible):**
```python
# If LLM supports batching
responses = await llm_client.batch_complete([
    {"prompt": p1},
    {"prompt": p2},
    {"prompt": p3}
])
```

**Stream Responses:**
```python
# Stream LLM responses for better perceived performance
async for chunk in llm_client.stream_complete(prompt):
    yield chunk
```

**Cache Common Prompts:**
```python
# Cache LLM responses for identical prompts
@lru_cache(maxsize=1000)
async def get_llm_response(prompt: str, model: str):
    return await llm_client.complete(prompt, model)
```

## Frontend Performance

### React Optimization

#### Component Memoization

**Use React.memo:**
```typescript
export const WorkflowCard = React.memo(({ workflow }: Props) => {
  return <div>{workflow.name}</div>;
});
```

**Use useMemo for Expensive Calculations:**
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

**Use useCallback for Functions:**
```typescript
const handleClick = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);
```

#### Code Splitting

**Route-Based Splitting:**
```typescript
const WorkflowEditor = lazy(() => import('./WorkflowEditor'));
const Marketplace = lazy(() => import('./Marketplace'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/editor" element={<WorkflowEditor />} />
    <Route path="/marketplace" element={<Marketplace />} />
  </Routes>
</Suspense>
```

#### Virtualization

**For Long Lists:**
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={workflows.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {workflows[index].name}
    </div>
  )}
</FixedSizeList>
```

### API Call Optimization

#### Request Debouncing

```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce((query: string) => {
  searchWorkflows(query);
}, 300);
```

#### Request Caching

```typescript
const cache = new Map<string, any>();

async function fetchWorkflow(id: string) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  
  const workflow = await api.getWorkflow(id);
  cache.set(id, workflow);
  return workflow;
}
```

#### Batch Requests

```typescript
// Instead of multiple requests
const workflows = await Promise.all([
  fetchWorkflow('1'),
  fetchWorkflow('2'),
  fetchWorkflow('3')
]);

// Use batch endpoint if available
const workflows = await api.getWorkflows(['1', '2', '3']);
```

### Bundle Optimization

#### Tree Shaking

**Import Only What You Need:**
```typescript
// Good: Import specific functions
import { debounce } from 'lodash-es/debounce';

// Bad: Import entire library
import _ from 'lodash';
```

#### Bundle Analysis

```bash
npm run build -- --analyze
```

## Profiling

### Backend Profiling

#### Python Profiling

**cProfile:**
```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Your code here
await execute_workflow(workflow)

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)  # Top 20 functions
```

**Line Profiler:**
```python
@profile
def slow_function():
    # Code to profile
    pass
```

**Async Profiling:**
```python
import asyncio
from pyinstrument import Profiler

profiler = Profiler()
profiler.start()

await execute_workflow(workflow)

profiler.stop()
print(profiler.output_text())
```

### Frontend Profiling

#### React DevTools Profiler

1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Interact with app
5. Stop recording
6. Analyze performance

#### Chrome DevTools

**Performance Tab:**
1. Open DevTools → Performance
2. Click Record
3. Interact with app
4. Stop recording
5. Analyze flame graph

**Memory Tab:**
1. Open DevTools → Memory
2. Take heap snapshot
3. Interact with app
4. Take another snapshot
5. Compare for leaks

### Database Profiling

#### Query Logging

```python
# Enable SQL logging
engine = create_async_engine(
    DATABASE_URL,
    echo=True  # Log all SQL queries
)
```

#### Slow Query Logging

**PostgreSQL:**
```sql
-- Enable slow query log
SET log_min_duration_statement = 1000;  -- Log queries >1s
```

**MySQL:**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- Log queries >1s
```

## Monitoring

### Application Metrics

**Key Metrics to Monitor:**
- Request rate (RPS)
- Response time (p50, p95, p99)
- Error rate
- Database query time
- Memory usage
- CPU usage

### Tools

**APM Solutions:**
- New Relic
- Datadog
- Sentry (error tracking)

**Custom Metrics:**
```python
from prometheus_client import Counter, Histogram

request_count = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')

@router.get("/workflows")
async def list_workflows():
    with request_duration.time():
        request_count.inc()
        # Endpoint logic
```

## Optimization Checklist

### Backend

- [ ] Database connection pooling configured
- [ ] Database indexes on frequently queried fields
- [ ] N+1 queries eliminated
- [ ] Batch operations used where possible
- [ ] Async/await used throughout
- [ ] Response compression enabled
- [ ] Pagination implemented
- [ ] Caching implemented for expensive operations
- [ ] Parallel execution for independent nodes

### Frontend

- [ ] Components memoized appropriately
- [ ] Code splitting implemented
- [ ] Bundle size optimized
- [ ] API calls debounced/throttled
- [ ] Request caching implemented
- [ ] Images optimized and lazy-loaded
- [ ] Virtualization for long lists
- [ ] Unnecessary re-renders prevented

### Infrastructure

- [ ] Load balancing configured
- [ ] CDN for static assets
- [ ] Database read replicas (if needed)
- [ ] Caching layer (Redis) configured
- [ ] Monitoring and alerting set up

## Performance Testing

### Load Testing

**Tools:**
- **Locust**: Python-based load testing
- **Apache Bench**: Simple HTTP benchmarking
- **k6**: Modern load testing tool

**Example (Locust):**
```python
from locust import HttpUser, task

class WorkflowUser(HttpUser):
    @task
    def list_workflows(self):
        self.client.get("/api/workflows")
    
    @task(3)
    def create_workflow(self):
        self.client.post("/api/workflows", json={
            "name": "Test",
            "definition": {}
        })
```

**Run Load Test:**
```bash
locust -f locustfile.py --host=http://localhost:8000
```

### Stress Testing

**Test Scenarios:**
- Gradual load increase
- Spike testing
- Endurance testing
- Volume testing

## Troubleshooting

### Common Issues

**Slow Database Queries:**
- Check for missing indexes
- Analyze query plans
- Optimize N+1 queries
- Consider read replicas

**High Memory Usage:**
- Check for memory leaks
- Review caching strategies
- Limit concurrent requests
- Increase server memory

**Slow API Responses:**
- Profile endpoints
- Check database queries
- Review external API calls
- Optimize serialization

**Frontend Performance:**
- Analyze bundle size
- Check for unnecessary re-renders
- Optimize images
- Review API call patterns

## Related Documentation

- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Performance patterns
- [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md) - Scaling strategies
- [Architecture](./ARCHITECTURE.md) - System design
