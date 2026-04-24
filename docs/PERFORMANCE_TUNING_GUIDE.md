# Performance Tuning Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This guide covers performance optimization strategies, profiling techniques, and best practices for improving the workflow engine. The server is **Spring Boot** (`backend-java/`); database access is **JPA/JDBC**.

## Backend patterns (Java)

1. **Measure first** — enable Actuator metrics if available, watch GC pauses, JDBC pool waits, and slow-query logs.
2. **Fix N+1 reads** — use `JOIN FETCH`, `@EntityGraph`, or DTO projections on hot list endpoints.
3. **Tune HikariCP** — align `maximum-pool-size` with Postgres `max_connections` and expected concurrency.
4. **Paginate** — use `Pageable` for large tables; never load unbounded collections to the UI in one shot.
5. **Cache deliberately** — Caffeine or similar for stable reads (for example settings) when staleness rules allow.
6. **Compress HTTP** — enable Spring **`server.compression.enabled`** for large JSON payloads where appropriate.

**See also**

- [Storage Integration Guide](./STORAGE_INTEGRATION_GUIDE.md) — pooling and JDBC
- [Java backend README](../backend-java/README.md) — run and profile locally

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

## Backend performance (details)

### Database

- Index foreign keys and columns used in **`WHERE`**, **`ORDER BY`**, and join predicates (see entity `@Table` / `@Index` usage in `backend-java`).
- Use **`spring.datasource.hikari.*`** for pool sizing, connection timeouts, and leak detection.
- Prefer explicit **`@Transactional`** boundaries so sessions do not stay open across unrelated I/O.

### HTTP API

- Enable **`server.compression.enabled`** when responses are large JSON payloads.
- Return **`Page<T>`** (or equivalent) for list endpoints; cap maximum page size server-side.
- Offload long-running work from request threads when you add new features (`@Async`, bounded executors, or queues)—do not block servlet threads on slow upstream APIs.

### Workflow execution and LLMs

- The engine already runs independent branches where the graph allows; when extending execution, keep thread pools bounded.
- Reuse HTTP clients (**`WebClient`** / **`RestTemplate`**) with sensible timeouts; add application-level caching only when responses are safe to reuse.

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

### Backend profiling (JVM)

- **`jcmd <pid> Thread.print`** — quick thread dump when the API stalls.
- **JDK Flight Recorder (JFR)** — record CPU, allocation, and JDBC stalls on a running `bootRun` or container JVM.
- **Async-profiler** or your APM’s **CPU flame graph** — find hot methods in services and persistence layers.

### Frontend profiling

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

#### Query logging (Hibernate)

```properties
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.orm.jdbc.bind=TRACE
```

#### Slow query logging

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

**Custom metrics:** expose **Micrometer** meters from services (for example timers around external LLM calls) and scrape them with Prometheus if you add the Actuator Prometheus registry to the build.

## Optimization Checklist

### Backend

- [ ] Database connection pooling configured
- [ ] Database indexes on frequently queried fields
- [ ] N+1 queries eliminated
- [ ] Batch operations used where possible
- [ ] Servlet threads not blocked on slow I/O; pools sized for workload
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

**Tools:** **k6**, **Apache Bench**, or any HTTP load generator against `http://localhost:8000`.

**Example (k6):**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 10, duration: '30s' };

export default function () {
  const res = http.get('http://localhost:8000/api/workflows');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

```bash
k6 run script.js
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

- [Java backend README](../backend-java/README.md) - Performance patterns
- [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md) - Scaling strategies
- [Architecture](./ARCHITECTURE.md) - System design
