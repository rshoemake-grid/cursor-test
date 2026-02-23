# Kubernetes Manifests

This directory contains Kubernetes manifests for deploying the Agentic Workflow Builder application.

## Quick Start

```bash
# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create secrets (update with your values)
kubectl apply -f secrets.yaml

# 3. Create configmap (update with your values)
kubectl apply -f configmap.yaml

# 4. Deploy backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# 5. Deploy frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# 6. Deploy ingress
kubectl apply -f ingress.yaml
```

## File Structure

- `namespace.yaml` - Kubernetes namespace
- `configmap.yaml` - Application configuration
- `secrets.yaml` - Sensitive data (DO NOT COMMIT REAL SECRETS)
- `backend-deployment.yaml` - Backend application deployment
- `backend-service.yaml` - Backend service
- `frontend-deployment.yaml` - Frontend application deployment
- `frontend-service.yaml` - Frontend service
- `ingress.yaml` - Ingress configuration
- `hpa.yaml` - Horizontal Pod Autoscaler (optional)

## Customization

Before deploying, update:

1. **Image names** in deployment files (replace `your-registry.io`)
2. **ConfigMap** values (database URL, CORS origins, etc.)
3. **Secrets** (API keys, passwords)
4. **Ingress** hostnames and TLS certificates
5. **Resource limits** based on your cluster capacity

## Production Checklist

- [ ] Use sealed-secrets or external-secrets for secrets management
- [ ] Configure proper resource limits
- [ ] Set up monitoring and alerting
- [ ] Configure database backups
- [ ] Set up TLS certificates
- [ ] Configure network policies
- [ ] Set up log aggregation
- [ ] Configure horizontal pod autoscaling
- [ ] Test disaster recovery procedures
