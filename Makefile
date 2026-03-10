# Agentic Workflow Builder - Build & Deploy
# Usage: make build-backend, make build-frontend, make deploy

REGISTRY ?= your-registry.io
IMAGE_TAG ?= latest
NAMESPACE ?= workflow-builder

.PHONY: build-backend build-frontend build-all push-backend push-frontend deploy

build-backend:
	docker build -t $(REGISTRY)/workflow-builder-backend:$(IMAGE_TAG) -f backend/Dockerfile .

build-frontend:
	docker build -t $(REGISTRY)/workflow-builder-frontend:$(IMAGE_TAG) -f frontend/Dockerfile .

build-all: build-backend build-frontend

push-backend: build-backend
	docker push $(REGISTRY)/workflow-builder-backend:$(IMAGE_TAG)

push-frontend: build-frontend
	docker push $(REGISTRY)/workflow-builder-frontend:$(IMAGE_TAG)

deploy:
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/configmap.yaml
	@test -f k8s/secrets.yaml && kubectl apply -f k8s/secrets.yaml || echo "⚠️  Create k8s/secrets.yaml from k8s/secrets.yaml.example"
	kubectl apply -f k8s/backend-deployment.yaml
	kubectl apply -f k8s/backend-service.yaml
	kubectl apply -f k8s/frontend-deployment.yaml
	kubectl apply -f k8s/frontend-service.yaml
	kubectl apply -f k8s/ingress.yaml
	kubectl apply -f k8s/hpa.yaml
