# DevOps Implementation Report (DIR-R)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Senior DevOps Engineer  
**Date:** 19 February 2026  

---

## 1. LOCAL DEVELOPMENT ENVIRONMENT

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      DEPLOY_TARGET: ${DEPLOY_TARGET}
      SECRETS_BACKEND: ${SECRETS_BACKEND}
      CONTAINER_REGISTRY: ${CONTAINER_REGISTRY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    environment:
      NODE_ENV: development
      BACKEND_URL: http://localhost:3000
      DEPLOY_TARGET: ${DEPLOY_TARGET}
      CONTAINER_REGISTRY: ${CONTAINER_REGISTRY}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

  mock-secrets:
    image: node:18-alpine
    command: sh -c "npm install -g http-server && http-server -p 8080 /mock"
    volumes:
      - ./mock:/mock
    ports:
      - "8080:8080"
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### `.env.example`

```env
# Deployment Target
DEPLOY_TARGET=onprem

# Secrets Management
SECRETS_BACKEND=env-file

# Container Registry
CONTAINER_REGISTRY=localhost:5000

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=va_ambulance_db
DB_HOST=localhost
DB_PORT=5432

# Backend
JWT_SECRET=supersecretkey
NODE_ENV=development

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### `Makefile`

```makefile
.PHONY: dev test build migrate seed clean deploy deploy-cloud deploy-onprem

dev:
	docker-compose up -d

test:
	docker-compose run --rm backend npm test

build:
	docker-compose build

migrate:
	docker-compose run --rm backend npm run migrate

seed:
	docker-compose run --rm backend npm run seed

clean:
	docker-compose down

deploy:
	@echo "Deploying to $(DEPLOY_TARGET)"
	@if [ "$(DEPLOY_TARGET)" = "cloud" ]; then \
		$(MAKE) deploy-cloud; \
	elif [ "$(DEPLOY_TARGET)" = "onprem" ]; then \
		$(MAKE) deploy-onprem; \
	else \
		echo "Invalid DEPLOY_TARGET. Must be 'cloud' or 'onprem'."; \
		exit 1; \
	fi

deploy-cloud:
	@echo "Deploying to cloud..."
	helm upgrade --install va-ambulance ./helm-chart -f ./helm-chart/values.cloud.yaml

deploy-onprem:
	@echo "Deploying to on-prem..."
	helm upgrade --install va-ambulance ./helm-chart -f ./helm-chart/values.onprem.yaml
```

### First-Time Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/va-ambulance-trip-analysis.git
   cd va-ambulance-trip-analysis
   ```

2. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Start local development stack:
   ```bash
   make dev
   ```

4. Run migrations:
   ```bash
   make migrate
   ```

5. Seed database (optional):
   ```bash
   make seed
   ```

6. Access services:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:3000
   - PostgreSQL: localhost:5432

---

## 2. DOCKERFILE IMPLEMENTATIONS

### Backend `Dockerfile`

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
```

### Frontend `Dockerfile`

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app

# Copy built app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

### Data Plane `Dockerfile` (Optional)

```dockerfile
FROM postgres:15-alpine

COPY init.sql /docker-entrypoint-initdb.d/
```

---

## 3. INFRASTRUCTURE AS CODE

### Module Structure

```
infra/
├── modules/
│   ├── kubernetes/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── database/
│   │   └── postgresql.tf
│   └── secrets/
│       └── secrets.tf
├── cloud/
│   ├── main.tf
│   └── variables.tf
├── onprem/
│   ├── main.tf
│   └── vars.yml
└── variables.tf
```

### Variables File (`infra/variables.tf`)

```hcl
variable "deploy_target" {
  description = "Target deployment environment: 'cloud' or 'onprem'"
  type        = string
  default     = "onprem"
}

variable "container_registry" {
  description = "Container registry URL"
  type        = string
  default     = "localhost:5000"
}

variable "backup_storage_path" {
  description = "Path to backup storage (e.g., NFS mount or S3 bucket)"
  type        = string
  default     = "/backups"
}
```

### README: Using Cloud vs On-Prem Modules

To deploy using cloud infrastructure:

```bash
cd infra/cloud
terraform apply
```

To deploy using on-prem infrastructure:

```bash
cd infra/onprem
ansible-playbook site.yml
```

---

## 4. KUBERNETES MANIFESTS

### Standard Kubernetes Manifests

#### Deployment (`deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ${CONTAINER_REGISTRY}/backend:latest
        ports:
        - containerPort: 3000
        volumeMounts:
        - name: secrets-volume
          mountPath: /secrets
          readOnly: true
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
      volumes:
      - name: secrets-volume
        emptyDir: {}
      securityContext:
        runAsNonRoot: true
        readOnlyRootFilesystem: true
```

#### Service (`service.yaml`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

#### Ingress (`ingress.yaml`)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: backend-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
```

#### Secrets (`secrets.yaml`)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
type: Opaque
data:
  JWT_SECRET: <base64-encoded>
```

> ⚠️ **Note**: Secrets are injected via init container pattern — not via CSI drivers or cloud-specific APIs.

---

## 5. HELM CHART

### Chart.yaml

```yaml
apiVersion: v2
name: va-ambulance
description: Helm chart for VA Ambulance Trip Analysis
version: 0.1.0
appVersion: "1.0"
```

### values.yaml

```yaml
replicaCount: 2

image:
  repository: ${CONTAINER_REGISTRY}/backend
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

### values.cloud.yaml

```yaml
image:
  repository: myregistry.azurecr.io/backend
  tag: latest

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 200m
    memory: 256Mi
```

### values.onprem.yaml

```yaml
image:
  repository: localhost:5000/backend
  tag: latest
```

### Deploy Command

```bash
helm upgrade --install va-ambulance ./helm-chart -f ./helm-chart/values.$DEPLOY_TARGET.yaml
```

---

## 6. SECRETS MANAGEMENT (DEPLOYMENT-AGNOSTIC)

### Generic Secrets Interface

Applications read secrets from `/secrets/` mount path.

### Supported Backends

| Backend                | Description                            |
|-----------------------|----------------------------------------|
| `vault`               | HashiCorp Vault (on-prem or self-hosted) |
| `azure-keyvault`      | Azure Key Vault (Cloud Reference)      |
| `aws-secrets-manager` | AWS Secrets Manager (Cloud Reference)  |
| `env-file`            | Local `.env` file (development only)   |

### Init Container Example (Vault)

```yaml
initContainers:
- name: init-secrets
  image: hashicorp/vault:latest
  command:
    - /bin/sh
    - -c
    - |
      vault login token=$VAULT_TOKEN
      vault kv get -field=jwt_secret secret/backend/jwt > /secrets/jwt_secret
  volumeMounts:
    - name: secrets-volume
      mountPath: /secrets
  env:
    - name: VAULT_TOKEN
      valueFrom:
        secretKeyRef:
          name: vault-token
          key: token
```

> 🔐 **Note**: This approach works with any backend — no cloud CSI required.

---

## 7. MONITORING & ALERTING (DEPLOYMENT-AGNOSTIC)

### Prometheus Stack

#### prometheus.yml

```yaml
scrape_configs:
- job_name: backend
  kubernetes_sd_configs:
  - role: pod
  relabel_configs:
  - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
    action: keep
    regex: true
```

#### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "VA Ambulance Trip Analysis",
    "panels": [
      {
        "title": "API Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

#### Alert Rules

```yaml
groups:
- name: backend.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 2m
    labels:
      severity: page
    annotations:
      summary: "High error rate detected"
```

#### Notification Webhook

Set `ALERT_WEBHOOK_URL` to point to Slack, Teams, PagerDuty, or email relay.

---

## 8. DISASTER RECOVERY

### Database Backup Strategy

Use `pg_dump` with cron job.

```bash
0 2 * * * pg_dump -h db -U user va_ambulance_db > /backups/db-backup-$(date +\%Y\%m\%d).sql
```

### Backup Storage

- **Cloud**: S3 bucket URL
- **On-prem**: NFS mount or local path

### Restore Procedure

1. Stop application pods.
2. Restore from backup file.
3. Restart pods.

### RTO/RPO Targets

- **RTO**: 30 minutes
- **RPO**: 1 hour

### Backup Verification Cron Job

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-verify
spec:
  schedule: "0 0 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: verify
            image: postgres:15
            command: ["sh", "-c", "psql -c 'SELECT 1;'"]
          restartPolicy: OnFailure
```

---

## 9. CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Build image
      run: docker build -t backend .
    - name: Push to registry
      run: docker push myregistry.azurecr.io/backend
    - name: Deploy to Kubernetes
      run: |
        helm upgrade --install va-ambulance ./helm-chart \
          -f ./helm-chart/values.$DEPLOY_TARGET.yaml
```

--- 

Let me know if you'd like this exported as a downloadable `.md` file or need templates for specific cloud providers like AWS, GCP, or Azure!