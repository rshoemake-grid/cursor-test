# Kubernetes Manifests

This directory contains Kubernetes manifests for deploying the Agentic Workflow Builder application.

## Quick Start

```bash
# 0. Create secrets from template (required before deploy)
cp secrets.yaml.example secrets.yaml
# Edit secrets.yaml with your API keys, then:
kubectl apply -f secrets.yaml

# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create configmap (update SPRING_DATASOURCE_*, CORS_ALLOWED_ORIGINS in configmap.yaml first)
kubectl apply -f configmap.yaml

# 3. Deploy backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# 4. Deploy frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# 5. Deploy ingress (optional - for external access)
kubectl apply -f ingress.yaml
```

## File Structure

- `namespace.yaml` - Kubernetes namespace
- `configmap.yaml` - Application configuration
- `secrets.yaml.example` - Secrets template (copy to secrets.yaml, fill in, then apply)
- `secrets.yaml` - Sensitive data (create from example, DO NOT COMMIT REAL SECRETS)
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
