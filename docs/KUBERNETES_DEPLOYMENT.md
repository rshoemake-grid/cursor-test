# Kubernetes Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Agentic Workflow Builder application to Kubernetes. The application consists of:

- **Backend**: Java Spring Boot application (`backend-java`, port 8000)
- **Frontend**: React (Create React App) static build served on port 3000 or via ingress
- **Database**: PostgreSQL (recommended) or SQLite (development)

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured and connected to cluster
- Docker registry access (for pushing images)
- PostgreSQL database (for production) or SQLite (for development)
- Domain name and SSL certificates (for production)
- Helm 3.x (optional, for easier management)

## Architecture

```
┌─────────────────┐
│   Ingress       │
│   (nginx/traefik)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Frontend│ │Backend│
│Service │ │Service│
└───┬───┘ └──┬────┘
    │        │
    │   ┌────▼────┐
    │   │Database │
    │   │(Postgres)│
    │   └─────────┘
    │
└───┴──────────────┐
                   │
            ┌──────▼──────┐
            │ ConfigMaps  │
            │ & Secrets   │
            └─────────────┘
```

## Table of Contents

1. [Building Docker Images](#building-docker-images)
2. [Database Setup](#database-setup)
3. [Kubernetes Manifests](#kubernetes-manifests)
4. [Configuration Management](#configuration-management)
5. [Deployment Steps](#deployment-steps)
6. [Health Checks & Monitoring](#health-checks--monitoring)
7. [Scaling & Performance](#scaling--performance)
8. [Troubleshooting](#troubleshooting)

## Building Docker Images

### Backend Dockerfile

The repo ships **`backend-java/Dockerfile`**, which builds the Spring Boot JAR from the `backend-java/` directory:

```bash
docker build -t workflow-builder-backend:latest -f backend-java/Dockerfile ./backend-java
```

See `backend-java/Dockerfile` for the full multi-stage definition (Temurin 17, `bootJar`, non-root user, `/health` check).

**Logging (Java backend):** The app uses **SLF4J + Logback** with **`backend-java/src/main/resources/logback-spring.xml`**. All application logs are written to **stdout/stderr** (no log files in the container), so Docker, Kubernetes (`kubectl logs`), and agents such as **Datadog** can ingest the stream from the container runtime.

- Default profile: human-readable lines with ISO-8601 timestamps.
- For log platforms that prefer structured events, activate the **`json`** Spring profile (e.g. set `SPRING_PROFILES_ACTIVE` to `production,json` in ConfigMap or env). That emits **one JSON object per line** via the **Logstash Logback Encoder**.

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build application
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Frontend Nginx Configuration

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api {
        proxy_pass http://backend-service:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://backend-service:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Building and Pushing Images

```bash
# Set your Docker registry
export REGISTRY="your-registry.io"
export IMAGE_TAG="v1.0.0"

# Build backend image
docker build -t $REGISTRY/workflow-builder-backend:$IMAGE_TAG -f backend-java/Dockerfile ./backend-java
docker push $REGISTRY/workflow-builder-backend:$IMAGE_TAG

# Build frontend image
docker build -t $REGISTRY/workflow-builder-frontend:$IMAGE_TAG \
    --build-arg VITE_API_BASE_URL=https://api.yourdomain.com/api \
    --build-arg VITE_WS_URL=wss://api.yourdomain.com/ws \
    -f frontend/Dockerfile .
docker push $REGISTRY/workflow-builder-frontend:$IMAGE_TAG
```

## Database Setup

### PostgreSQL (Recommended for Production)

#### Option 1: Managed Database Service

Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, Azure Database):
- Create database instance
- Note connection string
- Configure security groups/firewall rules

#### Option 2: PostgreSQL in Kubernetes

Deploy PostgreSQL using Helm:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgresql bitnami/postgresql \
    --set auth.postgresPassword=your-secure-password \
    --set auth.database=workflows \
    --set persistence.size=20Gi
```

Get connection details:
```bash
export POSTGRES_PASSWORD=$(kubectl get secret postgresql -o jsonpath="{.data.postgres-password}" | base64 -d)
export POSTGRES_HOST=postgresql.default.svc.cluster.local
export SPRING_DATASOURCE_URL="jdbc:postgresql://${POSTGRES_HOST}:5432/workflows"
```

### Database Initialization

The Spring Boot application applies the JPA schema on startup (`spring.jpa.hibernate.ddl-auto=update` by default). For manual SQL against PostgreSQL, use `psql` or your DB admin tool instead of the legacy Python `init_db` helper.

## Kubernetes Manifests

### Namespace

Create `k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: workflow-builder
  labels:
    name: workflow-builder
```

### ConfigMap

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: workflow-builder-config
  namespace: workflow-builder
data:
  SPRING_PROFILES_ACTIVE: "production"
  SPRING_DATASOURCE_URL: "jdbc:postgresql://postgresql:5432/workflows"
  SPRING_DATASOURCE_USERNAME: "postgres"
  SPRING_JPA_DATABASE_PLATFORM: "org.hibernate.dialect.PostgreSQLDialect"
  SPRING_DATASOURCE_DRIVER_CLASS_NAME: "org.postgresql.Driver"
  LOGGING_LEVEL_ROOT: "INFO"
  CORS_ALLOWED_ORIGINS: "https://yourdomain.com"
  EXECUTION_TIMEOUT_SECONDS: "300"
  EXECUTION_MAX_CONCURRENT: "10"
  WEBSOCKET_PING_INTERVAL_SECONDS: "20"
  WEBSOCKET_TIMEOUT_SECONDS: "60"
```

### Secrets

Create `k8s/secrets.yaml` (use sealed-secrets or external-secrets operator in production):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: workflow-builder-secrets
  namespace: workflow-builder
type: Opaque
stringData:
  # LLM API Keys (optional, can be configured via UI)
  OPENAI_API_KEY: "your-openai-key"
  ANTHROPIC_API_KEY: "your-anthropic-key"
  GEMINI_API_KEY: "your-gemini-key"
  
  # Database password (if not using managed service)
  POSTGRES_PASSWORD: "your-secure-password"
  
  # JWT Secret (for authentication)
  JWT_SECRET: "your-jwt-secret-key-change-in-production"
```

**Important**: In production, use:
- Sealed Secrets: `kubeseal` to encrypt secrets
- External Secrets Operator: Integrate with Vault/AWS Secrets Manager
- Never commit plain-text secrets to git

### Backend Deployment

Create `k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-builder-backend
  namespace: workflow-builder
  labels:
    app: workflow-builder-backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: workflow-builder-backend
  template:
    metadata:
      labels:
        app: workflow-builder-backend
    spec:
      containers:
      - name: backend
        image: your-registry.io/workflow-builder-backend:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: SPRING_PROFILES_ACTIVE
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: SPRING_PROFILES_ACTIVE
        - name: SPRING_DATASOURCE_URL
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: SPRING_DATASOURCE_URL
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: SPRING_DATASOURCE_USERNAME
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: workflow-builder-secrets
              key: POSTGRES_PASSWORD
        - name: SPRING_JPA_DATABASE_PLATFORM
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: SPRING_JPA_DATABASE_PLATFORM
        - name: SPRING_DATASOURCE_DRIVER_CLASS_NAME
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: SPRING_DATASOURCE_DRIVER_CLASS_NAME
        - name: LOGGING_LEVEL_ROOT
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: LOGGING_LEVEL_ROOT
        - name: CORS_ALLOWED_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: CORS_ALLOWED_ORIGINS
        - name: EXECUTION_TIMEOUT_SECONDS
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: EXECUTION_TIMEOUT_SECONDS
        - name: EXECUTION_MAX_CONCURRENT
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: EXECUTION_MAX_CONCURRENT
        - name: WEBSOCKET_PING_INTERVAL_SECONDS
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: WEBSOCKET_PING_INTERVAL_SECONDS
        - name: WEBSOCKET_TIMEOUT_SECONDS
          valueFrom:
            configMapKeyRef:
              name: workflow-builder-config
              key: WEBSOCKET_TIMEOUT_SECONDS
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: workflow-builder-secrets
              key: JWT_SECRET
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: workflow-builder-secrets
              key: OPENAI_API_KEY
              optional: true
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: workflow-builder-secrets
              key: ANTHROPIC_API_KEY
              optional: true
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: workflow-builder-secrets
              key: GEMINI_API_KEY
              optional: true
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        # Java backend logs only to stdout/stderr (see logback-spring.xml); no log file volume.
```

### Backend Service

Create `k8s/backend-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: workflow-builder-backend
  namespace: workflow-builder
  labels:
    app: workflow-builder-backend
spec:
  type: ClusterIP
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
    name: http
  selector:
    app: workflow-builder-backend
```

### Frontend Deployment

Create `k8s/frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-builder-frontend
  namespace: workflow-builder
  labels:
    app: workflow-builder-frontend
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: workflow-builder-frontend
  template:
    metadata:
      labels:
        app: workflow-builder-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry.io/workflow-builder-frontend:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          name: http
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Frontend Service

Create `k8s/frontend-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: workflow-builder-frontend
  namespace: workflow-builder
  labels:
    app: workflow-builder-frontend
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  selector:
    app: workflow-builder-frontend
```

### Ingress

Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: workflow-builder-ingress
  namespace: workflow-builder
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/websocket-services: workflow-builder-backend
spec:
  tls:
  - hosts:
    - yourdomain.com
    - api.yourdomain.com
    secretName: workflow-builder-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: workflow-builder-frontend
            port:
              number: 80
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: workflow-builder-backend
            port:
              number: 8000
```

### Health Check Endpoint

The Java API exposes `GET /health` (see `HealthController` in `backend-java`). Probes in `k8s/backend-deployment.yaml` target that path on port 8000.

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets

**Important**: Use sealed-secrets or external-secrets in production!

```bash
# Create secrets manually (for development)
kubectl create secret generic workflow-builder-secrets \
    --from-literal=OPENAI_API_KEY=your-key \
    --from-literal=POSTGRES_PASSWORD=your-password \
    --from-literal=JWT_SECRET=your-jwt-secret-min-256-bits \
    --namespace=workflow-builder

# Or apply secrets.yaml (development only)
kubectl apply -f k8s/secrets.yaml
```

### 3. Create ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Deploy Backend

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
```

### 5. Deploy Frontend

```bash
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

### 6. Deploy Ingress

```bash
kubectl apply -f k8s/ingress.yaml
```

### 7. Verify Deployment

```bash
# Check pods
kubectl get pods -n workflow-builder

# Check services
kubectl get svc -n workflow-builder

# Check ingress
kubectl get ingress -n workflow-builder

# View logs
kubectl logs -f deployment/workflow-builder-backend -n workflow-builder
kubectl logs -f deployment/workflow-builder-frontend -n workflow-builder
```

## Health Checks & Monitoring

### Health Check Endpoints

- Backend: `http://backend-service:8000/health`
- Frontend: `http://frontend-service:80/`

### Monitoring Setup

#### Prometheus metrics (optional)

Expose **Micrometer** metrics from Spring Boot (for example enable the **Prometheus** registry in `backend-java` and scrape **`/actuator/prometheus`**). Wire a `ServiceMonitor` only after the actuator endpoint is actually served by your image.

#### ServiceMonitor (if using Prometheus Operator)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: workflow-builder-backend
  namespace: workflow-builder
spec:
  selector:
    matchLabels:
      app: workflow-builder-backend
  endpoints:
  - port: http
    path: /metrics
```

### Logging

Logs are available via:
```bash
# Backend logs
kubectl logs -f deployment/workflow-builder-backend -n workflow-builder

# Frontend logs
kubectl logs -f deployment/workflow-builder-frontend -n workflow-builder

# All logs
kubectl logs -f -l app=workflow-builder-backend -n workflow-builder
```

For production, integrate with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki** (Grafana Loki)
- **Cloud Logging** (GCP Cloud Logging, AWS CloudWatch)

## Scaling & Performance

### Horizontal Pod Autoscaling

Create `k8s/hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: workflow-builder-backend-hpa
  namespace: workflow-builder
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: workflow-builder-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Resource Recommendations

**Backend:**
- Requests: 512Mi memory, 500m CPU
- Limits: 2Gi memory, 2000m CPU
- Replicas: 3+ for high availability

**Frontend:**
- Requests: 128Mi memory, 100m CPU
- Limits: 256Mi memory, 500m CPU
- Replicas: 2+ for high availability

### Database connection pooling

Tune **HikariCP** / JDBC via Spring Boot properties (e.g. `spring.datasource.hikari.maximum-pool-size`) in `application-production.properties` or your ConfigMap—see Spring Boot docs for datasource tuning.

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n workflow-builder

# Check logs
kubectl logs <pod-name> -n workflow-builder

# Check events
kubectl get events -n workflow-builder --sort-by='.lastTimestamp'
```

#### 2. Database Connection Issues

```bash
# From inside the backend pod, hit health (includes DB checks if configured)
kubectl exec -it <backend-pod> -n workflow-builder -- curl -sf http://127.0.0.1:8000/health

kubectl get svc postgresql -n workflow-builder
```

#### 3. WebSocket Issues

- Ensure ingress supports WebSocket upgrades
- Check nginx annotations for WebSocket support
- Verify backend WebSocket endpoint is accessible

#### 4. Image Pull Errors

```bash
# Check image pull secrets
kubectl get secrets -n workflow-builder

# Create image pull secret if needed
kubectl create secret docker-registry regcred \
    --docker-server=your-registry.io \
    --docker-username=your-username \
    --docker-password=your-password \
    --namespace=workflow-builder
```

#### 5. CORS Issues

- Verify CORS_ORIGINS in ConfigMap matches your domain
- Check backend logs for CORS errors
- Ensure frontend API_BASE_URL matches backend domain

### Debugging Commands

```bash
# Port forward for local testing
kubectl port-forward svc/workflow-builder-backend 8000:8000 -n workflow-builder
kubectl port-forward svc/workflow-builder-frontend 3000:80 -n workflow-builder

# Execute commands in pod
kubectl exec -it <pod-name> -n workflow-builder -- /bin/sh

# View resource usage
kubectl top pods -n workflow-builder
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and push backend
      run: |
        docker build -t ${{ secrets.REGISTRY }}/workflow-builder-backend:${{ github.sha }} -f backend-java/Dockerfile ./backend-java
        docker push ${{ secrets.REGISTRY }}/workflow-builder-backend:${{ github.sha }}
    
    - name: Build and push frontend
      run: |
        docker build -t ${{ secrets.REGISTRY }}/workflow-builder-frontend:${{ github.sha }} \
          --build-arg VITE_API_BASE_URL=${{ secrets.API_BASE_URL }} \
          -f frontend/Dockerfile .
        docker push ${{ secrets.REGISTRY }}/workflow-builder-frontend:${{ github.sha }}
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/workflow-builder-backend \
          backend=${{ secrets.REGISTRY }}/workflow-builder-backend:${{ github.sha }} \
          -n workflow-builder
        kubectl set image deployment/workflow-builder-frontend \
          frontend=${{ secrets.REGISTRY }}/workflow-builder-frontend:${{ github.sha }} \
          -n workflow-builder
```

## Security Best Practices

1. **Secrets Management**: Use sealed-secrets or external-secrets operator
2. **Network Policies**: Implement network policies to restrict pod communication
3. **RBAC**: Use least-privilege service accounts
4. **Image Security**: Scan images for vulnerabilities
5. **TLS**: Always use TLS in production
6. **Resource Limits**: Set appropriate resource limits
7. **Pod Security Policies**: Enforce pod security standards

## Backup & Disaster Recovery

### Database Backups

```bash
# PostgreSQL backup
kubectl exec -it postgresql-0 -- pg_dump -U postgres workflows > backup.sql

# Restore
kubectl exec -i postgresql-0 -- psql -U postgres workflows < backup.sql
```

### Persistent Volumes

For production, use persistent volumes for database:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgresql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
```

## Support & Resources

- Kubernetes Documentation: https://kubernetes.io/docs/
- Spring Boot on Kubernetes: https://spring.io/guides/gs/spring-boot-kubernetes/
- Nginx Ingress: https://kubernetes.github.io/ingress-nginx/
