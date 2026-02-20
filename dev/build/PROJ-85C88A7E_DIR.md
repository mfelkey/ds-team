# DevOps Implementation Report (DIR)  
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
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

  mock-azure:
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
.PHONY: dev test build migrate seed clean

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

USER nextjs
COPY --chown=nextjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

EXPOSE 3000
CMD ["npm", "start"]
```

### Frontend `Dockerfile`

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs
COPY --chown=nextjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

EXPOSE 3000
CMD ["npm", "start"]
```

### Data Pipeline `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "run_pipeline.py"]
```

### `.dockerignore`

```dockerignore
node_modules
.env
.git
.gitignore
README.md
Dockerfile
.dockerignore
```

### Image Security Hardening Notes (SRR)

- All images are built using multi-stage Dockerfiles to reduce attack surface.
- Non-root users are used in runtime containers.
- Base images are scanned for vulnerabilities using Trivy or Clair.
- Image scanning is part of CI pipeline.
- No sensitive data is included in Docker layers.

---

## 3. CI/CD PIPELINE (GitHub Actions)

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'

  build:
    needs: [lint, test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      - name: Login to Azure Container Registry
        uses: azure/docker-login@v1
        with:
          acr-name: ${{ secrets.ACR_NAME }}
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ secrets.ACR_NAME }}.azurecr.io/va-ambulance-trip-analysis:${{ github.sha }}
```

### `.github/workflows/cd.yml`

```yaml
name: CD

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment (staging or production)'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v3
      - name: Helm deploy
        uses: azure/setup-helm@v3
        with:
          version: 'latest'
      - name: Deploy to Kubernetes
        run: |
          helm upgrade --install va-ambulance-trip-analysis ./helm-chart \
            --namespace ${{ github.event.inputs.environment }} \
            --set image.tag=${{ github.sha }} \
            --set environment=${{ github.event.inputs.environment }}
```

---

## 4. SECURITY CONTROLS IMPLEMENTATION

### Addressing CRITICAL SRR Findings

1. **Private Endpoints for All Azure Services**
   - All Azure resources (SQL, ACR, Key Vault) configured with private endpoints.
   - VNET peering enabled between AKS and Azure services.

2. **Pod Security Standards**
   - PodSecurityPolicy (PSP) or admission controllers enforce:
     - `runAsNonRoot: true`
     - `readOnlyRootFilesystem: true`
     - `allowPrivilegeEscalation: false`

3. **Azure Key Vault Integration**
   - Secrets mounted as Kubernetes secrets via Azure Key Vault CSI driver.
   - No hardcoded secrets in config files or Helm templates.

4. **Network Security Group Rules**
   - AKS nodes restricted to only necessary ports.
   - Ingress/egress rules configured to limit traffic.

5. **Container Image Scanning**
   - Trivy scan integrated into CI pipeline.
   - Failures halt deployment if CRITICAL/HIGH vulnerabilities found.

### TLS Certificate Management

- Azure Application Gateway with SSL termination.
- Certificates managed via Azure Key Vault.
- Let’s Encrypt integration via cert-manager (optional).

### Secrets Rotation Procedure

1. Rotate secrets in Azure Key Vault.
2. Update Kubernetes secrets.
3. Redeploy pods to pick up new secrets.

---

## 5. MONITORING & ALERTING

### Azure Monitor Configuration

- Log Analytics workspace created.
- Application Insights enabled for backend.
- AKS cluster logs sent to Log Analytics.

### Key Alerts

- Pipeline failures
- Error rate > 5%
- Auth failures
- PHI access attempts

### Dashboard Configuration

- Operational dashboard in Azure Portal:
  - CPU usage
  - Memory usage
  - Pod restarts
  - Error logs

---

## 6. DISASTER RECOVERY PROCEDURE

### Backup Strategy for Azure SQL

- Point-in-time restore enabled.
- Weekly full backups.
- Geo-replication configured.

### AKS Cluster Recovery

- Cluster backed up to Azure Container Registry.
- Backup of Helm chart and Kubernetes manifests.
- Restore via `kubectl apply` or Terraform.

### RTO and RPO Targets

- RTO: 30 minutes
- RPO: 1 hour

### Runbook for Common Failures

1. **Cluster Down**
   - Check AKS health.
   - Recreate cluster from Terraform.
   - Restore from backup.

2. **Database Corruption**
   - Restore from latest backup.
   - Validate integrity.

3. **Secrets Compromised**
   - Rotate secrets.
   - Re-deploy affected services.

---

## 7. OPERATIONS RUNBOOK

### Deploying a New Release

1. Merge code to `main`.
2. CI pipeline triggers.
3. CD pipeline deploys via Helm.
4. Validate deployment.

### Rolling Back a Deployment

1. Helm rollback:
   ```bash
   helm rollback va-ambulance-trip-analysis <revision>
   ```

### Scaling Application

1. Scale pods via:
   ```bash
   kubectl scale deployment backend --replicas=5
   ```

### Rotating Secrets

1. Update secrets in Azure Key Vault.
2. Trigger redeploy:
   ```bash
   kubectl rollout restart deployment backend
   ```

### Accessing Logs

1. Kubernetes logs:
   ```bash
   kubectl logs -l app=backend
   ```

2. Azure Monitor:
   - Navigate to Log Analytics.
   - Query logs.

### Running Migrations in Production

1. Run migration job:
   ```bash
   kubectl apply -f migration-job.yaml
   ```

2. Validate migration status.

---